"use client"

import { create } from "zustand"
import type { NarrativeWork } from "@narrative-ai/graph-schema"
import { createEmptyNarrativeWork } from "@narrative-ai/graph-schema"
import { applySegmentation } from "@/lib/segment-work"
import { db } from "@/lib/db"
import { generateId } from "@/lib/utils"

type NarrativeGraphStore = {
  work: NarrativeWork | null
  isLoading: boolean
  setWork: (work: NarrativeWork) => void
  loadWork: (id: string) => Promise<void>
  createFromText: (title: string, rawText: string) => Promise<NarrativeWork>
  saveWork: () => Promise<void>
}

export const useNarrativeStore = create<NarrativeGraphStore>((set, get) => ({
  work: null,
  isLoading: false,

  setWork: (work) => set({ work }),

  loadWork: async (id) => {
    set({ isLoading: true })
    const work = await db.projects.get(id)
    set({ work: work ?? null, isLoading: false })
  },

  createFromText: async (title, rawText) => {
    const id = generateId()
    const work = createEmptyNarrativeWork({ id, title, rawText })
    applySegmentation(work, rawText)

    await db.projects.put(work)
    set({ work })
    return work
  },

  saveWork: async () => {
    const { work } = get()
    if (!work) return
    work.updatedAt = new Date().toISOString()
    await db.projects.put(work)
    set({ work: { ...work } })
  },
}))
