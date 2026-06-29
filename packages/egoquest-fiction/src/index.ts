export type {
  BirthOrderType,
  CoreWoundType,
  DifferentiationLevel,
  EgoQuestTextSignals,
  FamilyRoleType,
  FictionEgoProfile,
  SocialMaskType,
} from "./types.js"

export {
  EGO_QUEST_ACTIVATION_THRESHOLD,
  EGO_QUEST_MIN_CHARS,
  egoQuestSummaryLines,
  passesEgoQuestGate,
  scoreEgoQuestFromText,
} from "./egoquest-scorer.js"

export {
  buildFictionEgoProfile,
  shouldDisplayEgoQuest,
} from "./profile-builder.js"
