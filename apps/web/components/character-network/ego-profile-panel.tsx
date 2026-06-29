"use client"

import type { CharacterNode } from "@narrative-ai/graph-schema"
import { Lock, Sparkles } from "lucide-react"

type FictionEgoProfileView = {
  coreWound?: { type: string; intensity: number }
  socialMask?: { type: string; intensity: number }
  differentiation?: { level: string; score: number }
  shadow?: { intensity: number; triggers?: string[] }
  driver?: { label: string; stability: number }
  internalTensions?: string[]
  activationStrength?: number
  gated?: boolean
}

type EgoProfilePanelProps = {
  character: CharacterNode | null
}

const parseProfile = (profile: Record<string, unknown>): FictionEgoProfileView =>
  profile as FictionEgoProfileView

export const EgoProfilePanel = ({ character }: EgoProfilePanelProps) => {
  if (!character) {
    return (
      <div className="rounded-xl border border-border bg-elevated p-5 text-sm text-muted">
        Select a character in the network to view their EgoQuest profile and state timeline.
      </div>
    )
  }

  const latestSnapshot = character.stateSnapshots[character.stateSnapshots.length - 1]
  const egoData = latestSnapshot?.egoQuest
  const profile = egoData?.profile ? parseProfile(egoData.profile as Record<string, unknown>) : null
  const isGated = profile?.gated ?? !egoData

  return (
    <div className="space-y-4 rounded-xl border border-border bg-elevated p-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--accent-teal)]">
          {character.role ?? "character"}
        </p>
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold">
          {character.name}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {character.stateSnapshots.length} state snapshot
          {character.stateSnapshots.length === 1 ? "" : "s"}
          {character.arcMetrics?.arcShape
            ? ` · ${character.arcMetrics.arcShape.replace("_", " ")} arc`
            : ""}
        </p>
      </div>

      {isGated ? (
        <div className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface p-4 text-sm text-muted">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            EgoQuest profile gated — insufficient attributed dialogue or activation strength below threshold.
            Only evidence-backed psychodynamic signals are shown.
          </p>
        </div>
      ) : profile ? (
        <div className="space-y-4">
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
              Psychodynamic layer
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              {profile.coreWound ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Core wound</dt>
                  <dd className="capitalize">
                    {profile.coreWound.type} ({Math.round(profile.coreWound.intensity * 100)}%)
                  </dd>
                </div>
              ) : null}
              {profile.socialMask ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Social mask</dt>
                  <dd className="capitalize">{profile.socialMask.type}</dd>
                </div>
              ) : null}
              {profile.differentiation ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Differentiation</dt>
                  <dd className="capitalize">
                    {profile.differentiation.level} ({Math.round(profile.differentiation.score * 100)}%)
                  </dd>
                </div>
              ) : null}
              {profile.driver ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Driver</dt>
                  <dd>{profile.driver.label}</dd>
                </div>
              ) : null}
              {profile.shadow ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Shadow intensity</dt>
                  <dd>{Math.round(profile.shadow.intensity * 100)}%</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {profile.internalTensions && profile.internalTensions.length > 0 ? (
            <section>
              <h3 className="text-sm font-medium text-foreground">Internal tensions</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {profile.internalTensions.map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {egoData?.dominantMechanisms && egoData.dominantMechanisms.length > 0 ? (
            <section>
              <h3 className="text-sm font-medium text-foreground">Detected mechanisms</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {egoData.dominantMechanisms.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-[var(--accent-amber-dim)]/40 bg-surface px-2 py-1 text-xs text-[var(--accent-amber)]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {latestSnapshot ? (
        <section>
          <h3 className="text-sm font-medium text-foreground">Latest mental state</h3>
          <ul className="mt-2 space-y-2 text-sm text-muted">
            {latestSnapshot.goals.slice(0, 2).map((g) => (
              <li key={g.id}>
                <span className="text-[var(--accent-teal)]">Goal:</span> {g.text}
              </li>
            ))}
            {latestSnapshot.knowledge.slice(0, 2).map((k) => (
              <li key={k.id}>
                <span className="text-[var(--accent-teal)]">Knows:</span> {k.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
