import type {
  DramaticModel,
  NarrativeWork,
  PlotIssue,
  SceneStyleVector,
} from "@narrative-ai/graph-schema"
import type { SegmentedScene } from "../ingestion/segment-manuscript.js"
import {
  getExpectedClimaxProgress,
  getTensionTarget,
  stageForProgress,
} from "./dramatic-curves.js"
import { cosineDistance, hashTextToVector } from "./lexical-fingerprint.js"
import { analyzeRegister } from "./register-analyzer.js"
import { scoreSentiment, sentimentToTension } from "./sentiment.js"
import {
  clusterThemes,
  detectThemeDrift,
  extractSceneThemes,
} from "./theme-analyzer.js"

export type StyleAnalysisResult = {
  styleTimeline: SceneStyleVector[]
  tensionSeries: Array<{ sceneId: string; target: number; measured: number }>
  themes: Array<{ label: string; scenes: string[]; confidence: number }>
  wavelengthDrift: Array<{
    from: string
    to: string
    distance: number
    flagged: boolean
  }>
  plotIssues: PlotIssue[]
  climaxSceneId?: string
  turningPoints: string[]
}

const WAVELENGTH_THRESHOLD = 0.55
const TENSION_MISMATCH_THRESHOLD = 0.38

const findTurningPoints = (
  series: Array<{ sceneId: string; measured: number }>
): string[] => {
  const points: string[] = []

  for (let i = 1; i < series.length - 1; i++) {
    const prev = series[i - 1].measured
    const curr = series[i].measured
    const next = series[i + 1].measured
    if (curr > prev && curr > next && curr > 0.45) {
      points.push(series[i].sceneId)
    }
  }

  return points
}

export const analyzeStyleLayer = (
  work: NarrativeWork,
  scenes: SegmentedScene[],
  model: DramaticModel = work.metadata.structureModel ?? "freytag"
): StyleAnalysisResult => {
  const styleTimeline: SceneStyleVector[] = []
  const tensionSeries: StyleAnalysisResult["tensionSeries"] = []
  const wavelengthDrift: StyleAnalysisResult["wavelengthDrift"] = []
  const plotIssues: PlotIssue[] = []
  const sceneThemeTags: Array<{ sceneId: string; tags: string[]; chapterIndex: number }> = []

  let priorFingerprint: number[] | null = null
  let priorSceneId: string | null = null
  let priorChapterIndex: number | null = null

  for (const scene of scenes) {
    const segment = work.graph.timeline.segments.find(
      (s) => s.sceneId === scene.scene.id
    )
    const narrativeProgress = segment?.position.narrativeProgress ?? 0
    const chapterIndex = segment?.position.chapterIndex ?? scene.chapterIndex

    const sentiment = scoreSentiment(scene.text)
    const measured = sentimentToTension(sentiment)
    const target = getTensionTarget(model, narrativeProgress)
    const fingerprint = hashTextToVector(scene.text)
    const themeTags = extractSceneThemes(scene.text)

    sceneThemeTags.push({ sceneId: scene.scene.id, tags: themeTags, chapterIndex })

    let wavelengthDriftFromPrev: number | undefined
    if (priorFingerprint) {
      const distance = cosineDistance(priorFingerprint, fingerprint)
      wavelengthDriftFromPrev = distance

      const sameChapter = priorChapterIndex === chapterIndex
      wavelengthDrift.push({
        from: priorSceneId!,
        to: scene.scene.id,
        distance,
        flagged: sameChapter && distance > WAVELENGTH_THRESHOLD,
      })

      if (sameChapter && distance > WAVELENGTH_THRESHOLD) {
        plotIssues.push({
          id: `issue-wavelength-${priorSceneId}-${scene.scene.id}`,
          type: "wavelength_spike",
          severity: "minor",
          affectedNodeIds: [priorSceneId!, scene.scene.id],
          textSpans: [scene.scene.textSpanRef],
          message: `Tonal drift (${distance.toFixed(2)}) between adjacent scenes in chapter ${chapterIndex}`,
          suggestedFix: "Review register consistency or intentional stylistic shift",
        })
      }
    }

    if (Math.abs(measured - target) > TENSION_MISMATCH_THRESHOLD) {
      plotIssues.push({
        id: `issue-tension-${scene.scene.id}`,
        type: "tension_mismatch",
        severity: "suggestion",
        affectedNodeIds: [scene.scene.id],
        textSpans: [scene.scene.textSpanRef],
        message: `Scene tension (${measured.toFixed(2)}) diverges from ${model} target (${target.toFixed(2)}) at ${Math.round(narrativeProgress * 100)}% progress`,
      })
    }

    styleTimeline.push({
      sceneId: scene.scene.id,
      registerMDA: analyzeRegister(scene.text),
      sentiment,
      lexicalFingerprint: fingerprint,
      themeTags,
      wavelengthDriftFromPrev,
    })

    tensionSeries.push({
      sceneId: scene.scene.id,
      target,
      measured,
    })

    priorFingerprint = fingerprint
    priorSceneId = scene.scene.id
    priorChapterIndex = chapterIndex
  }

  const themes = clusterThemes(sceneThemeTags)
  const dominantThemes = themes.slice(0, 3).map((t) => t.label)
  const themeDrifts = detectThemeDrift(sceneThemeTags, dominantThemes)

  for (const drift of themeDrifts) {
    plotIssues.push({
      id: `issue-theme-${drift.sceneId}`,
      type: "theme_drift",
      severity: "suggestion",
      affectedNodeIds: [drift.sceneId],
      textSpans: [],
      message: drift.message,
    })
  }

  const turningPoints = findTurningPoints(tensionSeries)
  const expectedClimax = getExpectedClimaxProgress(model)

  let climaxSceneId: string | undefined
  let closestDist = Infinity
  for (const point of tensionSeries) {
    const segment = work.graph.timeline.segments.find((s) => s.sceneId === point.sceneId)
    const progress = segment?.position.narrativeProgress ?? 0
    const dist = Math.abs(progress - expectedClimax)
    if (dist < closestDist) {
      closestDist = dist
      climaxSceneId = point.sceneId
    }
  }

  const peakScene = [...tensionSeries].sort((a, b) => b.measured - a.measured)[0]
  if (peakScene && peakScene.sceneId !== climaxSceneId) {
    const peakSegment = work.graph.timeline.segments.find(
      (s) => s.sceneId === peakScene.sceneId
    )
    const peakProgress = peakSegment?.position.narrativeProgress ?? 0
    if (Math.abs(peakProgress - expectedClimax) > 0.2) {
      plotIssues.push({
        id: `issue-climax-position`,
        type: "tension_mismatch",
        severity: "minor",
        affectedNodeIds: [peakScene.sceneId],
        textSpans: [],
        message: `Measured tension peak at ${Math.round(peakProgress * 100)}% — ${model} expects climax near ${Math.round(expectedClimax * 100)}%`,
        suggestedFix: "Consider relocating or intensifying the climactic beat",
      })
    }
  }

  return {
    styleTimeline,
    tensionSeries,
    themes,
    wavelengthDrift,
    plotIssues,
    climaxSceneId: peakScene?.sceneId ?? climaxSceneId,
    turningPoints,
  }
}

export const applyStyleToWork = (
  work: NarrativeWork,
  scenes: SegmentedScene[],
  model?: DramaticModel
): NarrativeWork => {
  const dramaticModel = model ?? work.metadata.structureModel ?? "freytag"
  const result = analyzeStyleLayer(work, scenes, dramaticModel)

  const updated = structuredClone(work)
  updated.metadata.structureModel = dramaticModel
  updated.graph.styleTimeline = result.styleTimeline
  updated.graph.syuzhet.nodes = updated.graph.syuzhet.nodes.map((scene) => {
    const style = result.styleTimeline.find((s) => s.sceneId === scene.id)
    const tension = result.tensionSeries.find((t) => t.sceneId === scene.id)
    const segment = updated.graph.timeline.segments.find((s) => s.sceneId === scene.id)
    const progress = segment?.position.narrativeProgress ?? 0

    return {
      ...scene,
      measuredTension: tension?.measured,
      registerVector: style
        ? [
            style.registerMDA.narrativity,
            style.registerMDA.orality,
            style.registerMDA.informational,
            style.registerMDA.argumentation,
          ]
        : scene.registerVector,
      themeTags: style?.themeTags ?? scene.themeTags,
    }
  })

  updated.graph.fabula.nodes = updated.graph.fabula.nodes.map((event) => {
    const sceneRef = updated.graph.referenceMap.find((r) => r.eventId === event.id)
    if (!sceneRef) return event
    const segment = updated.graph.timeline.segments.find(
      (s) => s.sceneId === sceneRef.sceneId
    )
    const progress = segment?.position.narrativeProgress ?? 0
    return {
      ...event,
      tensionTarget: getTensionTarget(dramaticModel, progress),
      narrativeStage: stageForProgress(dramaticModel, progress) ?? event.narrativeStage,
    }
  })

  updated.analysis.dramaticArc = {
    model: dramaticModel,
    tensionSeries: result.tensionSeries,
    climaxSceneId: result.climaxSceneId,
    turningPoints: result.turningPoints,
  }
  updated.analysis.themes = result.themes
  updated.analysis.wavelengthDrift = result.wavelengthDrift

  const styleIssueTypes = new Set([
    "theme_drift",
    "wavelength_spike",
    "tension_mismatch",
  ])
  updated.analysis.plotIssues = updated.analysis.plotIssues.filter(
    (issue) => !styleIssueTypes.has(issue.type)
  )
  updated.analysis.plotIssues.push(...result.plotIssues)

  updated.analysis.computedAt = new Date().toISOString()
  updated.updatedAt = new Date().toISOString()

  return updated
}
