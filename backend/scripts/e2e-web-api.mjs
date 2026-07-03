/**
 * End-to-end smoke test for the Next.js web API.
 * Usage: npm run test:e2e
 * Requires dev server (npm run dev). Auto-detects port 3000–3002 unless E2E_BASE_URL is set.
 */
import { createEmptyNarrativeWork } from "@narrative-ai/graph-schema"

const CANDIDATE_BASES = [
  process.env.E2E_BASE_URL,
  "http://localhost:3001",
  "http://localhost:3000",
  "http://localhost:3002",
].filter(Boolean)

const SAMPLE_TEXT = `Chapter One

Elena opened the door slowly. Marcus stood in the rain.

"You're late," she said.

He stepped inside without a word.

***

The letter lay on the table. Elena read it twice before Marcus spoke.

"I never meant for any of this to happen," he whispered.`

const assert = (name, condition, detail) => {
  if (!condition) {
    throw new Error(`FAIL ${name}: ${detail}`)
  }
  console.log(`  ✓ ${name}`)
}

const parseSseChunk = (buffer) => {
  const events = []
  const lines = buffer.split("\n")
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        events.push(JSON.parse(line.slice(6)))
      } catch {
        // ignore
      }
    }
  }
  return events
}

const resolveBaseUrl = async () => {
  for (const candidate of CANDIDATE_BASES) {
    try {
      const response = await fetch(`${candidate}/api/llm/status`)
      if (response.ok) {
        return candidate
      }
    } catch {
      // try next port
    }
  }

  console.error("\nCould not reach the narrative-ai dev server.")
  console.error("Start it in another terminal: npm run dev")
  console.error("If Next.js picked another port, set: E2E_BASE_URL=http://localhost:3001 npm run test:e2e\n")
  process.exit(1)
}

const waitForAnalysis = async (base, jobId, timeoutMs = 180_000) => {
  const started = Date.now()
  let lastPhase = ""

  while (Date.now() - started < timeoutMs) {
    const response = await fetch(`${base}/api/analyze/${jobId}/stream`)
    if (!response.ok) {
      throw new Error(`Stream failed (${response.status})`)
    }

    const text = await response.text()
    const events = parseSseChunk(text)

    for (const event of events) {
      if (event.phase && event.phase !== lastPhase) {
        lastPhase = event.phase
        console.log(`    phase: ${event.phase} (${event.progress ?? 0}%)`)
      }

      if (event.status === "completed" && event.result) {
        return event.result
      }

      if (event.status === "failed") {
        throw new Error(event.error ?? event.message ?? "Analysis failed")
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`Analysis timed out after ${timeoutMs}ms (last phase: ${lastPhase || "none"})`)
}

const testLlmStatus = async (base) => {
  console.log("\n1. GET /api/llm/status")
  const response = await fetch(`${base}/api/llm/status`)
  assert("status_ok", response.ok, `HTTP ${response.status}`)
  const body = await response.json()
  assert("has_extraction_mode", typeof body.extractionMode === "string", JSON.stringify(body))
  console.log(`    mode=${body.extractionMode} available=${body.available ?? "n/a"}`)
  return body
}

const testAnalyze = async (base) => {
  console.log("\n2. POST /api/analyze + SSE stream")
  const work = createEmptyNarrativeWork({
    id: "e2e-test",
    title: "E2E Smoke Test",
    rawText: SAMPLE_TEXT,
  })

  const response = await fetch(`${base}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ work }),
  })

  assert("analyze_started", response.ok, `HTTP ${response.status}`)
  const { jobId } = await response.json()
  assert("job_id", typeof jobId === "string" && jobId.length > 0, String(jobId))

  const result = await waitForAnalysis(base, jobId)
  assert("fabula_events", result.graph.fabula.nodes.length > 0, "no fabula events")
  assert("syuzhet_scenes", result.graph.syuzhet.nodes.length >= 2, "expected ≥2 scenes")
  assert(
    "extraction_mode",
    ["heuristic", "ollama", "openai"].includes(result.metadata.extractionMode ?? ""),
    result.metadata.extractionMode ?? "missing"
  )

  console.log(
    `    events=${result.graph.fabula.nodes.length} scenes=${result.graph.syuzhet.nodes.length} mode=${result.metadata.extractionMode}`
  )
  return result
}

const main = async () => {
  const base = await resolveBaseUrl()
  console.log(`E2E web API smoke test → ${base}`)

  await testLlmStatus(base)
  await testAnalyze(base)

  console.log("\nAll e2e checks passed.\n")
}

main().catch((error) => {
  console.error(`\nE2E failed: ${error instanceof Error ? error.message : error}\n`)
  process.exit(1)
})
