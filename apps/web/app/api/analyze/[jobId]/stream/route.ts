import {
  getAnalysisJob,
  subscribeToJob,
} from "@/lib/analysis-jobs"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params
  const job = getAnalysisJob(jobId)

  if (!job) {
    return new Response("Job not found", { status: 404 })
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const closeStream = () => {
        clearInterval(keepAlive)
        controller.close()
      }

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"))
      }, 15000)

      send({ jobId, status: job.status, connected: true })

      const lastEvent = job.events[job.events.length - 1]

      if (job.status === "completed" && job.result && lastEvent) {
        send({ ...lastEvent, result: job.result })
        closeStream()
        return
      }

      if (job.status === "failed" && lastEvent) {
        send(lastEvent)
        closeStream()
        return
      }

      let unsubscribe: (() => void) | undefined

      unsubscribe = subscribeToJob(jobId, (event) => {
        if (event.status === "completed" || event.status === "failed") {
          const current = getAnalysisJob(jobId)
          send({ ...event, result: current?.result })
          unsubscribe?.()
          closeStream()
          return
        }
        send(event)
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
