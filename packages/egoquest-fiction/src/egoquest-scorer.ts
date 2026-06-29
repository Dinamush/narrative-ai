import {
  EGO_QUEST_BIRTH_ORDER_MARKERS,
  EGO_QUEST_CORE_WOUND_MARKERS,
  EGO_QUEST_DIFFERENTIATION_MARKERS,
  EGO_QUEST_FAMILY_ROLE_MARKERS,
  EGO_QUEST_MECHANISM_LABELS,
  EGO_QUEST_SHADOW_MARKERS,
  EGO_QUEST_SOCIAL_MASK_MARKERS,
} from "./data/egoQuest-markers.js"
import type {
  BirthOrderType,
  CoreWoundType,
  DifferentiationLevel,
  EgoQuestTextSignals,
  FamilyRoleType,
  SocialMaskType,
} from "./types.js"

export const EGO_QUEST_ACTIVATION_THRESHOLD = 0.12
export const EGO_QUEST_MIN_CHARS = 80

const CORE_WOUND_TYPES: CoreWoundType[] = [
  "rejection", "abandonment", "insignificance", "failure", "vulnerability",
]

const BIRTH_ORDER_TYPES: BirthOrderType[] = ["firstborn", "middle", "youngest", "only"]
const FAMILY_ROLE_TYPES: FamilyRoleType[] = ["hero", "scapegoat", "lost_child", "mascot"]

const normalizeText = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim()

const countMarkerHits = (
  text: string,
  markers: readonly string[]
): { count: number; snippets: string[] } => {
  const snippets: string[] = []
  let count = 0
  for (const marker of markers) {
    const needle = marker.toLowerCase()
    if (text.includes(needle)) {
      count += 1
      if (snippets.length < 4) snippets.push(marker)
    }
  }
  return { count, snippets }
}

const scoreCategory = (
  text: string,
  markerMap: Record<string, readonly string[]>,
  keys: string[]
): { scores: Record<string, number>; snippets: string[]; totalHits: number } => {
  const scores: Record<string, number> = {}
  const snippets: string[] = []
  let totalHits = 0

  for (const key of keys) {
    const { count, snippets: hits } = countMarkerHits(text, markerMap[key] ?? [])
    scores[key] = count
    totalHits += count
    snippets.push(...hits)
  }

  const max = Math.max(1, ...Object.values(scores))
  for (const key of keys) {
    scores[key] = scores[key] / max
  }

  return { scores, snippets, totalHits }
}

const pickDominant = <T extends string>(scores: Record<T, number>, fallback: T): T => {
  const entries = Object.entries(scores) as [T, number][]
  entries.sort((a, b) => b[1] - a[1])
  return entries[0]?.[0] ?? fallback
}

const differentiationLevel = (score: number): DifferentiationLevel => {
  if (score < 0.3) return "fused"
  if (score < 0.5) return "low"
  if (score < 0.7) return "moderate"
  return "high"
}

const emptyCoreWoundScores = (): Record<CoreWoundType, number> => ({
  rejection: 0,
  abandonment: 0,
  insignificance: 0,
  failure: 0,
  vulnerability: 0,
})

const buildEmptySignals = (): EgoQuestTextSignals => ({
  coreWoundScores: emptyCoreWoundScores(),
  socialMaskScores: { laughing: 0, crying: 0, adaptive: 0 },
  birthOrderScores: { firstborn: 0, middle: 0, youngest: 0, only: 0 },
  familyRoleScores: { hero: 0, scapegoat: 0, lost_child: 0, mascot: 0 },
  differentiation: {
    score: 0.5,
    intrapsychicAxis: 0.5,
    interpersonalAxis: 0.5,
    level: "moderate",
  },
  dominantCoreWound: "rejection",
  dominantSocialMask: "adaptive",
  activationStrength: 0,
  detectedMechanisms: [],
  evidenceSnippets: [],
  source: "keywords",
})

export const scoreEgoQuestFromText = (rawText: string): EgoQuestTextSignals => {
  const text = normalizeText(rawText)
  if (!text) return buildEmptySignals()

  const wound = scoreCategory(text, EGO_QUEST_CORE_WOUND_MARKERS, CORE_WOUND_TYPES)
  const mask = scoreCategory(text, EGO_QUEST_SOCIAL_MASK_MARKERS, ["laughing", "crying", "adaptive"])
  const birth = scoreCategory(text, EGO_QUEST_BIRTH_ORDER_MARKERS, BIRTH_ORDER_TYPES)
  const role = scoreCategory(text, EGO_QUEST_FAMILY_ROLE_MARKERS, FAMILY_ROLE_TYPES)
  const shadow = countMarkerHits(text, EGO_QUEST_SHADOW_MARKERS)

  const fused = countMarkerHits(text, EGO_QUEST_DIFFERENTIATION_MARKERS.fused)
  const diff = countMarkerHits(text, EGO_QUEST_DIFFERENTIATION_MARKERS.differentiated)
  const diffRaw = diff.count - fused.count
  const diffScore = Math.max(0, Math.min(1, 0.5 + diffRaw * 0.15))
  const intrapsychic = Math.max(0, Math.min(1, diffScore + (diff.count > fused.count ? 0.05 : -0.05)))
  const interpersonal = Math.max(0, Math.min(1, diffScore))

  const detectedMechanisms: string[] = []
  if (wound.totalHits > 0) detectedMechanisms.push(EGO_QUEST_MECHANISM_LABELS.coreWound)
  if (mask.totalHits > 0) detectedMechanisms.push(EGO_QUEST_MECHANISM_LABELS.socialMask)
  if (birth.totalHits > 0) detectedMechanisms.push(EGO_QUEST_MECHANISM_LABELS.birthOrder)
  if (role.totalHits > 0) detectedMechanisms.push(EGO_QUEST_MECHANISM_LABELS.familyRole)
  if (fused.count + diff.count > 0) detectedMechanisms.push(EGO_QUEST_MECHANISM_LABELS.differentiation)
  if (shadow.count > 0) detectedMechanisms.push(EGO_QUEST_MECHANISM_LABELS.shadow)

  const totalHits =
    wound.totalHits + mask.totalHits + birth.totalHits + role.totalHits + fused.count + diff.count + shadow.count
  const charFactor = Math.min(1, text.length / 400)
  const activationStrength = Math.min(
    1,
    (totalHits * 0.08 + charFactor * 0.2) * (totalHits > 0 ? 1 : 0.3)
  )

  const evidenceSnippets = [
    ...wound.snippets,
    ...mask.snippets,
    ...birth.snippets,
    ...role.snippets,
    ...fused.snippets,
    ...diff.snippets,
    ...shadow.snippets,
  ].slice(0, 8)

  return {
    coreWoundScores: wound.scores as Record<CoreWoundType, number>,
    socialMaskScores: mask.scores as Record<SocialMaskType, number>,
    birthOrderScores: birth.scores as Record<BirthOrderType, number>,
    familyRoleScores: role.scores as Record<FamilyRoleType, number>,
    differentiation: {
      score: diffScore,
      intrapsychicAxis: intrapsychic,
      interpersonalAxis: interpersonal,
      level: differentiationLevel(diffScore),
    },
    dominantCoreWound: pickDominant(wound.scores as Record<CoreWoundType, number>, "rejection"),
    dominantSocialMask: pickDominant(mask.scores as Record<SocialMaskType, number>, "adaptive"),
    birthOrder: birth.totalHits > 0
      ? pickDominant(birth.scores as Record<BirthOrderType, number>, "middle")
      : undefined,
    familyRole: role.totalHits > 0
      ? pickDominant(role.scores as Record<FamilyRoleType, number>, "lost_child")
      : undefined,
    activationStrength,
    detectedMechanisms,
    evidenceSnippets,
    source: "keywords",
  }
}

export const passesEgoQuestGate = (
  signals: EgoQuestTextSignals,
  charCount: number
): boolean =>
  signals.activationStrength >= EGO_QUEST_ACTIVATION_THRESHOLD &&
  charCount >= EGO_QUEST_MIN_CHARS

export const egoQuestSummaryLines = (signals: EgoQuestTextSignals): string[] => {
  if (signals.activationStrength < 0.05) return []

  const lines: string[] = []
  lines.push(
    `Core wound: ${signals.dominantCoreWound} (${Math.round(signals.coreWoundScores[signals.dominantCoreWound] * 100)}%)`
  )
  lines.push(`Social mask: ${signals.dominantSocialMask}`)
  if (signals.birthOrder) lines.push(`Birth order signal: ${signals.birthOrder.replace("_", " ")}`)
  if (signals.familyRole) lines.push(`Family role signal: ${signals.familyRole.replace("_", " ")}`)
  lines.push(
    `Differentiation: ${signals.differentiation.level} (${Math.round(signals.differentiation.score * 100)}%)`
  )
  return lines
}
