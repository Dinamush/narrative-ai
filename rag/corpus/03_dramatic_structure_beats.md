# Dramatic Structure Beats — RAG Knowledge Base

Domain: plot
Source: Freytag, Field, Campbell, Snyder | From Archetypes to Algorithms
Use for: narrativeStage tagging, tensionTarget curves, turning-point detection
Pair with: 02_fabula_syuzhet_principles.md

## Overview

Canonical dramatic structures map to **node metadata + tension curves**, not separate graph topologies. Assign `narrativeStage` and `tensionTarget` (0–1) per scene/event.

## Freytag pyramid (default)

| Stage | Narrative position | tensionTarget |
|-------|-------------------|---------------|
| exposition | 0–10% | 0.10–0.20 |
| rising_action | 10–70% | 0.20–0.65 |
| pre_climax | 70–85% | 0.65–0.95 |
| climax | ~85% | 1.00 |
| falling_action | 85–95% | 0.55–0.25 |
| resolution | 95–100% | 0.15–0.20 |

**Turning points:** Local maxima on measured tension series; climax expected near μ ≈ 0.75–0.85 of narrative progress.

## Three-act structure

| Act | Gate | Function |
|-----|------|----------|
| Act I | 0–25% | Setup, inciting incident at ~10–15% |
| Act II | 25–75% | Confrontation, midpoint reversal at ~50% |
| Act III | 75–100% | Resolution, climax at ~85% |

## Hero's Journey (Campbell)

Tag events with optional stages: ordinary_world, call_to_adventure, refusal, mentor, crossing_threshold, tests, ordeal, reward, road_back, resurrection, return_with_elixir. Use as metadata, not mandatory sequence.

## Save the Cat beats

Waypoint nodes: Opening Image, Theme Stated, Setup, Catalyst, Debate, Break into Two, B Story, Fun and Games, Midpoint, Bad Guys Close In, All Is Lost, Dark Night, Break into Three, Finale, Final Image.

**Evidence tag:** THEORY

## References
- packages/graph-schema/src/common.ts (NarrativeStageSchema)
