# Character Arc Methods — RAG Knowledge Base

Domain: character
Source: MARCUS, UED (ACL 2024), relational arcs (Christou & Tsoumakas 2025)
Use for: arc metrics, turning points, visualization
Pair with: 05_character_state_extraction.md, 08_egoquest_fiction_adaptation.md

## Overview

Track arcs **per character**, not novel-level sentiment. Actor and experiencer roles diverge at turning points.

## MARCUS circumstance

Per event with character as participant:
- SRL roles: actor, experiencer (may both apply)
- sentiment (0–1) + GoEmotions multi-label
- circumstance = α·sentiment + Σ β_i·emotion_confidence_i

Character arc:
- arc_as_actor = sum circumstance where role=actor (Savitzky-Golay smoothed)
- arc_as_experiencer = sum circumstance where role=experiencer (smoothed)

## UED (utterance emotion dynamics)

- Rolling 500-word windows on **dialogue-attributed** text per speaker
- VAD: valence, arousal, dominance
- Displacement from emotional home base (Act I mean VAD)
- uedDisplacementPeak, uedDisplacementLength → CharacterArcMetrics

**Rule:** Narration emotion ≠ character emotion — score separately.

## Arc shape taxonomy

| Shape | Detection |
|-------|-----------|
| rise | end > start + monotonic trend |
| fall | inverse |
| u_shape | minimum in middle third |
| oscillating | ≥3 sign changes on smoothed curve |
| flat | variance below threshold |

Turning points: local extrema on circumstance + change-points on goalChanges and shadow.intensity.

## Relational arcs

Per character pair: RelationArcSegment[] with circumstanceScore over scene windows. Cluster shapes: rise, U-shape, decline, oscillating (Christou & Tsoumakas).

**Evidence tag:** RESEARCH

## References
- packages/graph-schema/src/character.ts (CharacterArcMetricsSchema)
