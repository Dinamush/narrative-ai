import { TopBar } from "@/components/layout/marketing-shell"
import { NewProjectForm } from "@/components/projects/new-project-form"
import { SampleManuscriptCards } from "@/components/projects/sample-manuscript-cards"

export default function NewProjectPage() {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-7xl flex-1 px-4 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-bold">
            New analysis
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            Start from a sample manuscript to explore the UI, or paste your own text to segment
            chapters and scenes.
          </p>
        </div>

        <div className="mb-10">
          <SampleManuscriptCards variant="compact" />
        </div>

        <div className="mb-6 border-t border-border pt-10">
          <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold">
            Upload your manuscript
          </h2>
          <p className="mt-2 text-sm text-muted">
            Paste text below — analysis runs after you open the structure map.
          </p>
        </div>

        <NewProjectForm />
      </main>
    </>
  )
}
