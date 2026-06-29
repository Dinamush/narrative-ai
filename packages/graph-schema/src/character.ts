import { z } from "zod"
import { TextSpanSchema } from "./common.js"
import { NarrativePositionSchema } from "./timeline.js"

export const CharacterRoleSchema = z.enum([
  "protagonist",
  "antagonist",
  "deuteragonist",
  "supporting",
  "minor",
])

export const CharacterRelationSchema = z.enum([
  "conflict",
  "cooperative",
  "emotional",
  "hidden",
])

export const EGOProfileSchema = z.record(z.unknown())

export const MentalStatePredicateSchema = z.enum([
  "believes_about",
  "desires_for",
  "feels_towards",
  "intends_to",
])

export const StateStatementSchema = z.object({
  id: z.string(),
  category: z.enum(["dialogue", "physical", "knowledge", "goals"]),
  text: z.string(),
  polarity: z.enum(["affirmed", "negated", "uncertain"]),
  evidenceSpan: TextSpanSchema,
  entailmentScore: z.number().min(0).max(1).optional(),
})

export const MentalStateTripleSchema = z.object({
  id: z.string(),
  subject: z.string(),
  predicate: MentalStatePredicateSchema,
  object: z.string(),
  objectType: z.enum(["character", "event", "proposition", "entity"]),
  perspective: z.string(),
  supersedes: z.string().optional(),
  evidenceSpan: TextSpanSchema,
})

export const AttributeDeltaSchema = z.object({
  attribute: z.string(),
  valueBefore: z.union([z.string(), z.number(), z.boolean()]).optional(),
  valueAfter: z.union([z.string(), z.number(), z.boolean()]),
  evidenceSpan: TextSpanSchema,
})

export const CharacterStateSnapshotSchema = z.object({
  id: z.string(),
  characterId: z.string(),
  position: NarrativePositionSchema,
  confidence: z.number().min(0).max(1),
  dialogue: z.array(StateStatementSchema),
  physical: z.array(StateStatementSchema),
  knowledge: z.array(StateStatementSchema),
  goals: z.array(StateStatementSchema),
  mentalStates: z.array(MentalStateTripleSchema),
  attributeDeltas: z.array(AttributeDeltaSchema),
  affect: z.object({
    valence: z.number(),
    arousal: z.number(),
    dominance: z.number().optional(),
    circumstanceAsActor: z.number(),
    circumstanceAsExperiencer: z.number(),
    emotions: z.array(
      z.object({
        label: z.string(),
        confidence: z.number(),
      })
    ),
  }),
  egoQuest: z
    .object({
      profile: EGOProfileSchema,
      activationStrength: z.number(),
      dominantMechanisms: z.array(z.string()),
    })
    .optional(),
  deltaFromPrior: z
    .object({
      priorSnapshotId: z.string(),
      beliefRevisions: z.array(z.string()),
      goalChanges: z.array(z.string()),
      relationshipShifts: z.array(z.string()),
      egoQuestShifts: z.array(z.string()),
    })
    .optional(),
  evidenceSpans: z.array(TextSpanSchema),
})

export const ArcShapeSchema = z.enum([
  "rise",
  "fall",
  "u_shape",
  "oscillating",
  "flat",
])

export const CharacterArcMetricsSchema = z.object({
  characterId: z.string(),
  arcShape: ArcShapeSchema.optional(),
  turningPointSceneIds: z.array(z.string()),
  uedDisplacementPeak: z.number().optional(),
  uedDisplacementLength: z.number().optional(),
  actionDivergenceByChapter: z.array(z.number()).optional(),
  relationalArcShape: z.record(ArcShapeSchema).optional(),
  egoQuestArc: z
    .object({
      differentiationStart: z.number(),
      differentiationEnd: z.number(),
      shadowPeakSceneId: z.string().optional(),
      driverStabilityMean: z.number(),
    })
    .optional(),
  computedAt: z.string(),
})

export const RelationArcSegmentSchema = z.object({
  fromPosition: NarrativePositionSchema,
  toPosition: NarrativePositionSchema,
  circumstanceScore: z.number(),
  relationLabel: z.string().optional(),
  eventIds: z.array(z.string()),
})

export const CharacterNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  role: CharacterRoleSchema.optional(),
  firstAppearance: NarrativePositionSchema,
  egoProfiles: z.array(
    z.object({
      sceneId: z.string(),
      profile: EGOProfileSchema,
      confidence: z.number(),
      evidenceSpans: z.array(TextSpanSchema),
    })
  ),
  stateSnapshots: z.array(CharacterStateSnapshotSchema),
  arcMetrics: CharacterArcMetricsSchema.optional(),
  arcTrajectory: z
    .object({
      differentiation: z.array(z.number()),
      shadowIntensity: z.array(z.number()),
      driverStability: z.array(z.number()),
      circumstanceActor: z.array(z.number()),
      circumstanceExperiencer: z.array(z.number()),
      sceneIds: z.array(z.string()),
    })
    .optional(),
})

export const CharacterEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  relation: CharacterRelationSchema,
  scenes: z.array(z.string()),
  weight: z.number(),
  sentiment: z.number().optional(),
  supportingEventIds: z.array(z.string()),
  relationArc: z.array(RelationArcSegmentSchema).optional(),
})

export const CharacterGraphSchema = z.object({
  nodes: z.array(CharacterNodeSchema),
  edges: z.array(CharacterEdgeSchema),
})

export type CharacterStateSnapshot = z.infer<typeof CharacterStateSnapshotSchema>
export type CharacterArcMetrics = z.infer<typeof CharacterArcMetricsSchema>
export type CharacterNode = z.infer<typeof CharacterNodeSchema>
export type CharacterEdge = z.infer<typeof CharacterEdgeSchema>
export type CharacterGraph = z.infer<typeof CharacterGraphSchema>
export type ArcShape = z.infer<typeof ArcShapeSchema>
export type MentalStateTriple = z.infer<typeof MentalStateTripleSchema>
export type StateStatement = z.infer<typeof StateStatementSchema>
