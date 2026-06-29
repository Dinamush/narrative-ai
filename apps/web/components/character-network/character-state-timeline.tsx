"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { CharacterNode } from "@narrative-ai/graph-schema"

type CharacterStateTimelineProps = {
  character: CharacterNode | null
}

export const CharacterStateTimeline = ({ character }: CharacterStateTimelineProps) => {
  if (!character?.arcTrajectory) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted">
        {character ? "No arc trajectory data yet." : "Select a character to view arc trajectory."}
      </div>
    )
  }

  const { arcTrajectory } = character
  const data = arcTrajectory.sceneIds.map((sceneId, index) => ({
    label: `Sc.${index + 1}`,
    sceneId,
    differentiation: arcTrajectory.differentiation[index] ?? 0,
    shadow: arcTrajectory.shadowIntensity[index] ?? 0,
    circumstance: arcTrajectory.circumstanceActor[index] ?? 0,
  }))

  return (
    <div className="h-52 w-full" aria-label={`${character.name} arc trajectory`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }} />
          <Line
            type="monotone"
            dataKey="differentiation"
            name="Differentiation"
            stroke="var(--accent-teal)"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="shadow"
            name="Shadow"
            stroke="var(--semantic-climax)"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="circumstance"
            name="Circumstance"
            stroke="var(--accent-amber)"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
