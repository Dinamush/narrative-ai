/**
 * Analyze Red Ants (Creole) manuscript and print summary for UI comparison.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createEmptyNarrativeWork } from "@narrative-ai/graph-schema"
import { runAnalysisPipeline } from "@narrative-ai/narrative-engine"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "../..")
const manuscriptPath = join(root, "samples/red-ants-creole.md")
const outputDir = join(root, "samples/output")

const rawText = readFileSync(manuscriptPath, "utf8")
const work = createEmptyNarrativeWork({
  id: "red-ants-creole",
  title: "Red Ants (Creole)",
  rawText,
})

console.log("Running full pipeline (Ollama if available)…\n")

const result = await runAnalysisPipeline(work, "bench-red-ants", (event) => {
  if (event.message) {
    console.log(`  [${event.phase}] ${event.progress}% — ${event.message}`)
  }
})

const w = result.work
const summary = {
  title: w.title,
  extractionMode: result.extractionMode,
  llmModel: w.metadata.llmModel,
  scenes: w.graph.syuzhet.nodes.length,
  chapters: w.graph.timeline.chapters.length,
  events: w.graph.fabula.nodes.length,
  fabulaEdges: w.graph.fabula.edges.length,
  propositions: w.graph.propositions.length,
  plotIssues: w.analysis.plotIssues.length,
  characters: w.graph.characters.nodes.map((c) => ({
    name: c.name,
    role: c.role,
    snapshots: c.stateSnapshots.length,
    arcShape: c.arcMetrics?.arcShape,
    egoGated: c.stateSnapshots.every(
      (s) => !s.egoQuest || s.egoQuest.profile?.gated !== false
    ),
  })),
  characterEdges: w.graph.characters.edges.length,
  themes: w.analysis.themes.slice(0, 10).map((t) => t.label),
  sampleEvents: w.graph.fabula.nodes.slice(0, 15).map((e) => e.label),
  climaxSceneId: w.analysis.dramaticArc.climaxSceneId,
  turningPoints: w.analysis.dramaticArc.turningPoints.length,
}

mkdirSync(outputDir, { recursive: true })
writeFileSync(
  join(outputDir, "red-ants-creole-analysis.json"),
  JSON.stringify({ summary, work: w }, null, 2)
)

console.log("\n=== PIPELINE SUMMARY ===\n")
console.log(JSON.stringify(summary, null, 2))
