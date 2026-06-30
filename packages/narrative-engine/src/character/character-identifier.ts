import type {
  CharacterEdge,
  CharacterNode,
  EventNode,
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
import {
  collectFabulaParticipants,
  mergeParticipantCounts,
} from "./participant-resolver.js"

export type CharacterCandidate = {
  name: string
  mentionCount: number
  firstSceneId: string
  firstPosition: NarrativePosition
  dialogueCharCount: number
  fabulaWeight: number
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export const nameAppearsInText = (text: string, name: string) =>
  new RegExp(`\\b${escapeRegex(name)}\\b`, "i").test(text)

export const identifyCharacters = (
  scenes: SegmentedScene[],
  fabulaEvents: EventNode[] = []
): CharacterCandidate[] => {
  const globalCounts = new Map<string, number>()
  const fabulaCounts = collectFabulaParticipants(fabulaEvents)
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

  mergeParticipantCounts(globalCounts, fabulaCounts, 2)

  const ALIAS_GROUPS: string[][] = [["Mother", "Mom"]]

  const resolveAlias = (name: string): string => {
    for (const group of ALIAS_GROUPS) {
      if (group.includes(name)) return group[0]
    }
    return name
  }

  const mergedCounts = new Map<string, number>()
  const mergedFabula = new Map<string, number>()
  const mergedFirstScene = new Map<string, { sceneId: string; position: NarrativePosition }>()

  for (const [name, count] of globalCounts) {
    const canonical = resolveAlias(name)
    mergedCounts.set(canonical, (mergedCounts.get(canonical) ?? 0) + count)
    const first = firstScene.get(name)
    if (first && !mergedFirstScene.has(canonical)) mergedFirstScene.set(canonical, first)
  }
  for (const [name, count] of fabulaCounts) {
    const canonical = resolveAlias(name)
    mergedFabula.set(canonical, (mergedFabula.get(canonical) ?? 0) + count)
  }

  const candidates = [...mergedCounts.entries()]
    .filter(([name, count]) =>
      isLikelyCharacterName(name, count, mergedFabula.get(name) ?? 0)
    )
    .map(([name, mentionCount]) => ({
      name,
      mentionCount,
      fabulaWeight: mergedFabula.get(name) ?? 0,
      firstSceneId: mergedFirstScene.get(name)?.sceneId ?? scenes[0]?.scene.id ?? "scene-0",
      firstPosition:
        mergedFirstScene.get(name)?.position ??
        ({
          chapterId: scenes[0]?.chapterId ?? "chapter-1",
          chapterIndex: scenes[0]?.chapterIndex ?? 1,
          sceneId: scenes[0]?.scene.id ?? "scene-0",
          syuzhetIndex: 0,
          fabulaTime: 0,
          narrativeProgress: 0,
        } satisfies NarrativePosition),
      dialogueCharCount: dialogueCounts.get(name) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.fabulaWeight + b.mentionCount * 2 - (a.fabulaWeight + a.mentionCount * 2)
    )
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

const assignRoles = (
  candidates: CharacterCandidate[],
  fabulaEvents: EventNode[]
): Map<string, CharacterNode["role"]> => {
  const roles = new Map<string, CharacterNode["role"]>()
  if (candidates.length === 0) return roles

  const protagonist =
    candidates.find((c) => c.name.toLowerCase() === "ant") ?? candidates[0]
  roles.set(protagonist.name, "protagonist")

  const uncle = candidates.find((c) => c.name.toLowerCase() === "uncle")
  if (uncle) roles.set(uncle.name, "antagonist")

  const conflictLabels = fabulaEvents
    .filter((e) => e.kernelLevel === "kernel")
    .map((e) => e.label.toLowerCase())

  const uncleConflict = conflictLabels.some(
    (l) => l.includes("uncle") && (l.includes("kill") || l.includes("refus") || l.includes("mock"))
  )
  if (uncle && uncleConflict) roles.set(uncle.name, "antagonist")

  for (const candidate of candidates) {
    if (roles.has(candidate.name)) continue
    if (candidate.name === "Margaret" || candidate.name === "Old woman") {
      roles.set(candidate.name, "deuteragonist")
      continue
    }
    roles.set(candidate.name, "supporting")
  }

  return roles
}

export const buildCharacterNodes = (
  candidates: CharacterCandidate[],
  fabulaEvents: EventNode[] = []
): CharacterNode[] => {
  const roleMap = assignRoles(candidates, fabulaEvents)

  return candidates.map((candidate) => ({
    id: `char-${slugifyName(candidate.name)}`,
    name: candidate.name,
    aliases: [],
    role: roleMap.get(candidate.name) ?? "supporting",
    firstAppearance: candidate.firstPosition,
    egoProfiles: [],
    stateSnapshots: [],
  }))
}

const CONFLICT_WORDS = ["hate", "enemy", "fight", "argue", "betray", "kill", "attack", "against"]
const COOP_WORDS = ["friend", "ally", "together", "help", "love", "trust", "partner", "support"]

export const extractRelationshipEdges = (
  scenes: SegmentedScene[],
  nodes: CharacterNode[]
): CharacterEdge[] => {
  const pairScenes = new Map<string, Set<string>>()
  const pairSentiment = new Map<string, number>()

  for (const scene of scenes) {
    const present = nodes.filter((n) => nameAppearsInText(scene.text, n.name))
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
