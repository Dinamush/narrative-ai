import type { DramaticModel, NarrativeStage } from "@narrative-ai/graph-schema"

export type DramaticBeat = {
  progress: number
  tension: number
  stage?: NarrativeStage
  label?: string
}

const lerp = (progress: number, points: DramaticBeat[]): number => {
  if (points.length === 0) return 0.5
  if (progress <= points[0].progress) return points[0].tension
  if (progress >= points[points.length - 1].progress) {
    return points[points.length - 1].tension
  }

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const next = points[i]
    if (progress <= next.progress) {
      const span = next.progress - prev.progress || 1
      const t = (progress - prev.progress) / span
      return prev.tension + t * (next.tension - prev.tension)
    }
  }

  return points[points.length - 1].tension
}

const FREYTAG: DramaticBeat[] = [
  { progress: 0, tension: 0.12, stage: "exposition" },
  { progress: 0.1, tension: 0.18, stage: "exposition" },
  { progress: 0.25, tension: 0.35, stage: "rising_action" },
  { progress: 0.5, tension: 0.55, stage: "rising_action" },
  { progress: 0.7, tension: 0.72, stage: "rising_action" },
  { progress: 0.85, tension: 1, stage: "climax" },
  { progress: 0.92, tension: 0.45, stage: "falling_action" },
  { progress: 1, tension: 0.18, stage: "resolution" },
]

const THREE_ACT: DramaticBeat[] = [
  { progress: 0, tension: 0.1, stage: "exposition", label: "Act I" },
  { progress: 0.12, tension: 0.28, stage: "rising_action", label: "Inciting incident" },
  { progress: 0.25, tension: 0.38, stage: "rising_action", label: "Break into II" },
  { progress: 0.5, tension: 0.62, stage: "pre_climax", label: "Midpoint" },
  { progress: 0.75, tension: 0.78, stage: "pre_climax", label: "Break into III" },
  { progress: 0.85, tension: 1, stage: "climax" },
  { progress: 0.95, tension: 0.35, stage: "falling_action" },
  { progress: 1, tension: 0.15, stage: "resolution" },
]

const FICHTEAN: DramaticBeat[] = [
  { progress: 0, tension: 0.15 },
  { progress: 0.2, tension: 0.45 },
  { progress: 0.35, tension: 0.3 },
  { progress: 0.5, tension: 0.65 },
  { progress: 0.65, tension: 0.4 },
  { progress: 0.8, tension: 0.85 },
  { progress: 0.9, tension: 0.55 },
  { progress: 1, tension: 0.2 },
]

const SAVE_THE_CAT: DramaticBeat[] = [
  { progress: 0, tension: 0.1, label: "Opening Image" },
  { progress: 0.05, tension: 0.15, label: "Theme Stated" },
  { progress: 0.1, tension: 0.22, label: "Setup" },
  { progress: 0.12, tension: 0.35, label: "Catalyst" },
  { progress: 0.25, tension: 0.42, label: "Break into Two" },
  { progress: 0.5, tension: 0.68, label: "Midpoint" },
  { progress: 0.75, tension: 0.82, label: "All Is Lost" },
  { progress: 0.85, tension: 1, label: "Finale" },
  { progress: 1, tension: 0.18, label: "Final Image" },
]

const HEROS_JOURNEY: DramaticBeat[] = [
  { progress: 0, tension: 0.12, label: "Ordinary World" },
  { progress: 0.1, tension: 0.25, label: "Call to Adventure" },
  { progress: 0.2, tension: 0.38, label: "Crossing Threshold" },
  { progress: 0.45, tension: 0.55, label: "Tests" },
  { progress: 0.65, tension: 0.72, label: "Ordeal" },
  { progress: 0.85, tension: 1, label: "Resurrection" },
  { progress: 1, tension: 0.2, label: "Return" },
]

const CURVES: Record<DramaticModel, DramaticBeat[]> = {
  freytag: FREYTAG,
  three_act: THREE_ACT,
  fichtean: FICHTEAN,
  save_the_cat: SAVE_THE_CAT,
  heros_journey: HEROS_JOURNEY,
}

export const getTensionTarget = (model: DramaticModel, narrativeProgress: number) =>
  lerp(narrativeProgress, CURVES[model])

export const getDramaticCurve = (model: DramaticModel) => CURVES[model]

export const getExpectedClimaxProgress = (model: DramaticModel): number => {
  const curve = CURVES[model]
  let max = curve[0]
  for (const beat of curve) {
    if (beat.tension > max.tension) max = beat
  }
  return max.progress
}

export const stageForProgress = (
  model: DramaticModel,
  narrativeProgress: number
): NarrativeStage | undefined => {
  const curve = CURVES[model]
  let closest = curve[0]
  let minDist = Math.abs(narrativeProgress - closest.progress)

  for (const beat of curve) {
    const dist = Math.abs(narrativeProgress - beat.progress)
    if (dist < minDist) {
      minDist = dist
      closest = beat
    }
  }

  return closest.stage
}
