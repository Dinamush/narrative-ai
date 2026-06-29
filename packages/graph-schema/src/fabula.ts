import { z } from "zod"
import { NarrativeStageSchema, TextSpanSchema } from "./common.js"

export const EventTypeSchema = z.enum(["action", "happening", "stasis"])
export const KernelLevelSchema = z.enum(["kernel", "satellite"])

export const EventRelationSchema = z.enum([
  "causal",
  "temporal",
  "foreshadowing",
  "suspense",
  "enables",
  "requires",
])

export const EventNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  fabulaTime: z.number(),
  participants: z.array(z.string()),
  locationId: z.string().optional(),
  stateDelta: z.record(z.unknown()).optional(),
  eventType: EventTypeSchema,
  kernelLevel: KernelLevelSchema,
  narrativeStage: NarrativeStageSchema.optional(),
  tensionTarget: z.number().min(0).max(1).optional(),
  proppFunction: z.string().optional(),
  evidenceSpan: TextSpanSchema,
})

export const EventEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  relation: EventRelationSchema,
  weight: z.number().optional(),
})

export const FabulaGraphSchema = z.object({
  nodes: z.array(EventNodeSchema),
  edges: z.array(EventEdgeSchema),
})

export type EventNode = z.infer<typeof EventNodeSchema>
export type EventEdge = z.infer<typeof EventEdgeSchema>
export type FabulaGraph = z.infer<typeof FabulaGraphSchema>
