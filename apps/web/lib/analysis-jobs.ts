import type { AnalysisProgressEvent } from "@narrative-ai/narrative-engine"
import type { NarrativeWork } from "@narrative-ai/graph-schema"

export type AnalysisJob = {
  id: string
  status: AnalysisProgressEvent["status"]
  events: AnalysisProgressEvent[]
  result?: NarrativeWork
  error?: string
  subscribers: Set<(event: AnalysisProgressEvent) => void>
}

const jobs = new Map<string, AnalysisJob>()

export const createAnalysisJob = (jobId: string): AnalysisJob => {
  const job: AnalysisJob = {
    id: jobId,
    status: "queued",
    events: [],
    subscribers: new Set(),
  }
  jobs.set(jobId, job)
  return job
}

export const getAnalysisJob = (jobId: string) => jobs.get(jobId)

export const publishJobEvent = (jobId: string, event: AnalysisProgressEvent) => {
  const job = jobs.get(jobId)
  if (!job) return
  job.status = event.status
  job.events.push(event)
  if (event.error) job.error = event.error
  for (const subscriber of job.subscribers) {
    subscriber(event)
  }
}

export const completeAnalysisJob = (jobId: string, work: NarrativeWork) => {
  const job = jobs.get(jobId)
  if (!job) return
  job.result = work
}

export const subscribeToJob = (
  jobId: string,
  callback: (event: AnalysisProgressEvent) => void
) => {
  const job = jobs.get(jobId)
  if (!job) return () => {}

  job.subscribers.add(callback)

  queueMicrotask(() => {
    if (!job.subscribers.has(callback)) return
    for (const event of job.events) {
      callback(event)
    }
  })

  return () => job.subscribers.delete(callback)
}

export const cleanupJob = (jobId: string) => {
  setTimeout(() => jobs.delete(jobId), 1000 * 60 * 10)
}
