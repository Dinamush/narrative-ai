import Dexie, { type Table } from "dexie"
import type { NarrativeWork } from "@narrative-ai/graph-schema"

export class NarrativeDatabase extends Dexie {
  projects!: Table<NarrativeWork, string>

  constructor() {
    super("narrative-ai")
    this.version(1).stores({
      projects: "id, title, updatedAt",
    })
  }
}

export const db = new NarrativeDatabase()
