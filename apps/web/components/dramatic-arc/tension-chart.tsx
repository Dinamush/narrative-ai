"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
} from "recharts"
import type { NarrativeWork } from "@narrative-ai/graph-schema"

type TensionChartProps = {
  work: NarrativeWork
}

type ChartPoint = {
  index: number
  label: string
  sceneId: string
  target: number
  measured: number
  isClimax: boolean
  isTurningPoint: boolean
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartPoint }>
}) => {
  if (!active || !payload?.[0]) return null
  const point = payload[0].payload

  return (
    <div className="rounded-lg border border-border bg-elevated px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{point.label}</p>
      <p className="mt-1 text-muted">
        Target: {(point.target * 100).toFixed(0)}%
      </p>
      <p className="text-muted">
        Measured: {(point.measured * 100).toFixed(0)}%
      </p>
      {point.isClimax ? (
        <p className="mt-1 text-[var(--semantic-climax)]">Climax scene</p>
      ) : null}
      {point.isTurningPoint ? (
        <p className="text-[var(--accent-teal)]">Turning point</p>
      ) : null}
    </div>
  )
}

export const TensionChart = ({ work }: TensionChartProps) => {
  const { dramaticArc } = work.analysis
  const climaxId = dramaticArc.climaxSceneId
  const turningSet = new Set(dramaticArc.turningPoints)

  const data: ChartPoint[] = dramaticArc.tensionSeries.map((point, index) => {
    const segment = work.graph.timeline.segments.find(
      (s) => s.sceneId === point.sceneId
    )
    const chapter = segment?.position.chapterIndex ?? 0
    const sceneNum = (segment?.position.syuzhetIndex ?? index) + 1

    return {
      index,
      label: `Ch.${chapter} Sc.${sceneNum}`,
      sceneId: point.sceneId,
      target: point.target,
      measured: point.measured,
      isClimax: point.sceneId === climaxId,
      isTurningPoint: turningSet.has(point.sceneId),
    }
  })

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted">
        Run analysis to generate tension data
      </div>
    )
  }

  return (
    <div className="h-72 w-full" aria-label="Tension timeline chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
            interval="preserveStartEnd"
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Model target"
            stroke="var(--accent-teal-dim)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="measured"
            name="Measured tension"
            stroke="var(--accent-amber)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--accent-amber)" }}
            activeDot={{ r: 5 }}
          />
          {data
            .filter((d) => d.isClimax)
            .map((d) => (
              <ReferenceDot
                key={`climax-${d.sceneId}`}
                x={d.label}
                y={d.measured}
                r={6}
                fill="var(--semantic-climax)"
                stroke="var(--bg-base)"
                strokeWidth={2}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
