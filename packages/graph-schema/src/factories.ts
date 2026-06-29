import type { AnalysisResult } from "./analysis-result.js"
import type { NarrativeGraph, NarrativeWork } from "./narrative-graph.js"

const emptyAnalysis = (): AnalysisResult => ({
  dramaticArc: {
    model: "freytag",
    tensionSeries: [],
    turningPoints: [],
  },
  themes: [],
  wavelengthDrift: [],
  plotIssues: [],
  characterInsights: [],
  computedAt: new Date().toISOString(),
})

export const createEmptyNarrativeGraph = (): NarrativeGraph => ({
  fabula: { nodes: [], edges: [] },
  syuzhet: { nodes: [], edges: [] },
  characters: { nodes: [], edges: [] },
  timeline: { chapters: [], segments: [], provenance: {} },
  referenceMap: [],
  propositions: [],
  styleTimeline: [],
  episodes: [],
})

export const createEmptyNarrativeWork = (
  partial: Pick<NarrativeWork, "id" | "title"> &
    Partial<Pick<NarrativeWork, "rawText">>
): NarrativeWork => {
  const now = new Date().toISOString()
  const rawText = partial.rawText ?? ""

  return {
    id: partial.id,
    title: partial.title,
    rawText,
    metadata: {
      wordCount: rawText.trim() ? rawText.trim().split(/\s+/).length : 0,
    },
    graph: createEmptyNarrativeGraph(),
    analysis: emptyAnalysis(),
    schemaVersion: "1.1.0",
    createdAt: now,
    updatedAt: now,
  }
}
