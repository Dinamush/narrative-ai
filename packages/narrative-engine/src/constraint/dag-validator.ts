import type { EventEdge, EventNode, PlotIssue } from "@narrative-ai/graph-schema"

export type DagValidationResult = {
  isAcyclic: boolean
  issues: PlotIssue[]
  cycleEdgeIds: string[]
}

const CAUSAL_RELATIONS = new Set(["causal", "enables", "requires"])

const wouldCreateCycle = (
  adjacency: Map<string, string[]>,
  source: string,
  target: string
) => {
  const visited = new Set<string>()
  const stack = [target]

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) continue
    if (node === source) return true
    if (visited.has(node)) continue
    visited.add(node)
    for (const next of adjacency.get(node) ?? []) {
      stack.push(next)
    }
  }

  return false
}

export const validateFabulaDag = (
  nodes: EventNode[],
  edges: EventEdge[]
): DagValidationResult => {
  const adjacency = new Map<string, string[]>()
  const issues: PlotIssue[] = []
  const cycleEdgeIds: string[] = []

  for (const edge of edges) {
    if (!CAUSAL_RELATIONS.has(edge.relation)) continue
    if (wouldCreateCycle(adjacency, edge.source, edge.target)) {
      cycleEdgeIds.push(edge.id)
      issues.push({
        id: `issue-dag-${edge.id}`,
        type: "causal_break",
        severity: "critical",
        affectedNodeIds: [edge.source, edge.target],
        textSpans: [],
        message: `Causal edge creates a cycle: ${edge.source} → ${edge.target}`,
        suggestedFix: "Remove edge or annotate as flashback/discourse reordering",
      })
      continue
    }

    const list = adjacency.get(edge.source) ?? []
    list.push(edge.target)
    adjacency.set(edge.source, list)
  }

  for (const edge of edges) {
    if (edge.relation !== "foreshadowing") continue
    const source = nodes.find((n) => n.id === edge.source)
    const target = nodes.find((n) => n.id === edge.target)
    if (!source || !target) continue
    if (source.fabulaTime >= target.fabulaTime) {
      issues.push({
        id: `issue-foreshadow-${edge.id}`,
        type: "causal_break",
        severity: "major",
        affectedNodeIds: [edge.source, edge.target],
        textSpans: [source.evidenceSpan, target.evidenceSpan],
        message: "Foreshadowing source must precede target in fabula time",
      })
    }
  }

  return {
    isAcyclic: cycleEdgeIds.length === 0,
    issues,
    cycleEdgeIds,
  }
}
