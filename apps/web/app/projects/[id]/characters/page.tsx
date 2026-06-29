"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CharacterNetwork, getNodeById } from "@/components/character-network/character-network"
import { CharacterStateTimeline } from "@/components/character-network/character-state-timeline"
import { EgoProfilePanel } from "@/components/character-network/ego-profile-panel"
import { useNarrativeStore } from "@/stores/narrative-graph-store"

const tabs = [
  { href: "structure", label: "Structure" },
  { href: "characters", label: "Characters" },
  { href: "arc", label: "Arc" },
  { href: "diagnostics", label: "Diagnostics" },
]

export default function CharactersPage() {
  const params = useParams<{ id: string }>()
  const work = useNarrativeStore((s) => s.work)
  const isLoading = useNarrativeStore((s) => s.isLoading)
  const loadWork = useNarrativeStore((s) => s.loadWork)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) loadWork(params.id)
  }, [params.id, loadWork])

  useEffect(() => {
    if (work?.graph.characters.nodes.length && !selectedId) {
      setSelectedId(work.graph.characters.nodes[0].id)
    }
  }, [work, selectedId])

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const selectedCharacter = useMemo(() => {
    if (!work || !selectedId) return null
    return getNodeById(work.graph.characters, selectedId) ?? null
  }, [work, selectedId])

  if (isLoading || !work) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading project…
      </div>
    )
  }

  const charCount = work.graph.characters.nodes.length
  const edgeCount = work.graph.characters.edges.length
  const hasAnalysis = charCount > 0

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-4 left-4 right-4 z-50 mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-elevated/90 px-4 py-3 backdrop-blur-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--accent-teal)]">
            Character network
          </p>
          <h1 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
            {work.title}
          </h1>
        </div>
        <nav className="flex flex-wrap gap-1" aria-label="Project views">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={`/projects/${work.id}/${tab.href}`}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
                tab.href === "characters"
                  ? "bg-overlay text-foreground"
                  : "text-muted hover:bg-overlay hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-6 px-4 pt-28 pb-8 lg:grid-cols-[1fr_380px]">
        <section className="space-y-6" aria-label="Character relationship network">
          {!hasAnalysis ? (
            <div className="rounded-xl border border-border bg-elevated p-8 text-center">
              <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold">
                No characters detected yet
              </h2>
              <p className="mt-2 text-sm text-muted">
                Run structure analysis to identify characters, extract state snapshots, and score EgoQuest profiles.
              </p>
              <Link
                href={`/projects/${work.id}/structure`}
                className="mt-4 inline-block cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-[#0c0b0a] transition-opacity duration-200 hover:opacity-90"
              >
                Go to structure map
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-elevated p-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                      Relationship network
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {charCount} characters · {edgeCount} relationships
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <CharacterNetwork
                    graph={work.graph.characters}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#d4a054]" />
                    Protagonist
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#c45c4a]" />
                    Antagonist / conflict
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#5ba4a4]" />
                    Cooperative
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-elevated p-5">
                <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                  Arc trajectory
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Differentiation, shadow intensity, and circumstance across scenes
                </p>
                <div className="mt-4">
                  <CharacterStateTimeline character={selectedCharacter} />
                </div>
              </div>
            </>
          )}
        </section>

        <aside className="space-y-4">
          <EgoProfilePanel character={selectedCharacter} />

          {work.analysis.characterInsights.length > 0 ? (
            <div className="rounded-xl border border-border bg-elevated p-5">
              <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                Cast overview
              </h2>
              <ul className="mt-4 space-y-2">
                {work.analysis.characterInsights.map((insight) => {
                  const node = work.graph.characters.nodes.find(
                    (n) => n.id === insight.characterId
                  )
                  return (
                    <li key={insight.characterId}>
                      <button
                        type="button"
                        onClick={() => handleSelect(insight.characterId)}
                        className={`w-full cursor-pointer rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-200 ${
                          selectedId === insight.characterId
                            ? "border-accent bg-surface text-foreground"
                            : "border-border-subtle bg-surface text-muted hover:border-border hover:text-foreground"
                        }`}
                        aria-label={`Select ${node?.name ?? insight.characterId}`}
                      >
                        <span className="font-medium text-foreground">
                          {node?.name ?? insight.characterId}
                        </span>
                        {insight.arcShape ? (
                          <span className="ml-2 text-xs capitalize text-[var(--accent-teal)]">
                            {insight.arcShape.replace("_", " ")}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </aside>
      </main>
    </div>
  )
}
