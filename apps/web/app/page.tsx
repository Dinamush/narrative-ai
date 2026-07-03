import Link from "next/link"
import { GitBranch, LineChart, Users, AlertTriangle } from "lucide-react"
import { TopBar, FeatureCard } from "@/components/layout/marketing-shell"

export default function HomePage() {
  return (
    <>
      <TopBar />
      <main className="flex-1 pt-28 pb-16">
        <section className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent-teal)]">
              Scriptorium · Narrative Intelligence
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl font-bold leading-tight text-foreground md:text-6xl">
              Map the invisible structure of your story
            </h1>
            <p className="mt-6 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-muted">
              Fabula and syuzhet graphs, character state timelines, EgoQuest depth,
              dramatic arcs, and plot integrity — grounded in evidence, not guesswork.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/projects/new"
                className="cursor-pointer rounded-lg bg-accent px-6 py-3 text-sm font-medium text-[#0c0b0a] transition-colors duration-200 hover:opacity-90"
              >
                Start analysis
              </Link>
              <Link
                href="/projects"
                className="cursor-pointer rounded-lg border border-border px-6 py-3 text-sm text-foreground transition-colors duration-200 hover:bg-elevated"
              >
                View projects
              </Link>
            </div>
            <p className="mt-6 text-center text-sm text-muted">
              <a
                href="https://github.com/Dinamush/narrative-ai"
                className="underline-offset-2 hover:text-foreground hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open source on GitHub
              </a>
              {" · "}
              MIT License
            </p>
          </div>

          <div className="mt-20 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              icon={GitBranch}
              title="Structure"
              description="Dual-layer fabula DAG and syuzhet presentation graph with causal, foreshadowing, and discourse edges."
            />
            <FeatureCard
              icon={Users}
              title="Characters"
              description="Per-scene state snapshots, EgoQuest psychodynamic arcs, and relationship networks across chapters."
            />
            <FeatureCard
              icon={LineChart}
              title="Dramatic arc"
              description="Freytag and three-act tension curves with measured vs target beats and turning-point detection."
            />
            <FeatureCard
              icon={AlertTriangle}
              title="Diagnostics"
              description="Plot-hole taxonomy, OOC detection, continuity checks, and RAG-grounded critics."
            />
          </div>
        </section>
      </main>
    </>
  )
}
