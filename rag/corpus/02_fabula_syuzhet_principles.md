# Fabula and Syuzhet Principles — RAG Knowledge Base

Domain: plot
Source: Russian Formalism, Chatman, PLOTTER, ARCHITECTURE.md §4
Use for: event extraction, causal linking, syuzhet projection
Pair with: 03_dramatic_structure_beats.md, 04_plot_integrity_checks.md

## Overview

**Fabula** is the chronological/causal sequence of events (ground truth). **Syuzhet** is the artistic presentation order (how the reader encounters scenes). They are separate coupled graphs linked by a reference map.

## Rules

### Rule: Fabula is a DAG
**Constraint K_C:** The causal subgraph must be acyclic. Cycles indicate flashback annotation needed or extraction error.
**Edge types:** causal, temporal, enables, requires, foreshadowing, suspense
**Evidence tag:** THEORY

### Rule: Kernel vs satellite (Chatman)
**Kernel:** Event whose removal breaks plot logic — must remain reachable from inciting incident to resolution.
**Satellite:** Embellishment removable without breaking causal chain — may be dimmed in UI.
**Evidence tag:** THEORY

### Rule: Foreshadowing order
**Constraint:** For foreshadowing edge (A → B), fabulaTime(A) < fabulaTime(B). Presentation may show B before A via flashback.
**Evidence tag:** HEURISTIC

### Rule: Syuzhet projection
**Default:** Topological sort of fabula by fabulaTime = default syuzhet order.
**Discourse ops:** flashback, flashforward, ellipsis, pause — annotate when syuzhetIndex order ≠ fabulaTime order.
**Evidence tag:** THEORY

### Rule: Evidence spans required
Every EventNode must include evidenceSpan linking to source text. LLM must not invent events without textual grounding.
**Evidence tag:** HEURISTIC

## References
- packages/graph-schema/src/fabula.ts
- packages/graph-schema/src/syuzhet.ts
