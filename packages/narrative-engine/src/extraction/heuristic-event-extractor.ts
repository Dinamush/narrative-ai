import type { EventNode, NarrativeStage } from "@narrative-ai/graph-schema"

export type SceneExtractionInput = {
  sceneId: string
  text: string
  textOffsetStart: number
  fabulaTimeBase: number
  narrativeProgress: number
}

const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z"'])/

const stageForProgress = (progress: number): NarrativeStage => {
  if (progress < 0.1) return "exposition"
  if (progress < 0.7) return "rising_action"
  if (progress < 0.85) return "pre_climax"
  if (progress < 0.9) return "climax"
  if (progress < 0.95) return "falling_action"
  return "resolution"
}

const tensionForStage = (stage: NarrativeStage): number => {
  const map: Record<NarrativeStage, number> = {
    exposition: 0.15,
    rising_action: 0.45,
    pre_climax: 0.75,
    climax: 1,
    falling_action: 0.5,
    resolution: 0.2,
  }
  return map[stage]
}

const isSignificantSentence = (sentence: string) => {
  const trimmed = sentence.trim()
  if (trimmed.length < 24) return false
  if (/^["'(\[]/.test(trimmed) && trimmed.length < 40) return true
  return /\b(said|went|found|discovered|realized|decided|killed|died|married|escaped|arrived|left|saw|heard|thought|felt|turned|opened|closed|ran|fought|promised|refused|agreed)\b/i.test(trimmed)
}

export const extractEventsHeuristic = (
  input: SceneExtractionInput
): EventNode[] => {
  const sentences = input.text
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean)

  const significant = sentences.filter(isSignificantSentence).slice(0, 6)
  if (significant.length === 0 && sentences.length > 0) {
    significant.push(sentences[0].slice(0, 200))
  }

  const stage = stageForProgress(input.narrativeProgress)
  let cursor = 0
  const events: EventNode[] = []

  for (let i = 0; i < significant.length; i++) {
    const sentence = significant[i]
    const startInScene = input.text.indexOf(sentence, cursor)
    const endInScene = startInScene + sentence.length
    cursor = endInScene

    events.push({
      id: `evt-${input.sceneId}-${i}`,
      label: sentence.length > 120 ? `${sentence.slice(0, 117)}…` : sentence,
      fabulaTime: input.fabulaTimeBase + i,
      participants: [],
      eventType: "action",
      kernelLevel: i === 0 ? "kernel" : "satellite",
      narrativeStage: stage,
      tensionTarget: tensionForStage(stage),
      evidenceSpan: {
        start: input.textOffsetStart + Math.max(0, startInScene),
        end: input.textOffsetStart + Math.max(sentence.length, endInScene),
      },
    })
  }

  return events
}
