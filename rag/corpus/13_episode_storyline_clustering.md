# Episode and Storyline Clustering — RAG Knowledge Base

Domain: plot
Source: Narrative Maps (CSCW 2020), NKW
Use for: macro-arc structure, episode summaries for RAG
Pair with: 02_fabula_syuzhet_principles.md

## Overview

**Episodes** cluster 3–10 related scenes sharing motif/conflict/outcome. **Storylines** are DAGs of episodes for multi-thread narratives.

## Episode clustering heuristics

- Shared participant set (≥2 major characters overlap)
- Contiguous or near-contiguous syuzhetIndex range
- Shared theme tag or causal chain within fabula subgraph
- LLM summary: motif, conflict, outcome fields on Episode node

## Multi-storyline detection (Narrative Maps)

On fabula DAG: maximum antichains identify parallel threads. Weight edges by coherence. Each thread → Storyline with sourceEventId and sinkEventId.

## RAG episode_summary chunks

Index episode summaries as work-scoped chunks for macro-arc QA ("What happens in the B-story?").

**Evidence tag:** RESEARCH

## References
- packages/graph-schema/src/timeline.ts (EpisodeSchema, StorylineSchema)
