/**
 * Run full narrative analysis on sample manuscripts and verify outputs.
 * Usage: node backend/scripts/run-sample-analysis.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createEmptyNarrativeWork } from "@narrative-ai/graph-schema"
import {
  applyStyleToWork,
  runAnalysisPipeline,
  segmentManuscript,
} from "@narrative-ai/narrative-engine"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "../..")
const samplesDir = join(root, "samples")
const outputDir = join(samplesDir, "output")

const SAMPLES = [
  { id: "the-last-light", file: "the-last-light.md", title: "The Last Light" },
  { id: "ward-rounds", file: "ward-rounds.md", title: "Ward Rounds" },
]

const DRAMATIC_MODELS = ["freytag", "three_act", "fichtean"]

const check = (name, pass, detail) => ({ name, pass, detail })

const summarizeWork = (work, extractionMode) => {
  const tensionPeak = [...work.analysis.dramaticArc.tensionSeries].sort(
    (a, b) => b.measured - a.measured
  )[0]

  return {
    extractionMode,
    scenes: work.graph.syuzhet.nodes.length,
    events: work.graph.fabula.nodes.length,
    fabulaEdges: work.graph.fabula.edges.length,
    propositions: work.graph.propositions.length,
    referenceLinks: work.graph.referenceMap.length,
    styleTimeline: work.graph.styleTimeline.length,
    themes: work.analysis.themes.slice(0, 5).map((t) => t.label),
    issueTypes: [...new Set(work.analysis.plotIssues.map((i) => i.type))],
    issueCount: work.analysis.plotIssues.length,
    characters: work.graph.characters.nodes.map((c) => ({
      name: c.name,
      role: c.role,
      snapshots: c.stateSnapshots.length,
      arcShape: c.arcMetrics?.arcShape,
      hasEgoQuest: c.stateSnapshots.some(
        (s) => s.egoQuest && !s.egoQuest.profile?.gated
      ),
    })),
    characterEdges: work.graph.characters.edges.length,
    characterInsights: work.analysis.characterInsights.length,
    dramaticModel: work.analysis.dramaticArc.model,
    tensionPoints: work.analysis.dramaticArc.tensionSeries.length,
    climaxSceneId: work.analysis.dramaticArc.climaxSceneId,
    peakTension: tensionPeak?.measured,
    turningPoints: work.analysis.dramaticArc.turningPoints.length,
    wavelengthFlags: work.analysis.wavelengthDrift.filter((d) => d.flagged).length,
  }
}

const verifySample = (work, sampleId, extractionMode) => {
  const checks = []

  checks.push(
    check(
      "segmentation_scenes",
      work.graph.syuzhet.nodes.length >= 3,
      `${work.graph.syuzhet.nodes.length} scenes (expected ≥3)`
    )
  )

  checks.push(
    check(
      "segmentation_chapters",
      work.graph.timeline.chapters.length >= 2,
      `${work.graph.timeline.chapters.length} chapters (expected ≥2)`
    )
  )

  checks.push(
    check(
      "fabula_events",
      work.graph.fabula.nodes.length >= 3,
      `${work.graph.fabula.nodes.length} events (expected ≥3)`
    )
  )

  checks.push(
    check(
      "fabula_edges",
      work.graph.fabula.edges.length >= 2,
      `${work.graph.fabula.edges.length} causal edges (expected ≥2)`
    )
  )

  checks.push(
    check(
      "syuzhet_references",
      work.graph.referenceMap.length >= work.graph.syuzhet.nodes.length,
      `${work.graph.referenceMap.length} reference links for ${work.graph.syuzhet.nodes.length} scenes`
    )
  )

  checks.push(
    check(
      "style_timeline",
      work.graph.styleTimeline.length === work.graph.syuzhet.nodes.length,
      `style timeline ${work.graph.styleTimeline.length} vs scenes ${work.graph.syuzhet.nodes.length}`
    )
  )

  checks.push(
    check(
      "tension_series",
      work.analysis.dramaticArc.tensionSeries.length === work.graph.syuzhet.nodes.length,
      `${work.analysis.dramaticArc.tensionSeries.length} tension points`
    )
  )

  checks.push(
    check(
      "themes_detected",
      work.analysis.themes.length >= 1,
      `themes: ${work.analysis.themes.map((t) => t.label).join(", ") || "none"}`
    )
  )

  checks.push(
    check(
      "characters_identified",
      work.graph.characters.nodes.length >= 2,
      `${work.graph.characters.nodes.length} characters: ${work.graph.characters.nodes.map((n) => n.name).join(", ")}`
    )
  )

  checks.push(
    check(
      "character_snapshots",
      work.graph.characters.nodes.some((n) => n.stateSnapshots.length >= 2),
      `max snapshots: ${Math.max(0, ...work.graph.characters.nodes.map((n) => n.stateSnapshots.length))}`
    )
  )

  checks.push(
    check(
      "character_relationships",
      work.graph.characters.edges.length >= 1,
      `${work.graph.characters.edges.length} relationship edges`
    )
  )

  checks.push(
    check(
      "character_insights",
      work.analysis.characterInsights.length >= 2,
      `${work.analysis.characterInsights.length} insights`
    )
  )

  checks.push(
    check(
      "arc_metrics",
      work.graph.characters.nodes.some((n) => n.arcMetrics?.arcShape),
      `arc shapes: ${work.graph.characters.nodes.map((n) => n.arcMetrics?.arcShape ?? "—").join(", ")}`
    )
  )

  checks.push(
    check(
      "propositions",
      work.graph.propositions.length >= 1,
      `${work.graph.propositions.length} propositions`
    )
  )

  checks.push(
    check(
      "no_dag_cycles",
      !work.analysis.plotIssues.some(
        (i) => i.type === "causal_break" && i.message.includes("cycle")
      ),
      `plot issues: ${work.analysis.plotIssues.length} (${[...new Set(work.analysis.plotIssues.map((i) => i.type))].join(", ")})`
    )
  )

  if (sampleId === "the-last-light") {
    const names = work.graph.characters.nodes.map((n) => n.name.toLowerCase())
    checks.push(
      check(
        "expected_protagonist_elena",
        names.some((n) => n.includes("elena")),
        `found names: ${names.join(", ")}`
      )
    )
    checks.push(
      check(
        "expected_cast_marcus_or_thomas",
        names.some((n) => n.includes("marcus") || n.includes("thomas")),
        `found names: ${names.join(", ")}`
      )
    )
    checks.push(
      check(
        "betrayal_or_love_theme",
        work.analysis.themes.some((t) =>
          ["betrayal", "love", "power", "loss", "justice"].includes(t.label)
        ),
        `themes: ${work.analysis.themes.map((t) => t.label).join(", ")}`
      )
    )
  }

  if (sampleId === "ward-rounds") {
    const names = work.graph.characters.nodes.map((n) => n.name.toLowerCase())
    checks.push(
      check(
        "expected_amara",
        names.some((n) => n.includes("amara")),
        `found names: ${names.join(", ")}`
      )
    )
  }

  checks.push(
    check(
      "extraction_mode",
      ["heuristic", "ollama", "openai", "llm"].includes(extractionMode),
      `mode: ${extractionMode}`
    )
  )

  return checks
}

const verifyDramaticModels = (work, rawText) => {
  const { scenes } = segmentManuscript(rawText)
  const results = []

  for (const model of DRAMATIC_MODELS) {
    const styled = applyStyleToWork(work, scenes, model)
    const series = styled.analysis.dramaticArc.tensionSeries
    const targets = series.map((p) => p.target)
    const uniqueTargets = new Set(targets.map((t) => t.toFixed(2))).size
    const climaxProgress = styled.graph.timeline.segments.find(
      (s) => s.sceneId === styled.analysis.dramaticArc.climaxSceneId
    )?.position.narrativeProgress

    results.push({
      model,
      pass: series.length === work.graph.syuzhet.nodes.length && uniqueTargets >= 3,
      detail: `targets vary (${uniqueTargets} unique), climax at ${climaxProgress != null ? Math.round(climaxProgress * 100) : "?"}%`,
      issueCount: styled.analysis.plotIssues.filter((i) => i.type === "tension_mismatch").length,
    })
  }

  return results
}

const runSample = async (sample) => {
  const rawText = readFileSync(join(samplesDir, sample.file), "utf8")
  const work = createEmptyNarrativeWork({
    id: sample.id,
    title: sample.title,
    rawText,
  })

  const jobId = `sample-${sample.id}`
  const phases = []

  const result = await runAnalysisPipeline(work, jobId, (event) => {
    phases.push({ phase: event.phase, progress: event.progress, message: event.message })
  })

  const analyzed = result.work
  const summary = summarizeWork(analyzed, result.extractionMode)
  const checks = verifySample(analyzed, sample.id, result.extractionMode)
  const modelChecks = verifyDramaticModels(analyzed, rawText)

  return {
    sample: sample.id,
    title: sample.title,
    summary,
    checks,
    modelChecks,
    phases: phases.filter((p, i, arr) => arr.findIndex((x) => x.phase === p.phase) === i),
    passed: checks.every((c) => c.pass),
    modelsPassed: modelChecks.every((m) => m.pass),
  }
}

const main = async () => {
  mkdirSync(outputDir, { recursive: true })

  console.log("=".repeat(60))
  console.log("Narrative AI — Sample Analysis Verification")
  console.log("=".repeat(60))

  const reports = []

  for (const sample of SAMPLES) {
    console.log(`\n▶ Analyzing: ${sample.title}`)
    const report = await runSample(sample)
    reports.push(report)

    console.log(`  Extraction: ${report.summary.extractionMode}`)
    console.log(
      `  Scenes: ${report.summary.scenes} | Events: ${report.summary.events} | Characters: ${report.summary.characters.length}`
    )
    console.log(`  Themes: ${report.summary.themes.join(", ") || "—"}`)
    console.log(`  Issues: ${report.summary.issueCount} (${report.summary.issueTypes.join(", ")})`)

    console.log("\n  Characters:")
    for (const c of report.summary.characters) {
      console.log(
        `    · ${c.name} (${c.role}) — ${c.snapshots} snapshots, arc: ${c.arcShape ?? "—"}, ego: ${c.hasEgoQuest ? "active" : "gated"}`
      )
    }

    console.log("\n  Verification checks:")
    for (const c of report.checks) {
      console.log(`    ${c.pass ? "PASS" : "FAIL"} ${c.name}: ${c.detail}`)
    }

    console.log("\n  Dramatic model variants:")
    for (const m of report.modelChecks) {
      console.log(
        `    ${m.pass ? "PASS" : "FAIL"} ${m.model}: ${m.detail} (${m.issueCount} tension mismatches)`
      )
    }

    console.log(`\n  Overall: ${report.passed && report.modelsPassed ? "PASS" : "FAIL"}`)
  }

  const outputPath = join(outputDir, "verification-report.json")
  writeFileSync(outputPath, JSON.stringify(reports, null, 2))
  console.log(`\nFull report written to: ${outputPath}`)

  const allPass = reports.every((r) => r.passed && r.modelsPassed)
  console.log("\n" + "=".repeat(60))
  console.log(allPass ? "ALL SAMPLES PASSED" : "SOME CHECKS FAILED")
  console.log("=".repeat(60))

  process.exit(allPass ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
