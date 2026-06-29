import type { EventEdge, EventNode } from "@narrative-ai/graph-schema"

export const linkCausalEdges = (events: EventNode[]): EventEdge[] => {
  const sorted = [...events].sort((a, b) => a.fabulaTime - b.fabulaTime)
  const edges: EventEdge[] = []

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    edges.push({
      id: `edge-causal-${prev.id}-${curr.id}`,
      source: prev.id,
      target: curr.id,
      relation: "causal",
      weight: 1,
    })
  }

  return edges
}

export const linkSceneBridges = (
  priorLastEventId: string | null,
  sceneFirstEventId: string | null
): EventEdge | null => {
  if (!priorLastEventId || !sceneFirstEventId) return null
  if (priorLastEventId === sceneFirstEventId) return null

  return {
    id: `edge-bridge-${priorLastEventId}-${sceneFirstEventId}`,
    source: priorLastEventId,
    target: sceneFirstEventId,
    relation: "temporal",
    weight: 0.8,
  }
}
