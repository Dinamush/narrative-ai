"use client"

import { useEffect, useRef } from "react"
import cytoscape from "cytoscape"
import type { CharacterGraph, CharacterNode } from "@narrative-ai/graph-schema"

type CharacterNetworkProps = {
  graph: CharacterGraph
  selectedId: string | null
  onSelect: (characterId: string) => void
}

const ROLE_COLORS: Record<string, string> = {
  protagonist: "#d4a054",
  antagonist: "#c45c4a",
  deuteragonist: "#5ba4a4",
  supporting: "#a89f94",
  minor: "#6b635a",
}

const RELATION_COLORS: Record<string, string> = {
  conflict: "#c45c4a",
  cooperative: "#6b9e6b",
  emotional: "#5ba4a4",
  hidden: "#6b635a",
}

export const CharacterNetwork = ({
  graph,
  selectedId,
  onSelect,
}: CharacterNetworkProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)

  useEffect(() => {
    if (!containerRef.current || graph.nodes.length === 0) return

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...graph.nodes.map((node) => ({
          data: {
            id: node.id,
            label: node.name,
            role: node.role ?? "supporting",
            color: ROLE_COLORS[node.role ?? "supporting"] ?? ROLE_COLORS.supporting,
            size: 28 + Math.min(node.stateSnapshots.length * 4, 24),
          },
        })),
        ...graph.edges.map((edge) => ({
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            relation: edge.relation,
            weight: edge.weight,
            color: RELATION_COLORS[edge.relation] ?? RELATION_COLORS.emotional,
          },
        })),
      ],
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "font-size": 11,
            color: "#f5f0e8",
            "text-outline-color": "#0c0b0a",
            "text-outline-width": 2,
            width: "data(size)",
            height: "data(size)",
            "background-color": "data(color)",
            "border-width": 2,
            "border-color": "#262220",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-color": "#d4a054",
            "border-width": 3,
          },
        },
        {
          selector: "edge",
          style: {
            width: "mapData(weight, 1, 5, 1, 4)",
            "line-color": "data(color)",
            opacity: 0.75,
            "curve-style": "bezier",
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        padding: 40,
      },
      minZoom: 0.4,
      maxZoom: 2.5,
    })

    cy.on("tap", "node", (event) => {
      const id = event.target.id()
      onSelect(id)
    })

    cyRef.current = cy

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [graph, onSelect])

  useEffect(() => {
    if (!cyRef.current || !selectedId) return
    cyRef.current.nodes().unselect()
    const node = cyRef.current.getElementById(selectedId)
    if (node.nonempty()) {
      node.select()
      cyRef.current.animate({
        center: { eles: node },
        zoom: 1.2,
      }, { duration: 200 })
    }
  }, [selectedId])

  if (graph.nodes.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted">
        No characters detected. Run analysis to populate the network.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full rounded-xl border border-border bg-surface"
      role="img"
      aria-label="Character relationship network"
    />
  )
}

export const getNodeById = (
  graph: CharacterGraph,
  id: string
): CharacterNode | undefined => graph.nodes.find((n) => n.id === id)
