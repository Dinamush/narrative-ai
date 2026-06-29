# Analysis Pipeline and Confidence — RAG Knowledge Base

Domain: general
Source: ARCHITECTURE.md §5, psyche-converse-1 corpus 05
Use for: job orchestration, confidence gating, UI reveal rules
Pair with: all domain corpora

## Overview

Analysis runs as sequential phases with SSE progress streaming. Gate low-confidence fields before UI display.

## Phases (in order)

1. ingestion — parse, segment chapters/scenes
2. fabula — event extraction, causal DAG
3. syuzhet — presentation graph, reference map
4. style — register, theme, wavelength, tension
5. character_states — CHIRON + EvolvTrip + attribute deltas
6. egoquest — psychodynamic scoring per attributed character
7. arc_aggregation — smooth curves, arc shape, turning points
8. rag_indexing — embed work-scoped chunks
9. validation — symbolic constraint engine
10. critics — RAG-augmented plot/character/theme critics

## Confidence gating

| Output | Gate condition |
|--------|----------------|
| EgoQuest wound/mask | activationStrength ≥ 0.12 + evidence spans |
| Mental state triple | evidenceSpan required; uncertain polarity if weak |
| Theme tag | confidence ≥ 0.5 from retelling cluster |
| Plot issue (LLM) | severity assigned; critical requires deterministic or dual critic agreement |

Replace psyche-converse message-count tiers with **per-scene attribution thresholds** for fiction.

**Evidence tag:** HEURISTIC

## References
- packages/graph-schema/src/narrative-graph.ts
