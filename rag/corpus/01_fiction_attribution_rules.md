# Fiction Attribution Rules — RAG Knowledge Base

Domain: character
Source: ARCHITECTURE.md §6, §16 | Chatman Story and Discourse
Use for: character extraction, EgoQuest scoring, state snapshot attribution
Pair with: 05_character_state_extraction.md, 07_ooc_detection_heuristics.md

## Overview

Literary text contains multiple voices: narrator, character dialogue, internal monologue, and free indirect discourse (FID). Character analysis must score only **attributed** spans — never omniscient narrator exposition unless FID blurs the boundary.

## Rules

### Rule: Dialogue attribution
**Markers:** Quotation marks, em-dash speech tags ("said X", "X whispered"), screenplay CHARACTER: lines
**Distinguish from:** Narrator summary of speech ("He told her to leave" — not direct dialogue)
**Example:** `"I won't go back," she said.` → attribute to speaker identified in tag or prior context.
**Evidence tag:** THEORY

### Rule: Internal monologue
**Markers:** First-person present reflection, italicized thought (when marked), "she thought", "he wondered"
**Distinguish from:** Narrator telling reader what character thinks ("She knew he was lying" — narrator, not character voice)
**Example:** *Why did I ever trust him?* → attribute if clearly character POV.
**Evidence tag:** HEURISTIC

### Rule: Free indirect discourse (FID)
**Markers:** Third-person grammar with character's vocabulary/syntax; no quotation marks; subjective evaluative language aligned to focalizer
**Distinguish from:** Objective narrator ("The room was cold") vs FID ("God, it was freezing in here")
**Example:** FID carries character idiolect — attribute to focalizer with lower confidence than direct dialogue.
**Evidence tag:** RESEARCH

### Rule: Exclude omniscient narrator
**Markers:** World-building asides, historical context, statements about multiple characters' unknowable thoughts
**Action:** Do NOT score EgoQuest psychodynamic signals from narrator-only exposition.
**Evidence tag:** HEURISTIC

### Rule: Minimum evidence for scoring
**Threshold:** activationStrength ≥ 0.12 AND ≥ 80 characters of attributed text per character per scene
**Action:** Gate low-confidence EgoQuest dimensions in output; do not invent wounds or trauma.
**Evidence tag:** RESEARCH

## References
- packages/graph-schema/src/character.ts
- packages/egoquest-fiction/src/attribution-service.ts
