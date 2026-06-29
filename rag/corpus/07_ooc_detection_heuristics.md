# OOC Detection Heuristics — RAG Knowledge Base

Domain: character
Source: FlawedFictions, ARCHITECTURE.md §16.8
Use for: character critic, diagnostics
Pair with: 05_character_state_extraction.md, 01_fiction_attribution_rules.md

## Overview

Out-of-character (OOC) detection compares actions at time τ against **CharacterStateSnapshot at τ−1** plus fabula events — not static character labels.

## Checks

| Check | Logic | Issue severity |
|-------|-------|----------------|
| Goal contradiction | Action contradicts active goals without intervening goalChanges | major |
| Belief violation | Action requires knowledge not in knowledge[] at τ | major |
| Affect mismatch | Extreme action with flat affect and no shadow spike | minor |
| EgoQuest regression | shadow.intensity spike without fabula crisis event | suggestion |
| Relationship jump | New CharacterEdge without supportingEventIds | causal_break |
| Unmotivated belief revision | believes_about supersedes prior without event or evidence | major |

## Mask vs shadow vs driver

- **Social mask:** chosen public performance — OOC if action matches mask but contradicts driver (not necessarily error)
- **Shadow:** stress regression — spike at crisis beats is expected, not OOC
- **Driver:** core motivation — sustained action against driver without arc setup → OOC flag

Character critic inputs: current event + snapshot τ−1 + RAG attributed dialogue + this document.

**Evidence tag:** HEURISTIC

## References
- packages/graph-schema/src/analysis-result.ts (PlotIssueTypeSchema ooc_behavior)
