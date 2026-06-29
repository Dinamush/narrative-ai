"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import { useNarrativeStore } from "@/stores/narrative-graph-store"

export const NewProjectForm = () => {
  const router = useRouter()
  const createFromText = useNarrativeStore((s) => s.createFromText)
  const [title, setTitle] = useState("")
  const [rawText, setRawText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !rawText.trim()) {
      setError("Title and manuscript text are required.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const work = await createFromText(title.trim(), rawText)
      router.push(`/projects/${work.id}/structure`)
    } catch {
      setError("Could not create project. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl space-y-6 rounded-xl border border-border bg-elevated p-8"
    >
      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium text-foreground">
          Project title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Working title"
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground outline-none transition-colors duration-200 focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <div>
        <label htmlFor="manuscript" className="mb-2 block text-sm font-medium text-foreground">
          Manuscript
        </label>
        <textarea
          id="manuscript"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={16}
          placeholder="Paste your story, chapter, or screenplay excerpt…"
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-foreground outline-none transition-colors duration-200 focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {error ? (
        <p className="text-sm text-[var(--semantic-critical)]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-[#0c0b0a] transition-colors duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "Segmenting…" : "Segment & open structure map"}
      </button>
    </form>
  )
}
