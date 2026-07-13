/**
 * Compare local LLM models against expected narrative benchmarks.
 * Usage:
 *   node backend/scripts/compare-llm-models.mjs
 *   node backend/scripts/compare-llm-models.mjs --models llama3.2,qwythos:9b-q4
 *   node backend/scripts/compare-llm-models.mjs --sample red-ants
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createEmptyNarrativeWork } from "@narrative-ai/graph-schema"
import { runAnalysisPipeline } from "@narrative-ai/narrative-engine"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "../..")
const outputDir = join(root, "samples/output")

const BENCHMARKS = {
  "red-ants": {
    file: "red-ants-creole.md",
    id: "red-ants-creole",
    title: "Red Ants (Creole)",
    expected: {
      scenesMin: 8,
      scenesMax: 12,
      eventsMin: 35,
      eventsMax: 80,
      requiredCharacters: ["Ant", "Uncle", "Cousin", "Old woman", "Margaret"],
      optionalCharacters: ["John", "Police", "Mother"],
      forbiddenCharacters: ["Yuh", "But", "Red", "Kill", "Meh", "What", "No", "In"],
      requiredThemes: ["betrayal"],
      protagonist: "Ant",
      antagonist: "Uncle",
    },
  },
  "ward-rounds": {
    file: "ward-rounds.md",
    id: "ward-rounds",
    title: "Ward Rounds",
    expected: {
      scenesMin: 3,
      scenesMax: 5,
      eventsMin: 5,
      eventsMax: 20,
      requiredCharacters: ["Amara"],
      optionalCharacters: ["Cole", "Director"],
      forbiddenCharacters: [],
      requiredThemes: [],
      protagonist: null,
      antagonist: null,
    },
  },
}

const DEFAULT_MODELS = ["llama3.2", "qwythos:9b-q4"]

const parseArgs = () => {
  const args = process.argv.slice(2)
  let models = DEFAULT_MODELS
  let sampleKey = "red-ants"

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--models" && args[i + 1]) {
      models = args[++i].split(",").map((m) => m.trim()).filter(Boolean)
    }
    if (args[i] === "--sample" && args[i + 1]) {
      sampleKey = args[++i]
    }
  }

  return { models, sampleKey }
}

const summarize = (work, extractionMode, elapsedMs) => {
  const charNames = work.graph.characters.nodes.map((c) => c.name)
  const roles = Object.fromEntries(
    work.graph.characters.nodes.map((c) => [c.name, c.role])
  )

  return {
    model: work.metadata.llmModel,
    extractionMode,
    elapsedSec: Math.round(elapsedMs / 1000),
    scenes: work.graph.syuzhet.nodes.length,
    events: work.graph.fabula.nodes.length,
    fabulaEdges: work.graph.fabula.edges.length,
    plotIssues: work.analysis.plotIssues.length,
    characters: charNames,
    roles,
    themes: work.analysis.themes.slice(0, 10).map((t) => t.label),
    sampleEvents: work.graph.fabula.nodes.slice(0, 8).map((e) => e.label),
  }
}

const scoreBenchmark = (summary, expected) => {
  const checks = []
  const add = (name, pass, detail) => checks.push({ name, pass, detail })

  add(
    "scenes_in_range",
    summary.scenes >= expected.scenesMin && summary.scenes <= expected.scenesMax,
    `${summary.scenes} scenes (expected ${expected.scenesMin}–${expected.scenesMax})`
  )

  add(
    "events_in_range",
    summary.events >= expected.eventsMin && summary.events <= expected.eventsMax,
    `${summary.events} events (expected ${expected.eventsMin}–${expected.eventsMax})`
  )

  for (const name of expected.requiredCharacters) {
    const found = summary.characters.some(
      (c) => c.toLowerCase() === name.toLowerCase()
    )
    add(`character_${name.toLowerCase()}`, found, found ? `found ${name}` : `missing ${name}`)
  }

  for (const name of expected.forbiddenCharacters) {
    const found = summary.characters.some(
      (c) => c.toLowerCase() === name.toLowerCase()
    )
    add(`no_false_${name.toLowerCase()}`, !found, found ? `false positive: ${name}` : `ok`)
  }

  if (expected.protagonist) {
    const role = summary.roles[expected.protagonist]
    add(
      "protagonist_role",
      role === "protagonist",
      `${expected.protagonist} → ${role ?? "not found"}`
    )
  }

  if (expected.antagonist) {
    const role = summary.roles[expected.antagonist]
    add(
      "antagonist_role",
      role === "antagonist",
      `${expected.antagonist} → ${role ?? "not found"}`
    )
  }

  for (const theme of expected.requiredThemes) {
    const found = summary.themes.some((t) => t.toLowerCase().includes(theme))
    add(`theme_${theme}`, found, found ? `found ${theme}` : `missing ${theme}`)
  }

  add("no_plot_issues", summary.plotIssues === 0, `${summary.plotIssues} plot issues`)

  const passed = checks.filter((c) => c.pass).length
  return { checks, passed, total: checks.length, score: `${passed}/${checks.length}` }
}

const runForModel = async (benchmark, model) => {
  process.env.LLM_PROVIDER = "ollama"
  process.env.OLLAMA_MODEL = model

  const rawText = readFileSync(join(root, "samples", benchmark.file), "utf8")
  const work = createEmptyNarrativeWork({
    id: `${benchmark.id}-${model.replace(/[^a-z0-9]+/gi, "-")}`,
    title: benchmark.title,
    rawText,
  })

  console.log(`\n▶ ${benchmark.title} · ${model}`)
  const started = Date.now()

  const result = await runAnalysisPipeline(work, `bench-${model}`, (event) => {
    if (event.message && event.progress % 20 === 0) {
      process.stdout.write(`  ${event.progress}% `)
    }
  })

  const elapsed = Date.now() - started
  console.log(`done (${Math.round(elapsed / 1000)}s)`)

  const summary = summarize(result.work, result.extractionMode, elapsed)
  const scoring = scoreBenchmark(summary, benchmark.expected)

  return { model, summary, scoring }
}

const { models, sampleKey } = parseArgs()
const benchmark = BENCHMARKS[sampleKey]

if (!benchmark) {
  console.error(`Unknown sample: ${sampleKey}. Use: ${Object.keys(BENCHMARKS).join(", ")}`)
  process.exit(1)
}

console.log("=".repeat(60))
console.log("LLM model comparison — expected vs actual")
console.log("=".repeat(60))
console.log(`Sample: ${benchmark.title}`)
console.log(`Models: ${models.join(", ")}`)

const results = []
for (const model of models) {
  results.push(await runForModel(benchmark, model))
}

mkdirSync(outputDir, { recursive: true })
const reportPath = join(outputDir, `llm-compare-${sampleKey}.json`)
writeFileSync(reportPath, JSON.stringify({ sample: sampleKey, results }, null, 2))

console.log("\n" + "=".repeat(60))
console.log("RESULTS")
console.log("=".repeat(60))

for (const { model, summary, scoring } of results) {
  console.log(`\n## ${model} — score ${scoring.score} (${summary.elapsedSec}s)`)
  console.log(
    `   scenes=${summary.scenes} events=${summary.events} characters=${summary.characters.length}`
  )
  console.log(`   cast: ${summary.characters.join(", ")}`)
  console.log(`   themes: ${summary.themes.join(", ")}`)

  const failed = scoring.checks.filter((c) => !c.pass)
  if (failed.length > 0) {
    console.log("   misses:")
    for (const f of failed) console.log(`     ✗ ${f.name}: ${f.detail}`)
  } else {
    console.log("   ✓ all benchmark checks passed")
  }
}

console.log(`\nFull report: ${reportPath}`)

const best = [...results].sort(
  (a, b) => b.scoring.passed - a.scoring.passed || a.summary.elapsedSec - b.summary.elapsedSec
)[0]
console.log(`\nRecommended for ${benchmark.title}: ${best.model} (${best.scoring.score})`)
