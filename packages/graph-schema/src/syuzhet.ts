import { z } from "zod"
import { TextSpanSchema } from "./common.js"

export const DiscourseOpSchema = z.enum([
  "flashback",
  "flashforward",
  "ellipsis",
  "pause",
])

export const SyuzhetEdgeTypeSchema = z.enum(["next", "parallel", "branch"])

export const SceneNodeSchema = z.object({
  id: z.string(),
  syuzhetIndex: z.number().int().nonnegative(),
  eventIds: z.array(z.string()),
  discourseOps: z.array(DiscourseOpSchema).optional(),
  pov: z.string().optional(),
  textSpanRef: TextSpanSchema,
  measuredTension: z.number().min(0).max(1).optional(),
  registerVector: z.array(z.number()).optional(),
  themeTags: z.array(z.string()).optional(),
  summary: z.string().optional(),
})

export const SyuzhetEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: SyuzhetEdgeTypeSchema,
})

export const ReferenceLinkSchema = z.object({
  sceneId: z.string(),
  eventId: z.string(),
  textOffset: z.tuple([z.number(), z.number()]).optional(),
})

export const SyuzhetGraphSchema = z.object({
  nodes: z.array(SceneNodeSchema),
  edges: z.array(SyuzhetEdgeSchema),
})

export type SceneNode = z.infer<typeof SceneNodeSchema>
export type SyuzhetEdge = z.infer<typeof SyuzhetEdgeSchema>
export type ReferenceLink = z.infer<typeof ReferenceLinkSchema>
export type SyuzhetGraph = z.infer<typeof SyuzhetGraphSchema>
