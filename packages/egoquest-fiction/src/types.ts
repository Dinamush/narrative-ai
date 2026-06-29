export type CoreWoundType =
  | "rejection"
  | "abandonment"
  | "insignificance"
  | "failure"
  | "vulnerability"

export type SocialMaskType = "laughing" | "crying" | "adaptive"

export type BirthOrderType = "firstborn" | "middle" | "youngest" | "only"

export type FamilyRoleType = "hero" | "scapegoat" | "lost_child" | "mascot"

export type DifferentiationLevel = "fused" | "low" | "moderate" | "high"

export type EgoQuestTextSignals = {
  coreWoundScores: Record<CoreWoundType, number>
  socialMaskScores: Record<SocialMaskType, number>
  birthOrderScores: Record<BirthOrderType, number>
  familyRoleScores: Record<FamilyRoleType, number>
  differentiation: {
    score: number
    intrapsychicAxis: number
    interpersonalAxis: number
    level: DifferentiationLevel
  }
  dominantCoreWound: CoreWoundType
  dominantSocialMask: SocialMaskType
  birthOrder?: BirthOrderType
  familyRole?: FamilyRoleType
  activationStrength: number
  detectedMechanisms: string[]
  evidenceSnippets: string[]
  source: "keywords" | "llm" | "blended"
}

export type FictionEgoProfile = {
  coreWound: { type: CoreWoundType; intensity: number }
  socialMask: { type: SocialMaskType; intensity: number }
  differentiation: {
    level: DifferentiationLevel
    score: number
    intrapsychicAxis: number
    interpersonalAxis: number
  }
  shadow: { intensity: number; triggers: string[] }
  driver: { label: string; stability: number }
  birthOrder?: BirthOrderType
  familyRole?: FamilyRoleType
  internalTensions: string[]
  activationStrength: number
  gated: boolean
}
