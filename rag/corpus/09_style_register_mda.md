# Style Register and MDA — RAG Knowledge Base

Domain: style
Source: Biber MDA, ARCHITECTURE.md §5 Phase 3
Use for: register extraction, wavelength drift
Pair with: 09_theme_extraction.md

## Overview

**Register** = linguistic style dimension (Biber Multi-Dimensional Analysis). **Wavelength** = cross-scene tonal coherence (cosine drift between adjacent SceneStyleVector embeddings).

## MDA-lite features (per scene)

| Dimension | Signals |
|-----------|---------|
| narrativity | Past tense verbs, third-person pronouns, dialogue ratio |
| orality | First/second person, contractions, private verbs |
| informational | Nouns, prepositions, type-token ratio |
| argumentation | modals, adverbs, causal conjunctions |

Extract: pronoun ratios (I/we vs he/she), TTR/MATTR, clause complexity, tense distribution.

## Wavelength drift

- Compute lexicalFingerprint embedding centroid per scene
- drift(scene_i, scene_{i-1}) = 1 - cosine_similarity
- Flag if drift > threshold **within same act** (not across act boundaries where shift may be intentional)
- Issue type: wavelength_spike

**Evidence tag:** RESEARCH

## References
- packages/graph-schema/src/analysis-result.ts (SceneStyleVectorSchema)
