import Link from "next/link"
import { BookOpen, GitBranch, Sparkles } from "lucide-react"

export const TopBar = () => (
  <header className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl border border-border bg-elevated/90 px-4 py-3 backdrop-blur-sm">
    <div className="flex items-center justify-between gap-4">
      <Link
        href="/"
        className="flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-lg font-semibold text-foreground transition-colors duration-200 hover:text-accent cursor-pointer"
        aria-label="Narrative AI home"
      >
        <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
        Narrative AI
      </Link>
      <nav className="flex items-center gap-2">
        <Link
          href="/projects"
          className="rounded-lg px-3 py-2 text-sm text-muted transition-colors duration-200 hover:bg-overlay hover:text-foreground cursor-pointer"
        >
          Projects
        </Link>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-[#0c0b0a] transition-colors duration-200 hover:bg-accent-amber-dim cursor-pointer"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          New analysis
        </Link>
      </nav>
    </div>
  </header>
)

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof GitBranch
  title: string
  description: string
}) => (
  <article className="rounded-xl border border-border bg-elevated p-6 transition-colors duration-200 hover:border-border-strong hover:bg-overlay">
    <div className="mb-4 inline-flex rounded-lg bg-surface p-2">
      <Icon className="h-5 w-5 text-accent-teal" aria-hidden="true" />
    </div>
    <h3 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-foreground">
      {title}
    </h3>
    <p className="mt-2 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-muted">
      {description}
    </p>
  </article>
)
