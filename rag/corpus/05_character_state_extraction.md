# Character State Extraction — RAG Knowledge Base

Domain: character
Source: CHIRON (EMNLP 2024), EvolvTrip, OpenPI 2.0, ARCHITECTURE.md §4.6
Use for: CharacterStateSnapshot extraction per scene
Pair with: 01_fiction_attribution_rules.md, 06_character_arc_methods.md

## Overview

Extract **CharacterStateSnapshot** per major character per scene. Never collapse time-indexed states into a static character biography.

## CHIRON character-sheet fields

| Category | Extract | Require evidenceSpan |
|----------|---------|---------------------|
| dialogue | Speech patterns, register in voice | Yes |
| physical | Appearance, injury, location, embodied state | Yes |
| knowledge | Facts character knows at this narrative moment | Yes |
| goals | Active motivations; gained/completed/abandoned | Yes |

Validation: entailmentScore optional; polarity affirmed | negated | uncertain.

## EvolvTrip mental-state triples

| Predicate | Object type | Example |
|-----------|-------------|---------|
| believes_about | proposition, character, event | X believes_about "Y is guilty" |
| desires_for | entity, outcome | X desires_for "escape the city" |
| feels_towards | character, event | X feels_towards Y: resentment |
| intends_to | action | X intends_to "confront the council" |

Each triple: perspective (whose knowledge bounds inference), optional supersedes (prior triple ID), plot_index via NarrativePosition.

## OpenPI attribute deltas

Format: `(entity, attribute, valueBefore?, valueAfter)` — track physical and world-state changes (location, injury, possession, status).

## Cross-chapter continuity

When processing scene S for character X:
1. Load prior snapshot (latest with earlier narrativeProgress)
2. Pass prior summary in graph context + RAG retrieve top-3 prior state snapshots
3. Compute deltaFromPrior: beliefRevisions, goalChanges, relationshipShifts, egoQuestShifts
4. Flag belief revision without supporting fabula event or evidence span

**Evidence tag:** RESEARCH

## References
- packages/graph-schema/src/character.ts
