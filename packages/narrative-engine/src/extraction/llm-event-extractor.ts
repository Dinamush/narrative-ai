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
    kernelLevel: "kernel" | "satellite" | string
    participants: string[]
    sentenceIndex: number
  }>
}

const countWords = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0

export const maxEventsForScene = (text: string): number => {
  const words = countWords(text)
  return Math.min(24, Math.max(6, 6 + Math.ceil(words / 100)))
}

const maxPromptChars = (text: string): number => {
  const words = countWords(text)
  return Math.min(12000, Math.max(4000, words * 6))
}

const normalizeKernelLevel = (
  value: string | undefined,
  index: number
): "kernel" | "satellite" => {
  if (value === "kernel" || value === "satellite") return value
  if (/plot|essential|core/i.test(value ?? "")) return "kernel"
  return index === 0 ? "kernel" : "satellite"
}

const normalizeEventType = (
  value: string | undefined
): "action" | "happening" | "stasis" => {
  if (value === "action" || value === "happening" || value === "stasis") return value
  if (/thought|memory|reflection/i.test(value ?? "")) return "stasis"
  return "action"
}

const buildPrompt = (text: string) => {
  const cap = maxEventsForScene(text)
  const charLimit = maxPromptChars(text)

  return `Extract plot-significant fabula events from this fiction scene. Return JSON only.
The prose may use Caribbean/Creole dialect (e.g. "yuh", "meh", "nah", "bai", "cyant").
Use consistent participant names when identifiable (Ant, Uncle, Margaret, Old woman, Cousin, John, police).

Schema:
{
  "events": [{
    "label": "short past-tense plot beat",
    "eventType": "action|happening|stasis",
    "kernelLevel": "kernel|satellite",
    "participants": ["Ant", "Uncle"],
    "sentenceIndex": 0
  }]
}

Rules:
- Extract up to ${cap} events; include ALL plot kernels in action-dense scenes.
- kernel = removal would break plot logic (deaths, betrayals, contracts, escapes).
- satellite = atmosphere, reflection, sensory detail.
- One event per irreversible plot change, not one per sentence.
- participants: agents/patients of the action; use names from the text.
- kernelLevel MUST be "kernel" or "satellite" only.
- eventType MUST be "action", "happening", or "stasis" only.
- sentenceIndex: 0-based index into sentences split on [.!?] followed by space.
- Do not invent events not supported by the text.

Scene:
"""
${text.slice(0, charLimit)}
"""`
}

const mapLlmEvents = (
  input: SceneExtractionInput,
  parsed: LlmEventPayload
): EventNode[] => {
  const sentences = input.text.split(/(?<=[.!?])\s+/).filter(Boolean)
  const cap = maxEventsForScene(input.text)

  return parsed.events.slice(0, cap).map((evt, index) => {
    const sentence = sentences[evt.sentenceIndex] ?? sentences[index] ?? evt.label
    const startInScene = input.text.indexOf(sentence)
    const endInScene = startInScene >= 0 ? startInScene + sentence.length : sentence.length

    return {
      id: `evt-${input.sceneId}-${index}`,
      label: evt.label,
      fabulaTime: input.fabulaTimeBase + index,
      participants: evt.participants ?? [],
      eventType: normalizeEventType(evt.eventType),
      kernelLevel: normalizeKernelLevel(evt.kernelLevel, index),
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
