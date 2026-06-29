import { NextResponse } from "next/server"
import { runAnalysisPipeline } from "@narrative-ai/narrative-engine"
import { NarrativeWorkSchema } from "@narrative-ai/graph-schema"
import {
  cleanupJob,
  completeAnalysisJob,
  createAnalysisJob,
  publishJobEvent,
} from "@/lib/analysis-jobs"
import { generateId } from "@/lib/utils"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = NarrativeWorkSchema.safeParse(body.work)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid narrative work payload", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const jobId = generateId()
    createAnalysisJob(jobId)

    void (async () => {
      try {
        publishJobEvent(jobId, {
          jobId,
          status: "running",
          phase: "ingestion",
          progress: 0,
          message: "Analysis started",
        })

        const result = await runAnalysisPipeline(parsed.data, jobId, (event) => {
          publishJobEvent(jobId, event)
        })

        completeAnalysisJob(jobId, result.work)

        publishJobEvent(jobId, {
          jobId,
          status: "completed",
          phase: "validation",
          progress: 100,
          message: `Analysis complete (${result.work.graph.fabula.nodes.length} events, ${result.extractionMode} mode)`,
        })

        cleanupJob(jobId)
      } catch (error) {
        publishJobEvent(jobId, {
          jobId,
          status: "failed",
          phase: "validation",
          progress: 0,
          message: "Analysis failed",
          error: error instanceof Error ? error.message : "Unknown error",
        })
        cleanupJob(jobId)
      }
    })()

    return NextResponse.json({ jobId })
  } catch {
    return NextResponse.json({ error: "Failed to start analysis" }, { status: 500 })
  }
}
