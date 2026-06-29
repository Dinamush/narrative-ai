import { z } from "zod"

export const TextSpanSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
})

export const DramaticModelSchema = z.enum([
  "freytag",
  "three_act",
  "heros_journey",
  "save_the_cat",
  "fichtean",
])

export const NarrativeStageSchema = z.enum([
  "exposition",
  "rising_action",
  "pre_climax",
  "climax",
  "falling_action",
  "resolution",
])

export const RagDomainSchema = z.enum([
  "plot",
  "character",
  "style",
  "theme",
  "egoquest",
  "general",
])

export const RagChunkTypeSchema = z.enum([
  "source_passage",
  "scene_analysis",
  "character_state_snapshot",
  "event_record",
  "atomic_fact",
  "relation_arc_segment",
  "episode_summary",
])

export type TextSpan = z.infer<typeof TextSpanSchema>
export type DramaticModel = z.infer<typeof DramaticModelSchema>
export type NarrativeStage = z.infer<typeof NarrativeStageSchema>
export type RagDomain = z.infer<typeof RagDomainSchema>
export type RagChunkType = z.infer<typeof RagChunkTypeSchema>
