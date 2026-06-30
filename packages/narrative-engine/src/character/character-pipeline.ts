import type {
  CharacterNode,
  CharacterStateSnapshot,
  NarrativeWork,
} from "@narrative-ai/graph-schema"
import {
  buildFictionEgoProfile,
  scoreEgoQuestFromText,
  shouldDisplayEgoQuest,
} from "@narrative-ai/egoquest-fiction"
import type { SegmentedScene } from "../ingestion/segment-manuscript.js"
import { scoreSentiment, sentimentToTension } from "../style/sentiment.js"
import {
  aggregateCharacterArcs,
  buildCharacterInsights,
  computeDeltaFromPrior,
} from "./arc-aggregator.js"
import {
  attributeSceneText,
  collectAttributedText,
} from "./dialogue-attributor.js"
import {
  buildCharacterNodes,
  extractRelationshipEdges,
  identifyCharacters,
  nameAppearsInText,
} from "./character-identifier.js"
import {
  collectEvidenceSpans,
  extractMentalStates,
} from "./mental-state-extractor.js"

let snapshotCounter = 0

const buildSnapshot = (
  character: CharacterNode,
  scene: SegmentedScene,
  position: CharacterStateSnapshot["position"],
  allNames: string[]
): CharacterStateSnapshot | null => {
  const spans = attributeSceneText(
    scene.text,
    scene.scene.textSpanRef.start,
    allNames
  )
  const attributed = collectAttributedText(spans, character.name)
  const appearsInScene =
    nameAppearsInText(scene.text, character.name) || attributed.length > 0

  if (!appearsInScene) return null

  const { goals, knowledge, dialogue, physical, mentalStates } = extractMentalStates(
    attributed,
    scene.text,
    character.id,
    character.name,
    scene.scene.textSpanRef.start
  )

  const voiceText =
    attributed.length >= 20
      ? attributed
      : collectAttributedText(
          attributeSceneText(scene.text, scene.scene.textSpanRef.start, allNames),
          character.name
        )

  const sentiment = scoreSentiment(voiceText.length >= 20 ? voiceText : scene.text)
  const tension = sentimentToTension(sentiment)
  const egoSignals = scoreEgoQuestFromText(voiceText.length >= 40 ? voiceText : "")
  const egoProfile = buildFictionEgoProfile(egoSignals, voiceText.length)

  const confidence = Math.min(
    1,
    0.35 +
      (attributed.length > 40 ? 0.25 : 0) +
      (goals.length + knowledge.length) * 0.08 +
      (shouldDisplayEgoQuest(egoProfile) ? 0.15 : 0)
  )

  snapshotCounter += 1
  const snapshot: CharacterStateSnapshot = {
    id: `snap-${character.id}-${snapshotCounter}`,
    characterId: character.id,
    position,
    confidence,
    dialogue,
    physical,
    knowledge,
    goals,
    mentalStates,
    attributeDeltas: [],
    affect: {
      valence: sentiment.valence,
      arousal: sentiment.arousal,
      dominance: 0.5,
      circumstanceAsActor: tension * 0.6,
      circumstanceAsExperiencer: sentiment.arousal * 0.7,
      emotions: sentiment.valence < -0.2
        ? [{ label: "distress", confidence: Math.abs(sentiment.valence) }]
        : sentiment.valence > 0.2
          ? [{ label: "hope", confidence: sentiment.valence }]
          : [],
    },
    evidenceSpans: collectEvidenceSpans(dialogue, goals, knowledge, physical),
  }

  if (shouldDisplayEgoQuest(egoProfile)) {
    snapshot.egoQuest = {
      profile: egoProfile as Record<string, unknown>,
      activationStrength: egoProfile.activationStrength,
      dominantMechanisms: egoSignals.detectedMechanisms,
    }
  }

  return snapshot
}

export type CharacterPipelineResult = {
  nodes: CharacterNode[]
  edges: ReturnType<typeof extractRelationshipEdges>
  characterInsights: NarrativeWork["analysis"]["characterInsights"]
}

export const runCharacterPipeline = (
  work: NarrativeWork,
  scenes: SegmentedScene[]
): CharacterPipelineResult => {
  snapshotCounter = 0
  const candidates = identifyCharacters(scenes, work.graph.fabula.nodes)
  let nodes = buildCharacterNodes(candidates, work.graph.fabula.nodes)
  const allNames = nodes.map((n) => n.name)

  nodes = nodes.map((node) => {
    const snapshots: CharacterStateSnapshot[] = []
    const egoProfiles = [...node.egoProfiles]
    let prior: CharacterStateSnapshot | null = null

    for (const scene of scenes) {
      const segment = work.graph.timeline.segments.find(
        (s) => s.sceneId === scene.scene.id
      )
      const position = segment?.position ?? {
        chapterId: scene.chapterId,
        chapterIndex: scene.chapterIndex,
        sceneId: scene.scene.id,
        syuzhetIndex: scene.scene.syuzhetIndex,
        fabulaTime: scene.scene.syuzhetIndex,
        narrativeProgress: 0,
      }

      const snapshot = buildSnapshot(node, scene, position, allNames)
      if (!snapshot) continue

      if (prior) {
        snapshot.deltaFromPrior = computeDeltaFromPrior(prior, snapshot)
      }

      if (snapshot.egoQuest) {
        egoProfiles.push({
          sceneId: scene.scene.id,
          profile: snapshot.egoQuest.profile,
          confidence: snapshot.confidence,
          evidenceSpans: snapshot.evidenceSpans,
        })
      }

      snapshots.push(snapshot)
      prior = snapshot
    }

    return { ...node, stateSnapshots: snapshots, egoProfiles }
  })

  nodes = aggregateCharacterArcs(nodes)

  for (const segment of work.graph.timeline.segments) {
    const present = nodes.filter((n) =>
      n.stateSnapshots.some((s) => s.position.sceneId === segment.sceneId)
    )
    segment.participantIds = present.map((n) => n.id)
  }

  const edges = extractRelationshipEdges(scenes, nodes)
  const characterInsights = buildCharacterInsights(nodes)

  return { nodes, edges, characterInsights }
}

export const applyCharacterAnalysis = (
  work: NarrativeWork,
  scenes: SegmentedScene[]
): NarrativeWork => {
  const result = runCharacterPipeline(work, scenes)
  const updated = structuredClone(work)
  updated.graph.characters.nodes = result.nodes
  updated.graph.characters.edges = result.edges
  updated.analysis.characterInsights = result.characterInsights
  updated.updatedAt = new Date().toISOString()
  return updated
}
