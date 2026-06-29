"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Sparkles, AlertTriangle } from "lucide-react"
import { StoryEditor } from "@/components/story-editor/story-editor"
import { AnalysisProgressModal } from "@/components/analysis/analysis-progress-modal"
import { useAnalysis } from "@/hooks/use-analysis"
import { useNarrativeStore } from "@/stores/narrative-graph-store"

const tabs = [
  { href: "structure", label: "Structure" },
  { href: "characters", label: "Characters" },
  { href: "arc", label: "Arc" },
  { href: "diagnostics", label: "Diagnostics" },
]

export default function ProjectStructurePage() {
  const params = useParams<{ id: string }>()
  const work = useNarrativeStore((s) => s.work)
  const isLoading = useNarrativeStore((s) => s.isLoading)
  const loadWork = useNarrativeStore((s) => s.loadWork)
  const { runAnalysis, events, isAnalyzing } = useAnalysis()
  const [showModal, setShowModal] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [llmStatus, setLlmStatus] = useState<{
    available?: boolean
    provider?: string
    model?: string
    error?: string
  } | null>(null)

  useEffect(() => {
    if (params.id) loadWork(params.id)
  }, [params.id, loadWork])

  useEffect(() => {
    fetch("/api/llm/status")
      .then((res) => res.json())
      .then(setLlmStatus)
      .catch(() => setLlmStatus(null))
  }, [])

  const handleAnalyze = async () => {
    if (!work) return
    setAnalysisError(null)
    setShowModal(true)
    try {
      await runAnalysis(work)
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Analysis failed")
    }
  }

  if (isLoading || !work) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading project…
      </div>
    )
  }

  const fabulaCount = work.graph.fabula.nodes.length
  const issueCount = work.analysis.plotIssues.length

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-4 left-4 right-4 z-50 mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-elevated/90 px-4 py-3 backdrop-blur-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--accent-teal)]">
            Syuzhet + Fabula
          </p>
          <h1 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
            {work.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-1" aria-label="Project views">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={`/projects/${work.id}/${tab.href}`}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
                  tab.href === "structure"
                    ? "bg-overlay text-foreground"
                    : "text-muted hover:bg-overlay hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-[#0c0b0a] transition-colors duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Run fabula analysis"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {isAnalyzing ? "Analyzing…" : "Analyze structure"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-6 px-4 pt-28 pb-8 lg:grid-cols-[1fr_360px]">
        <section aria-label="Story structure editor">
          <StoryEditor work={work} />
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-elevated p-5">
            <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
              Overview
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Scenes</dt>
                <dd>{work.graph.syuzhet.nodes.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Fabula events</dt>
                <dd>{fabulaCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Characters</dt>
                <dd>{work.graph.characters.nodes.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Propositions</dt>
                <dd>{work.graph.propositions.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Extraction</dt>
                <dd className="capitalize">
                  {work.metadata.extractionMode ?? "not run"}
                  {work.metadata.llmModel
                    ? ` · ${work.metadata.llmModel}`
                    : null}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Plot issues</dt>
                <dd className={issueCount > 0 ? "text-[var(--semantic-warning)]" : ""}>
                  {issueCount}
                </dd>
              </div>
            </dl>
            {analysisError ? (
              <p className="mt-3 text-sm text-[var(--semantic-critical)]" role="alert">
                {analysisError}
              </p>
            ) : null}
            {llmStatus && !llmStatus.available && llmStatus.provider === "ollama" ? (
              <p className="mt-3 text-sm text-[var(--semantic-warning)]" role="status">
                Ollama unavailable{llmStatus.error ? `: ${llmStatus.error}` : ""}. Analysis will fall back to heuristics.
              </p>
            ) : llmStatus?.available && llmStatus.provider === "ollama" ? (
              <p className="mt-3 text-xs text-[var(--accent-teal)]" role="status">
                Ollama ready · {llmStatus.model}
              </p>
            ) : null}
          </div>

          {fabulaCount > 0 ? (
            <div className="rounded-xl border border-border bg-elevated p-5">
              <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                Fabula events
              </h2>
              <ul className="mt-4 max-h-[280px] space-y-3 overflow-y-auto">
                {work.graph.fabula.nodes.slice(0, 12).map((event) => (
                  <li
                    key={event.id}
                    className="rounded-lg border border-[var(--accent-amber-dim)]/40 bg-surface p-3"
                  >
                    <p className="text-[10px] uppercase text-[var(--accent-amber)]">
                      {event.kernelLevel} · t={event.fabulaTime}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-muted line-clamp-3">
                      {event.label}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {issueCount > 0 ? (
            <div className="rounded-xl border border-[var(--semantic-warning)]/40 bg-elevated p-5">
              <h2 className="flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                <AlertTriangle className="h-4 w-4 text-[var(--semantic-warning)]" />
                Issues
              </h2>
              <ul className="mt-4 space-y-2">
                {work.analysis.plotIssues.map((issue) => (
                  <li key={issue.id} className="text-sm text-muted">
                    <span className="text-[var(--semantic-warning)]">{issue.severity}</span>
                    {" · "}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-elevated p-5">
            <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
              Scene list
            </h2>
            <ul className="mt-4 max-h-[280px] space-y-3 overflow-y-auto">
              {work.graph.timeline.segments.map((segment) => (
                <li
                  key={segment.sceneId}
                  className="rounded-lg border border-border-subtle bg-surface p-3"
                >
                  <p className="text-xs text-[var(--accent-teal)]">
                    Chapter {segment.position.chapterIndex} · Scene{" "}
                    {segment.position.syuzhetIndex + 1}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-muted line-clamp-3">
                    {segment.summary}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      <AnalysisProgressModal
        isOpen={showModal && (isAnalyzing || events.length > 0)}
        events={events}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}
