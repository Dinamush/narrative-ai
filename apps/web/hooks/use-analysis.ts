"use client"

import { useCallback, useState } from "react"
import type { NarrativeWork } from "@narrative-ai/graph-schema"
import type { AnalysisProgressEvent } from "@narrative-ai/narrative-engine"
import { analyzeWorkViaApi } from "@/lib/segment-work"
import { useNarrativeStore } from "@/stores/narrative-graph-store"

export const useAnalysis = () => {
  const setWork = useNarrativeStore((s) => s.setWork)
  const saveWork = useNarrativeStore((s) => s.saveWork)
  const [events, setEvents] = useState<AnalysisProgressEvent[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const runAnalysis = useCallback(
    async (work: NarrativeWork) => {
      setIsAnalyzing(true)
      setEvents([])

      try {
        const result = await analyzeWorkViaApi(work, (event) => {
          setEvents((prev) => [...prev, event as AnalysisProgressEvent])
        })
        setWork(result)
        await saveWork()
        return result
      } finally {
        setIsAnalyzing(false)
      }
    },
    [setWork, saveWork]
  )

  return { runAnalysis, events, isAnalyzing }
}
