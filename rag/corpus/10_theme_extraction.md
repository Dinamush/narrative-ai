# Theme Extraction — RAG Knowledge Base

Domain: theme
Source: Tell Don't Show (ACL 2025 Findings), PLOTTER Theme Critic
Use for: theme tagging, theme critic, theme clustering
Pair with: 09_style_register_mda.md

## Overview

Themes in fiction are often **shown, not told**. Raw LDA on prose underperforms. Pipeline: abstractive scene retelling → topic tags → cluster across work.

## Extraction protocol

1. Retell each scene in 2–3 abstract sentences (LM)
2. Extract theme tags from retelling (not raw purple prose)
3. Cluster tags across scenes → work-level themes with scene coverage
4. Store themeTags on SceneNode and AnalysisResult.themes[]

## Theme critic signals

| Signal | Flag |
|--------|------|
| Scene retelling diverges from established theme cluster | theme_drift |
| Explicit moral stated where showing expected | telling-not-showing (suggestion) |
| Climax scene thematically disconnected from Act I setup | major theme_drift |

**Evidence tag:** RESEARCH

## References
- packages/narrative-engine/src/style-analyzer.ts
