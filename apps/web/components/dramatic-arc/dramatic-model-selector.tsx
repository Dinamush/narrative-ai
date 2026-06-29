"use client"

import type { DramaticModel } from "@narrative-ai/graph-schema"

const MODEL_LABELS: Record<DramaticModel, string> = {
  freytag: "Freytag's Pyramid",
  three_act: "Three-Act Structure",
  heros_journey: "Hero's Journey",
  save_the_cat: "Save the Cat",
  fichtean: "Fichtean Curve",
}

type DramaticModelSelectorProps = {
  value: DramaticModel
  onChange: (model: DramaticModel) => void
  disabled?: boolean
}

export const DramaticModelSelector = ({
  value,
  onChange,
  disabled = false,
}: DramaticModelSelectorProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as DramaticModel)
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="dramatic-model"
        className="text-xs uppercase tracking-wide text-muted"
      >
        Dramatic model
      </label>
      <select
        id="dramatic-model"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors duration-200 hover:border-border-strong focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Select dramatic structure model"
      >
        {(Object.keys(MODEL_LABELS) as DramaticModel[]).map((model) => (
          <option key={model} value={model}>
            {MODEL_LABELS[model]}
          </option>
        ))}
      </select>
    </div>
  )
}

export { MODEL_LABELS }
