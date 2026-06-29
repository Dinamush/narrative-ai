"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Sparkles } from "lucide-react"
import type { DramaticModel } from "@narrative-ai/graph-schema"
import { applyStyleToWork, segmentManuscript } from "@narrative-ai/narrative-engine"
import { DramaticModelSelector } from "@/components/dramatic-arc/dramatic-model-selector"
import { TensionChart } from "@/components/dramatic-arc/tension-chart"
import { ThemePanel } from "@/components/dramatic-arc/theme-panel"
import { WavelengthPanel } from "@/components/dramatic-arc/wavelength-panel"
import { useNarrativeStore } from "@/stores/narrative-graph-store"

const tabs = [
  { href: "structure", label: "Structure" },
  { href: "characters", label: "Characters" },
  { href: "arc", label: "Arc" },
  { href: "diagnostics", label: "Diagnostics" },
]

export default function ArcPage() {
  const params = useParams<{ id: string }>()
  const work = useNarrativeStore((s) => s.work)
  const isLoading = useNarrativeStore((s) => s.isLoading)
  const loadWork = useNarrativeStore((s) => s.loadWork)
  const setWork = useNarrativeStore((s) => s.setWork)
  const saveWork = useNarrativeStore((s) => s.saveWork)

  const [model, setModel] = useState<DramaticModel>("freytag")
  const [isRecalculating, setIsRecalculating] = useState(false)

  useEffect(() => {
    if (params.id) loadWork(params.id)
  }, [params.id, loadWork])

  useEffect(() => {
    if (work?.metadata.structureModel) {
      setModel(work.metadata.structureModel)
    }
  }, [work?.metadata.structureModel])

  const hasAnalysis = (work?.analysis.dramaticArc.tensionSeries.length ?? 0) > 0

  const styleIssues = useMemo(() => {
    if (!work) return []
    return work.analysis.plotIssues.filter((i) =>
      ["tension_mismatch", "wavelength_spike", "theme_drift"].includes(i.type)
    )
  }, [work])

  const handleModelChange = useCallback(
    async (nextModel: DramaticModel) => {
      if (!work) return
      setModel(nextModel)
      setIsRecalculating(true)

      try {
        const { scenes } = segmentManuscript(work.rawText)
        const styled = applyStyleToWork(work, scenes, nextModel)
        setWork(styled)
        await saveWork()
      } finally {
        setIsRecalculating(false)
      }
    },
    [work, setWork, saveWork]
  )

  if (isLoading || !work) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading project…
      </div>
    )
  }

  const climaxSegment = work.analysis.dramaticArc.climaxSceneId
    ? work.graph.timeline.segments.find(
        (s) => s.sceneId === work.analysis.dramaticArc.climaxSceneId
      )
    : null

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-4 left-4 right-4 z-50 mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-elevated/90 px-4 py-3 backdrop-blur-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--accent-teal)]">
            Dramatic arc
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
                tab.href === "arc"
                  ? "bg-overlay text-foreground"
                  : "text-muted hover:bg-overlay hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-6 px-4 pt-28 pb-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6" aria-label="Tension timeline">
          {!hasAnalysis ? (
            <div className="rounded-xl border border-border bg-elevated p-8 text-center">
              <Sparkles
                className="mx-auto h-8 w-8 text-accent"
                aria-hidden="true"
              />
              <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-xl font-semibold">
                No arc data yet
              </h2>
              <p className="mt-2 text-sm text-muted">
                Run structure analysis first to compute tension, themes, and wavelength drift.
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
                      Tension timeline
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Measured scene tension vs. dramatic model target curve
                    </p>
                  </div>
                  <DramaticModelSelector
                    value={model}
                    onChange={handleModelChange}
                    disabled={isRecalculating}
                  />
                </div>
                <div className="mt-6">
                  <TensionChart work={work} />
                </div>
                {climaxSegment ? (
                  <p className="mt-4 text-sm text-muted">
                    Climax scene: Chapter {climaxSegment.position.chapterIndex},{" "}
                    Scene {climaxSegment.position.syuzhetIndex + 1}
                    {work.analysis.dramaticArc.turningPoints.length > 0 ? (
                      <>
                        {" · "}
                        {work.analysis.dramaticArc.turningPoints.length} turning point
                        {work.analysis.dramaticArc.turningPoints.length === 1 ? "" : "s"}
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-border bg-elevated p-5">
                <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                  Register profile
                </h2>
                <p className="mt-1 text-sm text-muted">
                  MDA register dimensions averaged across scenes
                </p>
                <RegisterBars work={work} />
              </div>
            </>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-elevated p-5">
            <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
              Themes
            </h2>
            <div className="mt-4">
              <ThemePanel work={work} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-elevated p-5">
            <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
              Wavelength drift
            </h2>
            <p className="mt-1 text-xs text-muted">
              Lexical fingerprint shifts within chapters
            </p>
            <div className="mt-4">
              <WavelengthPanel work={work} />
            </div>
          </div>

          {styleIssues.length > 0 ? (
            <div className="rounded-xl border border-[var(--semantic-warning)]/40 bg-elevated p-5">
              <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                Style diagnostics
              </h2>
              <ul className="mt-4 space-y-2">
                {styleIssues.map((issue) => (
                  <li key={issue.id} className="text-sm text-muted">
                    <span className="text-[var(--semantic-warning)]">
                      {issue.type.replace(/_/g, " ")}
                    </span>
                    {" · "}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </main>
    </div>
  )
}

const REGISTER_LABELS = ["Narrativity", "Orality", "Informational", "Argumentation"]

const RegisterBars = ({ work }: { work: import("@narrative-ai/graph-schema").NarrativeWork }) => {
  const timeline = work.graph.styleTimeline

  if (timeline.length === 0) {
    return <p className="mt-4 text-sm text-muted">No register data available.</p>
  }

  const avg = {
    narrativity: 0,
    orality: 0,
    informational: 0,
    argumentation: 0,
  }

  for (const entry of timeline) {
    avg.narrativity += entry.registerMDA.narrativity
    avg.orality += entry.registerMDA.orality
    avg.informational += entry.registerMDA.informational
    avg.argumentation += entry.registerMDA.argumentation
  }

  const count = timeline.length
  const values = [
    avg.narrativity / count,
    avg.orality / count,
    avg.informational / count,
    avg.argumentation / count,
  ]

  return (
    <ul className="mt-4 space-y-3">
      {REGISTER_LABELS.map((label, i) => (
        <li key={label}>
          <div className="flex justify-between text-xs text-muted">
            <span>{label}</span>
            <span>{(values[i] * 100).toFixed(0)}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-overlay">
            <div
              className="h-full rounded-full bg-[var(--accent-teal)]"
              style={{ width: `${values[i] * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
