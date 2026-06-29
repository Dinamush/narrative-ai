"use client"

import type { AnalysisProgressEvent } from "@narrative-ai/narrative-engine"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

const PHASE_LABELS: Record<string, string> = {
  ingestion: "Ingestion",
  fabula: "Fabula extraction",
  syuzhet: "Syuzhet projection",
  validation: "Validation",
  style: "Style analysis",
  character_states: "Character states",
  egoquest: "EgoQuest",
  arc_aggregation: "Arc aggregation",
  rag_indexing: "RAG indexing",
  critics: "Critics",
}

type AnalysisProgressModalProps = {
  isOpen: boolean
  events: AnalysisProgressEvent[]
  onClose: () => void
}

export const AnalysisProgressModal = ({
  isOpen,
  events,
  onClose,
}: AnalysisProgressModalProps) => {
  if (!isOpen) return null

  const latest = events[events.length - 1]
  const isComplete = latest?.status === "completed"
  const isFailed = latest?.status === "failed"

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-progress-title"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-elevated p-6 shadow-xl">
        <div className="flex items-start gap-3">
          {isFailed ? (
            <AlertCircle className="h-6 w-6 shrink-0 text-[var(--semantic-critical)]" />
          ) : isComplete ? (
            <CheckCircle2 className="h-6 w-6 shrink-0 text-[var(--semantic-success)]" />
          ) : (
            <Loader2 className="h-6 w-6 shrink-0 animate-spin text-accent" aria-hidden="true" />
          )}
          <div className="flex-1">
            <h2
              id="analysis-progress-title"
              className="font-[family-name:var(--font-fraunces)] text-lg font-semibold"
            >
              {isFailed ? "Analysis failed" : isComplete ? "Analysis complete" : "Analyzing structure…"}
            </h2>
            <p className="mt-1 text-sm text-muted">{latest?.message ?? "Starting…"}</p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${latest?.progress ?? 0}%` }}
            role="progressbar"
            aria-valuenow={latest?.progress ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-xs text-muted">
          {events.slice(-8).map((event, index) => (
            <li key={`${event.phase}-${index}`} className="flex justify-between gap-2">
              <span>{PHASE_LABELS[event.phase] ?? event.phase}</span>
              <span>{event.progress}%</span>
            </li>
          ))}
        </ul>

        {(isComplete || isFailed) && (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-[#0c0b0a] transition-colors duration-200 hover:opacity-90"
          >
            {isComplete ? "View results" : "Close"}
          </button>
        )}
      </div>
    </div>
  )
}
