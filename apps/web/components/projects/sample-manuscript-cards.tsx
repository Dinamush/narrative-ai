"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Loader2, Sparkles } from "lucide-react"
import { createEmptyNarrativeWork } from "@narrative-ai/graph-schema"
import { AnalysisProgressModal } from "@/components/analysis/analysis-progress-modal"
import type { AnalysisProgressEvent } from "@narrative-ai/narrative-engine"
import { db } from "@/lib/db"
import {
  analyzeWorkViaApi,
  applySegmentation,
  isWorkAnalyzed,
} from "@/lib/segment-work"
import { SAMPLE_MANUSCRIPTS, type SampleManuscript } from "@/lib/sample-manuscripts"
import { useNarrativeStore } from "@/stores/narrative-graph-store"

type SampleManuscriptCardsProps = {
  variant?: "grid" | "compact"
}

export const SampleManuscriptCards = ({
  variant = "grid",
}: SampleManuscriptCardsProps) => {
  const router = useRouter()
  const setWork = useNarrativeStore((s) => s.setWork)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [events, setEvents] = useState<AnalysisProgressEvent[]>([])
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenSample = async (sample: SampleManuscript) => {
    setLoadingId(sample.id)
    setError(null)

    try {
      let work = await db.projects.get(sample.id)

      if (!work) {
        const response = await fetch(sample.publicPath)
        if (!response.ok) throw new Error("Could not load sample manuscript")
        const rawText = await response.text()

        work = createEmptyNarrativeWork({
          id: sample.id,
          title: sample.title,
          rawText,
        })
        applySegmentation(work, rawText)
        await db.projects.put(work)
      }

      if (!isWorkAnalyzed(work)) {
        setShowModal(true)
        setEvents([])
        work = await analyzeWorkViaApi(work, (event) => {
          setEvents((prev) => [...prev, event as AnalysisProgressEvent])
        })
        await db.projects.put(work)
      }

      setWork(work)
      router.push(`/projects/${work.id}/structure`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open sample")
      setShowModal(false)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <>
      <section aria-labelledby="sample-manuscripts-heading">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2
            id="sample-manuscripts-heading"
            className="font-[family-name:var(--font-fraunces)] text-xl font-semibold"
          >
            Sample manuscripts
          </h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          Pre-loaded demos with full analysis — structure graphs, character network, and arc charts.
        </p>

        {error ? (
          <p className="mb-4 text-sm text-[var(--semantic-critical)]" role="alert">
            {error}
          </p>
        ) : null}

        <ul
          className={
            variant === "compact"
              ? "space-y-3"
              : "grid gap-4 md:grid-cols-2"
          }
        >
          {SAMPLE_MANUSCRIPTS.map((sample) => {
            const isLoading = loadingId === sample.id

            return (
              <li key={sample.id}>
                <button
                  type="button"
                  onClick={() => handleOpenSample(sample)}
                  disabled={loadingId !== null}
                  className="group w-full cursor-pointer rounded-xl border border-[var(--accent-amber-dim)]/50 bg-elevated p-5 text-left transition-colors duration-200 hover:border-accent hover:bg-overlay disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Open sample: ${sample.title}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--accent-amber)]">
                        Sample · {sample.genre}
                      </p>
                      <h3 className="mt-1 font-[family-name:var(--font-fraunces)] text-lg font-semibold text-foreground">
                        {sample.title}
                      </h3>
                    </div>
                    {isLoading ? (
                      <Loader2
                        className="h-5 w-5 shrink-0 animate-spin text-accent"
                        aria-hidden="true"
                      />
                    ) : (
                      <Sparkles
                        className="h-5 w-5 shrink-0 text-muted transition-colors duration-200 group-hover:text-accent"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted line-clamp-2">
                    {sample.description}
                  </p>
                  <p className="mt-3 text-xs text-[var(--accent-teal)]">
                    {sample.sceneHint}
                    {isLoading ? " · Analyzing…" : " · Click to open"}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <AnalysisProgressModal
        isOpen={showModal && loadingId !== null}
        events={events}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
