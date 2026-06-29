# EgoQuest Fiction Adaptation — RAG Knowledge Base

Domain: egoquest
Source: psyche-converse-1/docs/EgoQuest.md, ARCHITECTURE.md §6
Use for: EgoQuest scoring on attributed fiction spans
Pair with: 01_fiction_attribution_rules.md, 06_character_arc_methods.md

## Overview

EgoQuest (EGO Metric) integrates SHADOW, CONTINUUM, DRIVER plus psychodynamic layers. Fiction adaptation requires per-scene attributed text — not live chat aggregation.

## Meta-dimensions

| Dimension | Fiction use |
|-----------|-------------|
| SHADOW | Stress behavior at crisis beats; Enneagram disintegration paths |
| CONTINUUM | Cognitive style spectrum (Te–Ti, Fe–Fi, etc.) |
| DRIVER | Core motivation via Enneagram + temperament |
| Core wound | rejection, abandonment, insignificance, failure, vulnerability — evidence required |
| Social mask | laughing, crying, adaptive — public persona vs authentic self |
| Differentiation | Bowen fused → high; primary growth arc metric |

## Scoring thresholds

- activationStrength ≥ 0.12 AND ≥ 80 chars attributed text → optional LLM refinement
- Blend: 55% LLM / 45% keyword when LLM triggered
- Gate UI fields below confidence threshold
- Score ONLY when linguistic evidence supports mechanism — do not invent trauma

## Literary examples (HEURISTIC)

- Laughing mask: public wit deflecting vulnerability (e.g., trickster archetypes)
- Crying mask: stoic burden-carrier, suppressed grief
- Shadow spike: expected at climax/ordeal beats; distinguish from OOC unless unmotivated

## Fiction vs chat differences

| Chat | Fiction |
|------|---------|
| User is speaker | Multiple characters + narrator |
| Message buffer ≥5 | Per-scene attribution |
| High typology weight | Lower MBTI weight; higher psychodynamic weight |

**Evidence tag:** RESEARCH

## References
- packages/egoquest-fiction/src/fiction-scorer.ts
