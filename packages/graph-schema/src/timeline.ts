import { z } from "zod"
import { RagChunkTypeSchema, TextSpanSchema } from "./common.js"

export const NarrativePositionSchema = z.object({
  chapterId: z.string().optional(),
  chapterIndex: z.number().int().nonnegative(),
  sceneId: z.string(),
  syuzhetIndex: z.number().int().nonnegative(),
  fabulaTime: z.number(),
  narrativeProgress: z.number().min(0).max(1),
})

export const ChapterSchema = z.object({
  id: z.string(),
  index: z.number().int().nonnegative(),
  title: z.string().optional(),
  sceneIds: z.array(z.string()),
  textSpanRef: TextSpanSchema,
})

export const SceneSegmentSchema = z.object({
  sceneId: z.string(),
  position: NarrativePositionSchema,
  participantIds: z.array(z.string()),
  summary: z.string().optional(),
})

export const ChunkRefSchema = z.object({
  chunkId: z.string(),
  chunkType: RagChunkTypeSchema,
  textSpanRef: TextSpanSchema,
  sceneId: z.string().optional(),
  characterId: z.string().optional(),
  eventId: z.string().optional(),
})

export const NarrativeTimelineSchema = z.object({
  chapters: z.array(ChapterSchema),
  segments: z.array(SceneSegmentSchema),
  provenance: z.record(ChunkRefSchema),
})

export const EpisodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  sceneIds: z.array(z.string()),
  participantIds: z.array(z.string()),
  motif: z.string().optional(),
  conflict: z.string().optional(),
  outcome: z.string().optional(),
  storylineId: z.string().optional(),
})

export const StorylineSchema = z.object({
  id: z.string(),
  label: z.string(),
  episodeIds: z.array(z.string()),
  sourceEventId: z.string().optional(),
  sinkEventId: z.string().optional(),
})

export type NarrativePosition = z.infer<typeof NarrativePositionSchema>
export type Chapter = z.infer<typeof ChapterSchema>
export type NarrativeTimeline = z.infer<typeof NarrativeTimelineSchema>
export type Episode = z.infer<typeof EpisodeSchema>
