import type { EventNode } from "@narrative-ai/graph-schema"
import type { SceneExtractionInput } from "./heuristic-event-extractor.js"
import { extractEventsHeuristic } from "./heuristic-event-extractor.js"
import { chatCompletionJson } from "../llm/llm-client.js"
import { parseLlmJson } from "../llm/parse-llm-json.js"
import {
  extractionModeForProvider,
  resolveLlmConfig,
  type ExtractionMode,
} from "../llm/llm-config.js"

type LlmEventPayload = {
  events: Array<{
    label: string
    eventType: "action" | "happening" | "stasis"
    kernelLevel: "kernel" | "satellite"
    participants: string[]
    sentenceIndex: number
  }>
}

const buildPrompt = (text: string) => `Extract plot-significant events from this scene. Return JSON only.

Schema:
{
  "events": [{
    "label": "short event description",
    "eventType": "action|happening|stasis",
    "kernelLevel": "kernel|satellite",
    "participants": ["character names"],
    "sentenceIndex": 0
  }]
}

Rules:
- Max 6 events per scene
- kernel = plot-essential; satellite = embellishment
- Use exact phrases from text for labels where possible
- Do not invent events not supported by the text
- sentenceIndex is 0-based index into the scene sentences

Scene:
"""
${text.slice(0, 4000)}
"""`

const mapLlmEvents = (
  input: SceneExtractionInput,
  parsed: LlmEventPayload
): EventNode[] => {
  const sentences = input.text.split(/(?<=[.!?])\s+/).filter(Boolean)

  return parsed.events.slice(0, 6).map((evt, index) => {
    const sentence = sentences[evt.sentenceIndex] ?? sentences[index] ?? evt.label
    const startInScene = input.text.indexOf(sentence)
    const endInScene = startInScene >= 0 ? startInScene + sentence.length : sentence.length

    return {
      id: `evt-${input.sceneId}-${index}`,
      label: evt.label,
      fabulaTime: input.fabulaTimeBase + index,
      participants: evt.participants ?? [],
      eventType: evt.eventType ?? "action",
      kernelLevel: evt.kernelLevel ?? (index === 0 ? "kernel" : "satellite"),
      evidenceSpan: {
        start: input.textOffsetStart + (startInScene >= 0 ? startInScene : 0),
        end:
          input.textOffsetStart +
          (startInScene >= 0 ? endInScene : Math.min(input.text.length, 120)),
      },
    }
  })
}

export const extractEventsWithLlm = async (
  input: SceneExtractionInput
): Promise<{ events: EventNode[]; mode: ExtractionMode }> => {
  const config = resolveLlmConfig()
  if (!config) {
    return { events: extractEventsHeuristic(input), mode: "heuristic" }
  }

  const content = await chatCompletionJson(config, [
    {
      role: "system",
      content:
        "You extract structured narrative events from fiction scenes. Output valid JSON only.",
    },
    { role: "user", content: buildPrompt(input.text) },
  ])

  const parsed = parseLlmJson<LlmEventPayload>(content)
  const events = mapLlmEvents(input, parsed)

  if (events.length === 0) {
    return { events: extractEventsHeuristic(input), mode: "heuristic" }
  }

  return {
    events,
    mode: extractionModeForProvider(config.provider),
  }
}

export const extractEventsForScene = async (
  input: SceneExtractionInput
): Promise<{ events: EventNode[]; mode: ExtractionMode }> => {
  const config = resolveLlmConfig()
  if (!config) {
    return { events: extractEventsHeuristic(input), mode: "heuristic" }
  }

  try {
    return await extractEventsWithLlm(input)
  } catch (error) {
    if (process.env.LLM_DEBUG === "1") {
      console.error("[llm-event-extractor]", error)
    }
    return { events: extractEventsHeuristic(input), mode: "heuristic" }
  }
}

