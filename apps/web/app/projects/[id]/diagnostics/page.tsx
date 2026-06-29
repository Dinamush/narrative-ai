"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect } from "react"
import { useNarrativeStore } from "@/stores/narrative-graph-store"

export default function DiagnosticsPage() {
  const params = useParams<{ id: string }>()
  const work = useNarrativeStore((s) => s.work)
  const loadWork = useNarrativeStore((s) => s.loadWork)

  useEffect(() => {
    if (params.id) loadWork(params.id)
  }, [params.id, loadWork])

  if (!work) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading…
      </div>
    )
  }

  const issues = work.analysis.plotIssues

  return (
    <div className="min-h-screen bg-background px-4 py-28">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/projects/${work.id}/structure`}
          className="cursor-pointer text-sm text-accent transition-colors duration-200 hover:underline"
        >
          ← Back to structure map
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-3xl font-bold">
          Diagnostics
        </h1>
        <p className="mt-2 text-muted">
          {issues.length} plot issue{issues.length === 1 ? "" : "s"} from fabula validation
        </p>

        {issues.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border bg-elevated p-8 text-center text-muted">
            No issues detected. Run &quot;Analyze structure&quot; on the structure map first.
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {issues.map((issue) => (
              <li
                key={issue.id}
                className="rounded-xl border border-border bg-elevated p-5"
              >
                <p className="text-xs uppercase tracking-wide text-[var(--semantic-warning)]">
                  {issue.severity} · {issue.type}
                </p>
                <p className="mt-2 text-sm text-foreground">{issue.message}</p>
                {issue.suggestedFix ? (
                  <p className="mt-2 text-sm text-muted">{issue.suggestedFix}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
