import { z } from "zod"
import { AnalysisResultSchema } from "./analysis-result.js"
import { CharacterGraphSchema } from "./character.js"
import { DramaticModelSchema } from "./common.js"
import { FabulaGraphSchema } from "./fabula.js"
import { EpisodeSchema, NarrativeTimelineSchema } from "./timeline.js"
import {
  PropositionSchema,
  SceneStyleVectorSchema,
} from "./analysis-result.js"
import {
  ReferenceLinkSchema,
  SyuzhetGraphSchema,
} from "./syuzhet.js"

export const NarrativeGraphSchema = z.object({
  fabula: FabulaGraphSchema,
  syuzhet: SyuzhetGraphSchema,
  characters: CharacterGraphSchema,
  timeline: NarrativeTimelineSchema,
  referenceMap: z.array(ReferenceLinkSchema),
  propositions: z.array(PropositionSchema),
  styleTimeline: z.array(SceneStyleVectorSchema),
  episodes: z.array(EpisodeSchema),
})

export const NarrativeWorkSchema = z.object({
  id: z.string(),
  title: z.string(),
  rawText: z.string(),
  metadata: z.object({
    genre: z.string().optional(),
    pov: z
      .enum(["first", "third_limited", "third_omniscient", "multi"])
      .optional(),
    structureModel: DramaticModelSchema.optional(),
    wordCount: z.number().int().nonnegative(),
    extractionMode: z.enum(["heuristic", "ollama", "openai"]).optional(),
    llmModel: z.string().optional(),
  }),
  graph: NarrativeGraphSchema,
  analysis: AnalysisResultSchema,
  schemaVersion: z.literal("1.1.0"),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type NarrativeGraph = z.infer<typeof NarrativeGraphSchema>
export type NarrativeWork = z.infer<typeof NarrativeWorkSchema>
