# Plot Integrity Checks — RAG Knowledge Base

Domain: plot
Source: FlawedFictions, PLOTTER, ARCHITECTURE.md §7
Use for: constraint engine, plot critic, diagnostics
Pair with: 02_fabula_syuzhet_principles.md, 11_proposition_continuity.md

## Overview

Plot-hole detection uses **symbolic constraint checking first**, LLM critics second. Pure NLI over sentence pairs fails on long fiction — context and graph structure matter.

## Deterministic checks

| Check | Code | Issue type |
|-------|------|------------|
| K_C: Fabula is DAG | Tarjan / graphology isDirectedAcyclic | causal_break |
| K_N: Reachability | BFS inciting → resolution | unresolved_thread |
| State consistency | No contradictory propositions at same fabulaTime | continuity |
| Foreshadowing order | fabulaTime(source) < fabulaTime(target) | causal_break |
| Character edge support | supportingEventIds non-empty for major edges | causal_break |
| Tension fit | RMSE measured vs target curve | tension_mismatch |

## FlawedFictions taxonomy

| Type | Definition |
|------|------------|
| Continuity errors | Proposition φ inconsistent: F \ {φ} ⊢ ¬φ |
| Out-of-character | Action vs established goals/beliefs/affect |
| Impossible events | Violates story-world rules in stateDelta |
| Unresolved storylines | Open causal threads, sink nodes unreachable |
| Factual errors | Real-world anachronisms (optional KB check) |

**Evidence tag:** RESEARCH

## References
- packages/narrative-engine/src/constraint-engine.ts
