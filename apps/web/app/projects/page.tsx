"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TopBar } from "@/components/layout/marketing-shell"
import { SampleManuscriptCards } from "@/components/projects/sample-manuscript-cards"
import { db } from "@/lib/db"
import { isSampleProjectId } from "@/lib/sample-manuscripts"
import type { NarrativeWork } from "@narrative-ai/graph-schema"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<NarrativeWork[]>([])

  useEffect(() => {
    db.projects.orderBy("updatedAt").reverse().toArray().then(setProjects)
  }, [])

  const userProjects = projects.filter((p) => !isSampleProjectId(p.id))
  const sampleProjects = projects.filter((p) => isSampleProjectId(p.id))

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-7xl flex-1 px-4 pt-28 pb-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-bold">
              Projects
            </h1>
            <p className="mt-2 text-muted">Local manuscripts stored in your browser.</p>
          </div>
          <Link
            href="/projects/new"
            className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-[#0c0b0a] transition-colors duration-200 hover:opacity-90"
          >
            New project
          </Link>
        </div>

        <div className="mb-12">
          <SampleManuscriptCards />
        </div>

        {sampleProjects.length > 0 ? (
          <section className="mb-12" aria-labelledby="opened-samples-heading">
            <h2
              id="opened-samples-heading"
              className="mb-4 font-[family-name:var(--font-fraunces)] text-xl font-semibold"
            >
              Opened samples
            </h2>
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sampleProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}/structure`}
                    className="block cursor-pointer rounded-xl border border-[var(--accent-amber-dim)]/40 bg-elevated p-5 transition-colors duration-200 hover:border-accent hover:bg-overlay"
                  >
                    <p className="text-xs uppercase tracking-wide text-[var(--accent-amber)]">
                      Sample
                    </p>
                    <h3 className="mt-1 font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted">
                      {project.metadata.wordCount.toLocaleString()} words ·{" "}
                      {project.graph.syuzhet.nodes.length} scenes
                      {project.graph.fabula.nodes.length > 0
                        ? ` · ${project.graph.fabula.nodes.length} events`
                        : " · not analyzed"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="your-projects-heading">
          <h2
            id="your-projects-heading"
            className="mb-4 font-[family-name:var(--font-fraunces)] text-xl font-semibold"
          >
            Your projects
          </h2>

          {userProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-elevated p-12 text-center">
              <p className="text-muted">No custom projects yet.</p>
              <p className="mt-2 text-sm text-muted">
                Try a sample manuscript above, or upload your own.
              </p>
              <Link
                href="/projects/new"
                className="mt-4 inline-block cursor-pointer text-accent transition-colors duration-200 hover:underline"
              >
                Upload a manuscript
              </Link>
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}/structure`}
                    className="block cursor-pointer rounded-xl border border-border bg-elevated p-5 transition-colors duration-200 hover:border-border-strong hover:bg-overlay"
                  >
                    <h3 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted">
                      {project.metadata.wordCount.toLocaleString()} words ·{" "}
                      {project.graph.syuzhet.nodes.length} scenes
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
