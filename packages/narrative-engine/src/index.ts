export { segmentManuscript } from "./ingestion/segment-manuscript.js"
export type {
  SegmentedScene,
  SegmentationResult,
} from "./ingestion/segment-manuscript.js"

export { applyCharacterAnalysis, runCharacterPipeline } from "./character/character-pipeline.js"
export type { CharacterPipelineResult } from "./character/character-pipeline.js"

export { runAnalysisPipeline } from "./pipeline/analysis-pipeline.js"
export type { AnalysisPipelineResult } from "./pipeline/analysis-pipeline.js"

export { applyStyleToWork, analyzeStyleLayer } from "./style/style-analyzer.js"
export type { StyleAnalysisResult } from "./style/style-analyzer.js"
export { getTensionTarget, getDramaticCurve, getExpectedClimaxProgress } from "./style/dramatic-curves.js"

export { validateFabulaDag } from "./constraint/dag-validator.js"
export { extractEventsForScene } from "./extraction/llm-event-extractor.js"

export {
  resolveLlmConfig,
  resolveLlmProvider,
  extractionModeForProvider,
  getConfiguredExtractionMode,
} from "./llm/llm-config.js"
export type { ExtractionMode, LlmConfig, LlmProvider } from "./llm/llm-config.js"
export { chatCompletionJson, checkLlmAvailability } from "./llm/llm-client.js"
export { extractPropositions } from "./extraction/proposition-extractor.js"

export type {
  AnalysisPhase,
  AnalysisJobStatus,
  AnalysisProgressEvent,
  PipelineProgressCallback,
} from "./types/analysis-job.js"
