import type { EventEdge, EventNode, NarrativeWork, PlotIssue } from "@narrative-ai/graph-schema"
import { segmentManuscript } from "../ingestion/segment-manuscript.js"
import { validateFabulaDag } from "../constraint/dag-validator.js"
import { linkCausalEdges, linkSceneBridges } from "../extraction/causal-linker.js"
import { extractEventsForScene } from "../extraction/llm-event-extractor.js"
import { extractPropositions } from "../extraction/proposition-extractor.js"
import { projectSyuzhetReferences } from "../fabula/syuzhet-projector.js"
import { applyCharacterAnalysis } from "../character/character-pipeline.js"
import { resolveLlmConfig } from "../llm/llm-config.js"
import { applyStyleToWork } from "../style/style-analyzer.js"
import type { ExtractionMode } from "../llm/llm-config.js"
import type { PipelineProgressCallback, AnalysisPhase } from "../types/analysis-job.js"

export type AnalysisPipelineResult = {
  work: NarrativeWork
  extractionMode: ExtractionMode
  plotIssues: PlotIssue[]
}

const emit = (
  callback: PipelineProgressCallback | undefined,
  jobId: string,
  partial: {
    phase: AnalysisPhase
    progress: number
    message: string
    status?: "running" | "completed" | "failed"
    error?: string
  }
) => {
  callback?.({
    jobId,
    status: partial.status ?? "running",
    phase: partial.phase,
    progress: partial.progress,
    message: partial.message,
    error: partial.error,
  })
}

export const runAnalysisPipeline = async (
  work: NarrativeWork,
  jobId: string,
  onProgress?: PipelineProgressCallback
): Promise<AnalysisPipelineResult> => {
  const updated: NarrativeWork = structuredClone(work)
  let extractionMode: ExtractionMode = "heuristic"

  emit(onProgress, jobId, {
    phase: "ingestion",
    progress: 5,
    message: "Segmenting manuscript…",
  })

  const { chapters, scenes } = segmentManuscript(updated.rawText)
  updated.graph.syuzhet.nodes = scenes.map((s) => s.scene)
  updated.graph.syuzhet.edges = scenes.slice(1).map((s, index) => ({
    id: `syz-edge-${index}`,
    source: scenes[index].scene.id,
    target: s.scene.id,
    type: "next" as const,
  }))
  updated.graph.timeline.chapters = chapters
  updated.graph.timeline.segments = scenes.map((s) => ({
    sceneId: s.scene.id,
    position: {
      chapterId: s.chapterId,
      chapterIndex: s.chapterIndex,
      sceneId: s.scene.id,
      syuzhetIndex: s.scene.syuzhetIndex,
      fabulaTime: s.scene.syuzhetIndex,
      narrativeProgress:
        scenes.length <= 1 ? 0 : s.scene.syuzhetIndex / (scenes.length - 1),
    },
    participantIds: [],
    summary: s.text.slice(0, 160) + (s.text.length > 160 ? "…" : ""),
  }))

  emit(onProgress, jobId, {
    phase: "fabula",
    progress: 15,
    message: "Extracting events per scene…",
  })

  const allEvents: EventNode[] = []
  const sceneEventMap = new Map<string, EventNode[]>()
  let fabulaCounter = 0

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    const segment = updated.graph.timeline.segments.find(
      (s) => s.sceneId === scene.scene.id
    )
    const narrativeProgress = segment?.position.narrativeProgress ?? 0

    const { events, mode } = await extractEventsForScene({
      sceneId: scene.scene.id,
      text: scene.text,
      textOffsetStart: scene.scene.textSpanRef.start,
      fabulaTimeBase: fabulaCounter,
      narrativeProgress,
    })

    if (mode !== "heuristic") extractionMode = mode
    fabulaCounter += events.length
    sceneEventMap.set(scene.scene.id, events)
    allEvents.push(...events)

    emit(onProgress, jobId, {
      phase: "fabula",
      progress: 15 + Math.round(((i + 1) / scenes.length) * 45),
      message: `Extracted ${events.length} events from scene ${i + 1}/${scenes.length}`,
    })
  }

  emit(onProgress, jobId, {
    phase: "fabula",
    progress: 62,
    message: "Linking causal edges…",
  })

  const edges: EventEdge[] = []
  let priorLast: string | null = null

  for (const scene of scenes) {
    const events = sceneEventMap.get(scene.scene.id) ?? []
    edges.push(...linkCausalEdges(events))
    const bridge = linkSceneBridges(priorLast, events[0]?.id ?? null)
    if (bridge) edges.push(bridge)
    priorLast = events[events.length - 1]?.id ?? priorLast
  }

  updated.graph.fabula.nodes = allEvents
  updated.graph.fabula.edges = edges

  emit(onProgress, jobId, {
    phase: "syuzhet",
    progress: 70,
    message: "Projecting syuzhet references…",
  })

  const { referenceMap, updatedScenes } = projectSyuzhetReferences(updated, sceneEventMap)
  updated.graph.syuzhet.nodes = updatedScenes
  updated.graph.referenceMap = referenceMap

  emit(onProgress, jobId, {
    phase: "style",
    progress: 72,
    message: "Analyzing register, tension, themes…",
  })

  const styled = applyStyleToWork(updated, scenes)
  Object.assign(updated, styled)

  emit(onProgress, jobId, {
    phase: "character_states",
    progress: 76,
    message: "Identifying characters and extracting state snapshots…",
  })

  emit(onProgress, jobId, {
    phase: "egoquest",
    progress: 82,
    message: "Scoring EgoQuest psychodynamic signals…",
  })

  const withCharacters = applyCharacterAnalysis(updated, scenes)
  Object.assign(updated, withCharacters)

  emit(onProgress, jobId, {
    phase: "arc_aggregation",
    progress: 88,
    message: "Aggregating character arcs and relationships…",
  })

  emit(onProgress, jobId, {
    phase: "validation",
    progress: 90,
    message: "Extracting propositions…",
  })

  const propositions = scenes.flatMap((scene) => {
    const segment = updated.graph.timeline.segments.find(
      (s) => s.sceneId === scene.scene.id
    )
    return extractPropositions({
      sceneId: scene.scene.id,
      fabulaTime: segment?.position.fabulaTime ?? scene.scene.syuzhetIndex,
      text: scene.text,
      textOffsetStart: scene.scene.textSpanRef.start,
    })
  })
  updated.graph.propositions = propositions

  emit(onProgress, jobId, {
    phase: "validation",
    progress: 94,
    message: "Validating fabula DAG…",
  })

  const dagResult = validateFabulaDag(allEvents, edges)
  updated.analysis.plotIssues = dagResult.issues
  updated.analysis.computedAt = new Date().toISOString()
  updated.metadata.extractionMode = extractionMode
  const llmConfig = resolveLlmConfig()
  if (llmConfig) {
    updated.metadata.llmModel = llmConfig.model
  }
  updated.updatedAt = new Date().toISOString()

  emit(onProgress, jobId, {
    phase: "validation",
    progress: 100,
    message: `Validating fabula DAG… (${allEvents.length} events, ${extractionMode} mode)`,
  })

  return {
    work: updated,
    extractionMode,
    plotIssues: dagResult.issues,
  }
}
