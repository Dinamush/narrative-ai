import { EGO_QUEST_SHADOW_MARKERS } from "./data/egoQuest-markers.js"
import type { EgoQuestTextSignals, FictionEgoProfile } from "./types.js"
import { EGO_QUEST_ACTIVATION_THRESHOLD, passesEgoQuestGate } from "./egoquest-scorer.js"

const DRIVER_FROM_WOUND: Record<string, string> = {
  rejection: "Belonging / acceptance",
  abandonment: "Security / loyalty",
  insignificance: "Recognition / impact",
  failure: "Competence / mastery",
  vulnerability: "Control / safety",
}

export const buildFictionEgoProfile = (
  signals: EgoQuestTextSignals,
  charCount: number
): FictionEgoProfile => {
  const gated = !passesEgoQuestGate(signals, charCount)
  const shadowHits = signals.evidenceSnippets.filter((s) =>
    EGO_QUEST_SHADOW_MARKERS.some((m) => s.toLowerCase().includes(m.toLowerCase()))
  )
  const shadowIntensity = Math.min(1, shadowHits.length * 0.25 + (gated ? 0 : 0.15))

  const tensions: string[] = []
  if (signals.differentiation.level === "fused" || signals.differentiation.level === "low") {
    tensions.push("Self vs. enmeshment")
  }
  if (signals.dominantSocialMask === "adaptive") {
    tensions.push("Authentic self vs. performed persona")
  }
  if (shadowIntensity > 0.4) {
    tensions.push("Conscious intent vs. shadow impulse")
  }

  return {
    coreWound: {
      type: signals.dominantCoreWound,
      intensity: signals.coreWoundScores[signals.dominantCoreWound],
    },
    socialMask: {
      type: signals.dominantSocialMask,
      intensity: signals.socialMaskScores[signals.dominantSocialMask],
    },
    differentiation: signals.differentiation,
    shadow: {
      intensity: shadowIntensity,
      triggers: shadowHits.slice(0, 3),
    },
    driver: {
      label: DRIVER_FROM_WOUND[signals.dominantCoreWound] ?? "Unknown driver",
      stability: gated ? 0 : Math.max(0.3, 1 - shadowIntensity * 0.5),
    },
    birthOrder: signals.birthOrder,
    familyRole: signals.familyRole,
    internalTensions: tensions,
    activationStrength: signals.activationStrength,
    gated,
  }
}

export const shouldDisplayEgoQuest = (profile: FictionEgoProfile): boolean =>
  !profile.gated && profile.activationStrength >= EGO_QUEST_ACTIVATION_THRESHOLD
