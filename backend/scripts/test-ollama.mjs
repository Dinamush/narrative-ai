import { resolveLlmConfig } from "@narrative-ai/narrative-engine"
import { chatCompletionJson, extractEventsForScene } from "@narrative-ai/narrative-engine"

const config = resolveLlmConfig()
console.log("config:", config)

if (!config) {
  console.error("No LLM config")
  process.exit(1)
}

try {
  const raw = await chatCompletionJson(config, [
    {
      role: "user",
      content:
        'Return JSON only: {"events":[{"label":"Elena opened the door","eventType":"action","kernelLevel":"kernel","participants":["Elena"],"sentenceIndex":0}]}',
    },
  ])
  console.log("raw response:", raw.slice(0, 300))
} catch (error) {
  console.error("chat error:", error instanceof Error ? error.message : error)
}

try {
  const result = await extractEventsForScene({
    sceneId: "s0",
    text: "Elena opened the door. Marcus said he would not leave her behind.",
    textOffsetStart: 0,
    fabulaTimeBase: 0,
    narrativeProgress: 0.3,
  })

  console.log("extraction:", {
    mode: result.mode,
    events: result.events.map((e) => e.label),
  })
} catch (error) {
  console.error("extract error:", error)
}
