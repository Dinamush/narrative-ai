"use client"

import type { NarrativeWork } from "@narrative-ai/graph-schema"
import { segmentManuscript } from "@narrative-ai/narrative-engine"

export const applySegmentation = (work: NarrativeWork, rawText: string): NarrativeWork => {
  const { chapters, scenes } = segmentManuscript(rawText)

  work.rawText = rawText
  work.graph.syuzhet.nodes = scenes.map((s) => s.scene)
  work.graph.syuzhet.edges = scenes.slice(1).map((s, index) => ({
    id: `syz-edge-${index}`,
    source: scenes[index].scene.id,
    target: s.scene.id,
    type: "next" as const,
  }))

  work.graph.timeline.chapters = chapters
  work.graph.timeline.segments = scenes.map((s) => ({
    sceneId: s.scene.id,
    position: {
      chapterId: s.chapterId,
      chapterIndex: s.chapterIndex,
      sceneId: s.scene.id,
      syuzhetIndex: s.scene.syuzhetIndex,
      fabulaTime: s.scene.syuzhetIndex,
      narrativeProgress:
        scenes.length <= 1 ? 0 : s.scene.syuzhetIndex / (scenes.length - 1),
    },
    participantIds: [],
    summary: s.text.slice(0, 160) + (s.text.length > 160 ? "…" : ""),
  }))

  work.metadata.wordCount = rawText.trim()
    ? rawText.trim().split(/\s+/).length
    : 0
  work.updatedAt = new Date().toISOString()

  return work
}

export const isWorkAnalyzed = (work: NarrativeWork) =>
  work.graph.fabula.nodes.length > 0

export const analyzeWorkViaApi = async (
  work: NarrativeWork,
  onEvent?: (event: unknown) => void
): Promise<NarrativeWork> => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ work }),
  })

  if (!response.ok) {
    throw new Error("Failed to start analysis")
  }

  const { jobId } = (await response.json()) as { jobId: string }

  return new Promise((resolve, reject) => {
    let finished = false
    const source = new EventSource(`/api/analyze/${jobId}/stream`)

    const finish = (result: NarrativeWork) => {
      if (finished) return
      finished = true
      source.close()
      resolve(result)
    }

    const fail = (error: Error) => {
      if (finished) return
      finished = true
      source.close()
      reject(error)
    }

    source.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data) as {
          status?: string
          result?: NarrativeWork
          error?: string
          phase?: string
        }

        if (data.phase) onEvent?.(data)

        if (data.status === "completed" && data.result) {
          finish(data.result)
          return
        }

        if (data.status === "failed") {
          fail(new Error(data.error ?? "Analysis failed"))
        }
      } catch {
        // ignore malformed events
      }
    }

    source.onerror = () => {
      if (finished) return
      fail(new Error("Analysis stream disconnected"))
    }
  })
}
