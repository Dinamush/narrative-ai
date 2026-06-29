# Proposition Continuity — RAG Knowledge Base

Domain: plot
Source: FlawedFictions formal definition, E²RAG
Use for: proposition extractor, continuity checker
Pair with: 04_plot_integrity_checks.md

## Overview

Propositions are atomic statements extracted per scene with subject, predicate, polarity, fabulaTime, and evidenceSpan. Continuity checking detects contradictions in the fact set F.

## Proposition schema

```
{ subject, predicate, polarity: affirmed|negated, fabulaTime, sceneId, evidenceSpan }
```

## Contradiction rule (FlawedFictions)

Proposition φ is inconsistent if F \ {φ} ⊢ ¬φ — i.e., removing φ allows deriving its negation from remaining story facts.

## Entity state at fabulaTime

Do not collapse entity mentions across time (E²RAG). Track state patches via EventNode.stateDelta and AttributeDelta on characters. Propositions at time τ must not contradict propositions at same fabulaTime for same subject.

## Extraction heuristics

- Physical facts: location, possession, injury status
- Relational facts: X is married to Y, X knows secret Z
- World rules: magic system constraints, technology level

**Evidence tag:** RESEARCH

## References
- packages/graph-schema/src/analysis-result.ts (PropositionSchema)
