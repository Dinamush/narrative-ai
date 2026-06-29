"use client"

import { AlertTriangle } from "lucide-react"
import type { NarrativeWork } from "@narrative-ai/graph-schema"

type WavelengthPanelProps = {
  work: NarrativeWork
}

export const WavelengthPanel = ({ work }: WavelengthPanelProps) => {
  const drifts = work.analysis.wavelengthDrift.filter((d) => d.flagged)

  if (drifts.length === 0) {
    return (
      <p className="text-sm text-muted">
        No significant tonal drift between adjacent scenes in the same chapter.
      </p>
    )
  }

  const sceneLabel = (sceneId: string) => {
    const segment = work.graph.timeline.segments.find((s) => s.sceneId === sceneId)
    if (!segment) return sceneId
    return `Ch.${segment.position.chapterIndex} Sc.${segment.position.syuzhetIndex + 1}`
  }

  return (
    <ul className="space-y-2">
      {drifts.map((drift) => (
        <li
          key={`${drift.from}-${drift.to}`}
          className="flex items-start gap-2 rounded-lg border border-[var(--semantic-warning)]/30 bg-surface p-3 text-sm"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--semantic-warning)]"
            aria-hidden="true"
          />
          <div>
            <p className="text-foreground">
              {sceneLabel(drift.from)} → {sceneLabel(drift.to)}
            </p>
            <p className="mt-1 text-muted">
              Drift score {(drift.distance * 100).toFixed(0)}% — register shift within chapter
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
