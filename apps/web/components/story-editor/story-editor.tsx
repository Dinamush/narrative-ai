"use client"

import { useCallback, useEffect, useMemo } from "react"
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Node,
  type Edge,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import type { NarrativeWork } from "@narrative-ai/graph-schema"

type StoryEditorProps = {
  work: NarrativeWork
  showFabula?: boolean
}

const SceneNode = ({
  data,
}: {
  data: {
    label: string
    summary?: string
    eventCount?: number
  }
}) => (
  <div className="min-w-[200px] max-w-[260px] rounded-lg border border-[var(--accent-teal-dim)] bg-[var(--bg-elevated)] p-3 shadow-lg">
    <p className="text-xs uppercase tracking-wide text-[var(--accent-teal)]">Scene</p>
    <p className="mt-1 font-medium text-[var(--text-primary)]">{data.label}</p>
    {typeof data.eventCount === "number" ? (
      <p className="mt-1 text-xs text-[var(--accent-amber)]">
        {data.eventCount} fabula event{data.eventCount === 1 ? "" : "s"}
      </p>
    ) : null}
    {data.summary ? (
      <p className="mt-2 line-clamp-3 font-[family-name:var(--font-source-serif)] text-xs text-[var(--text-secondary)]">
        {data.summary}
      </p>
    ) : null}
  </div>
)

const EventNode = ({
  data,
}: {
  data: { label: string; kernelLevel?: string }
}) => (
  <div className="max-w-[220px] rounded-lg border border-[var(--accent-amber-dim)] bg-[var(--bg-surface)] p-2 shadow">
    <p className="text-[10px] uppercase tracking-wide text-[var(--accent-amber)]">
      {data.kernelLevel ?? "event"}
    </p>
    <p className="mt-1 text-xs text-[var(--text-primary)] line-clamp-4">{data.label}</p>
  </div>
)

const nodeTypes = { scene: SceneNode, event: EventNode }

export const StoryEditor = ({ work, showFabula = true }: StoryEditorProps) => {
  const graphKey = `${work.id}-${work.graph.fabula.nodes.length}-${work.updatedAt}`

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    work.graph.syuzhet.nodes.forEach((scene, index) => {
      const segment = work.graph.timeline.segments.find((s) => s.sceneId === scene.id)
      const sceneY = 40 + (index % 2) * 140

      nodes.push({
        id: scene.id,
        type: "scene",
        position: { x: index * 300, y: sceneY },
        data: {
          label: `Scene ${scene.syuzhetIndex + 1}`,
          summary: segment?.summary,
          eventCount: scene.eventIds.length,
        },
      })

      if (showFabula && scene.eventIds.length > 0) {
        scene.eventIds.forEach((eventId, eventIndex) => {
          const event = work.graph.fabula.nodes.find((e) => e.id === eventId)
          if (!event) return
          const eventNodeId = `fabula-${eventId}`
          nodes.push({
            id: eventNodeId,
            type: "event",
            position: { x: index * 300 + eventIndex * 12, y: sceneY + 120 + eventIndex * 70 },
            data: {
              label: event.label,
              kernelLevel: event.kernelLevel,
            },
          })
          edges.push({
            id: `ref-${scene.id}-${eventId}`,
            source: scene.id,
            target: eventNodeId,
            style: { stroke: "var(--accent-amber)", strokeDasharray: "4 4" },
          })
        })
      }
    })

    work.graph.syuzhet.edges.forEach((edge) => {
      edges.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: true,
        style: { stroke: "var(--accent-teal)" },
      })
    })

    work.graph.fabula.edges.forEach((edge) => {
      if (!showFabula) return
      const sourceFabula = `fabula-${edge.source}`
      const targetFabula = `fabula-${edge.target}`
      if (nodes.some((n) => n.id === sourceFabula) && nodes.some((n) => n.id === targetFabula)) {
        edges.push({
          id: `fabula-${edge.id}`,
          source: sourceFabula,
          target: targetFabula,
          style: { stroke: "var(--accent-amber)" },
        })
      }
    })

    return { initialNodes: nodes, initialEdges: edges }
  }, [work, showFabula])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [graphKey, initialNodes, initialEdges, setNodes, setEdges])

  const handleConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "var(--accent-amber)" },
          },
          eds
        )
      ),
    [setEdges]
  )

  return (
    <div className="h-[560px] w-full overflow-hidden rounded-xl border border-border bg-surface">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border-subtle)" gap={20} />
        <MiniMap
          nodeColor="var(--accent-teal-dim)"
          maskColor="rgba(12, 11, 10, 0.75)"
        />
        <Controls />
      </ReactFlow>
    </div>
  )
}
