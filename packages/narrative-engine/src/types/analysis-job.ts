export type AnalysisPhase =
  | "ingestion"
  | "fabula"
  | "syuzhet"
  | "style"
  | "character_states"
  | "egoquest"
  | "arc_aggregation"
  | "rag_indexing"
  | "validation"
  | "critics"

export type AnalysisJobStatus = "queued" | "running" | "completed" | "failed"

export type AnalysisProgressEvent = {
  jobId: string
  status: AnalysisJobStatus
  phase: AnalysisPhase
  progress: number
  message: string
  error?: string
}

export type PipelineProgressCallback = (event: AnalysisProgressEvent) => void
