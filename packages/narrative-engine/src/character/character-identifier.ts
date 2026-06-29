import type {
  CharacterEdge,
  CharacterNode,
  NarrativePosition,
} from "@narrative-ai/graph-schema"
import type { SegmentedScene } from "../ingestion/segment-manuscript.js"
import {
  attributeSceneText,
  collectAttributedText,
} from "./dialogue-attributor.js"
import {
  extractNameMentions,
  isLikelyCharacterName,
  mergeNameCounts,
  slugifyName,
} from "./name-extractor.js"

export type CharacterCandidate = {
  name: string
  mentionCount: number
  firstSceneId: string
  firstPosition: NarrativePosition
  dialogueCharCount: number
}

export const identifyCharacters = (
  scenes: SegmentedScene[]
): CharacterCandidate[] => {
  const globalCounts = new Map<string, number>()
  const firstScene = new Map<string, { sceneId: string; position: NarrativePosition }>()
  const dialogueCounts = new Map<string, number>()

  for (const scene of scenes) {
    const segmentPosition: NarrativePosition = {
      chapterId: scene.chapterId,
      chapterIndex: scene.chapterIndex,
      sceneId: scene.scene.id,
      syuzhetIndex: scene.scene.syuzhetIndex,
      fabulaTime: scene.scene.syuzhetIndex,
      narrativeProgress: 0,
    }

    const sceneCounts = extractNameMentions(scene.text, scene.scene.id)
    mergeNameCounts(globalCounts, sceneCounts)

    for (const name of sceneCounts.keys()) {
      if (!firstScene.has(name)) {
        firstScene.set(name, { sceneId: scene.scene.id, position: segmentPosition })
      }
    }
  }

  const candidates = [...globalCounts.entries()]
    .filter(([name, count]) => isLikelyCharacterName(name, count))
    .map(([name, mentionCount]) => ({
      name,
      mentionCount,
      firstSceneId: firstScene.get(name)!.sceneId,
      firstPosition: firstScene.get(name)!.position,
      dialogueCharCount: dialogueCounts.get(name) ?? 0,
    }))
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 12)

  for (const scene of scenes) {
    const names = candidates.map((c) => c.name)
    const spans = attributeSceneText(
      scene.text,
      scene.scene.textSpanRef.start,
      names
    )
    for (const span of spans) {
      const existing = candidates.find(
        (c) => c.name.toLowerCase() === span.characterName.toLowerCase()
      )
      if (existing) {
        existing.dialogueCharCount += span.text.length
      }
    }
  }

  return candidates
}

export const buildCharacterNodes = (
  candidates: CharacterCandidate[]
): CharacterNode[] =>
  candidates.map((candidate, index) => {
    const role =
      index === 0
        ? "protagonist"
        : index === 1
          ? "deuteragonist"
          : index === 2
            ? "antagonist"
            : "supporting"

    return {
      id: `char-${slugifyName(candidate.name)}`,
      name: candidate.name,
      aliases: [],
      role: role as CharacterNode["role"],
      firstAppearance: candidate.firstPosition,
      egoProfiles: [],
      stateSnapshots: [],
    }
  })

const CONFLICT_WORDS = ["hate", "enemy", "fight", "argue", "betray", "kill", "attack", "against"]
const COOP_WORDS = ["friend", "ally", "together", "help", "love", "trust", "partner", "support"]

export const extractRelationshipEdges = (
  scenes: SegmentedScene[],
  nodes: CharacterNode[]
): CharacterEdge[] => {
  const nameToId = new Map(nodes.map((n) => [n.name.toLowerCase(), n.id]))
  const pairScenes = new Map<string, Set<string>>()
  const pairSentiment = new Map<string, number>()

  for (const scene of scenes) {
    const present = nodes.filter((n) =>
      scene.text.toLowerCase().includes(n.name.toLowerCase())
    )
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        const key = [present[i].id, present[j].id].sort().join("|")
        const scenesSet = pairScenes.get(key) ?? new Set()
        scenesSet.add(scene.scene.id)
        pairScenes.set(key, scenesSet)

        const lower = scene.text.toLowerCase()
        let sentiment = pairSentiment.get(key) ?? 0
        for (const w of CONFLICT_WORDS) {
          if (lower.includes(w)) sentiment -= 0.15
        }
        for (const w of COOP_WORDS) {
          if (lower.includes(w)) sentiment += 0.15
        }
        pairSentiment.set(key, sentiment)
      }
    }
  }

  const edges: CharacterEdge[] = []
  let edgeIndex = 0

  for (const [key, sceneSet] of pairScenes) {
    const [source, target] = key.split("|")
    const sentiment = pairSentiment.get(key) ?? 0
    const relation =
      sentiment < -0.2 ? "conflict" : sentiment > 0.2 ? "cooperative" : "emotional"

    edges.push({
      id: `char-edge-${edgeIndex++}`,
      source,
      target,
      relation: relation as CharacterEdge["relation"],
      scenes: [...sceneSet],
      weight: sceneSet.size,
      sentiment: Math.max(-1, Math.min(1, sentiment)),
      supportingEventIds: [],
    })
  }

  return edges
}

export const getAttributedTextForCharacter = (
  scenes: SegmentedScene[],
  characterName: string,
  allNames: string[]
): string => {
  const parts: string[] = []
  for (const scene of scenes) {
    const spans = attributeSceneText(
      scene.text,
      scene.scene.textSpanRef.start,
      allNames
    )
    parts.push(collectAttributedText(spans, characterName))
  }
  return parts.filter(Boolean).join(" ").trim()
}
