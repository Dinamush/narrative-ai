"use client"

import type { NarrativeWork } from "@narrative-ai/graph-schema"

type ThemePanelProps = {
  work: NarrativeWork
}

export const ThemePanel = ({ work }: ThemePanelProps) => {
  const themes = work.analysis.themes

  if (themes.length === 0) {
    return (
      <p className="text-sm text-muted">No themes detected yet.</p>
    )
  }

  return (
    <ul className="space-y-3">
      {themes.slice(0, 8).map((theme) => (
        <li
          key={theme.label}
          className="rounded-lg border border-border-subtle bg-surface p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium capitalize text-foreground">
              {theme.label}
            </span>
            <span className="text-xs text-muted">
              {theme.scenes.length} scene{theme.scenes.length === 1 ? "" : "s"}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-overlay"
            role="progressbar"
            aria-valuenow={Math.round(theme.confidence * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${theme.label} confidence`}
          >
            <div
              className="h-full rounded-full bg-[var(--accent-teal)]"
              style={{ width: `${Math.round(theme.confidence * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
