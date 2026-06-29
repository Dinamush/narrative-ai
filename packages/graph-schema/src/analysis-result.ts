import { z } from "zod"
import { DramaticModelSchema } from "./common.js"
import { ArcShapeSchema } from "./character.js"

export const PlotIssueTypeSchema = z.enum([
  "continuity",
  "causal_break",
  "ooc_behavior",
  "unresolved_thread",
  "impossible_event",
  "theme_drift",
  "wavelength_spike",
  "tension_mismatch",
])

export const PlotIssueSchema = z.object({
  id: z.string(),
  type: PlotIssueTypeSchema,
  severity: z.enum(["critical", "major", "minor", "suggestion"]),
  affectedNodeIds: z.array(z.string()),
  textSpans: z.array(
    z.object({
      start: z.number(),
      end: z.number(),
    })
  ),
  message: z.string(),
  suggestedFix: z.string().optional(),
})

export const SceneStyleVectorSchema = z.object({
  sceneId: z.string(),
  registerMDA: z.object({
    narrativity: z.number(),
    orality: z.number(),
    informational: z.number(),
    argumentation: z.number(),
  }),
  sentiment: z.object({
    valence: z.number(),
    arousal: z.number(),
  }),
  lexicalFingerprint: z.array(z.number()),
  themeTags: z.array(z.string()),
  wavelengthDriftFromPrev: z.number().optional(),
})

export const PropositionSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  fabulaTime: z.number(),
  subject: z.string(),
  predicate: z.string(),
  polarity: z.enum(["affirmed", "negated"]),
  evidenceSpan: z.object({
    start: z.number(),
    end: z.number(),
  }),
})

export const AnalysisResultSchema = z.object({
  dramaticArc: z.object({
    model: DramaticModelSchema,
    tensionSeries: z.array(
      z.object({
        sceneId: z.string(),
        target: z.number(),
        measured: z.number(),
      })
    ),
    climaxSceneId: z.string().optional(),
    turningPoints: z.array(z.string()),
  }),
  themes: z.array(
    z.object({
      label: z.string(),
      scenes: z.array(z.string()),
      confidence: z.number(),
    })
  ),
  wavelengthDrift: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      distance: z.number(),
      flagged: z.boolean(),
    })
  ),
  plotIssues: z.array(PlotIssueSchema),
  characterInsights: z.array(
    z.object({
      characterId: z.string(),
      summary: z.string(),
      arcType: z.string().optional(),
      arcShape: ArcShapeSchema.optional(),
      keyTensions: z.array(z.string()),
      majorTurningPoints: z.array(z.string()),
      stateDeltaHighlights: z.array(z.string()),
    })
  ),
  computedAt: z.string(),
})

export type PlotIssue = z.infer<typeof PlotIssueSchema>
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>
export type Proposition = z.infer<typeof PropositionSchema>
export type SceneStyleVector = z.infer<typeof SceneStyleVectorSchema>
