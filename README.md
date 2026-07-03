# Narrative AI

**Map the invisible structure of your story** — fabula and syuzhet graphs, character arcs, dramatic tension, and plot diagnostics grounded in evidence.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![Version](https://img.shields.io/badge/version-0.1.0-orange)](version.json)

> Neuro-symbolic narrative intelligence for fiction writers, editors, and researchers.  
> Built with Next.js, TypeScript, and optional local LLM (Ollama) or OpenAI.

---

## What it does

Upload or paste a manuscript and get:

| Layer | Output |
|-------|--------|
| **Structure** | Fabula DAG (causal plot) + syuzhet (presentation order) |
| **Characters** | Cast identification, relationship network, per-scene state snapshots |
| **Psychology** | EgoQuest-adapted psychodynamic signals (confidence-gated) |
| **Drama** | Tension curve vs Freytag / three-act targets, turning points |
| **Style** | Themes, register, wavelength drift across scenes |
| **Diagnostics** | Plot-hole detection, DAG validation, continuity checks |

Analysis runs **locally in your browser** (IndexedDB). No account required for the MVP.

---

## Quick start

### Prerequisites

- **Node.js 20+**
- **npm** (workspaces monorepo)
- **Ollama** (recommended, free local LLM) — [ollama.com](https://ollama.com)

### 1. Clone and install

```bash
git clone https://github.com/Dinamush/narrative-ai.git
cd narrative-ai
npm install
```

### 2. Configure LLM (optional)

```bash
cp .env.example apps/web/.env.local
```

| Setup | What to set |
|-------|-------------|
| **Local (default)** | Install Ollama, run `ollama pull llama3.2`, leave `LLM_PROVIDER=ollama` |
| **OpenAI** | Set `OPENAI_API_KEY` and `LLM_PROVIDER=openai` |
| **No LLM** | Set `LLM_PROVIDER=none` — uses heuristic extraction only |

### 3. Run the app

```bash
npm run dev
```

Open **http://localhost:3000** (or the next free port if 3000 is taken — check the terminal).

Click **New analysis**, paste text or try a sample manuscript, then explore Structure, Characters, Arc, and Diagnostics.

---

## Sample manuscripts

Bundled under `samples/` and in the UI:

| Sample | Notes |
|--------|-------|
| **The Last Light** | Literary fiction, betrayal arc |
| **Ward Rounds** | Short clinical drama |
| **Red Ants (Creole)** | Caribbean dialect — tests segmentation & character ID |

Run headless verification:

```bash
npm run analyze:sample          # The Last Light + Ward Rounds
node backend/scripts/analyze-red-ants.mjs   # Creole benchmark
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Build packages + start Next.js dev server |
| `npm run build` | Production build (all workspaces) |
| `npm run analyze:sample` | Run pipeline on bundled samples |
| `npm run test:e2e` | API smoke test (dev server must be running) |
| `npm run test:ollama` | Check Ollama connectivity |
| `npm run version:sync` | Sync `version.json` → packages + UI |

---

## Project structure

```
narrative-ai/
├── apps/web/                 # Next.js UI (App Router)
├── packages/
│   ├── graph-schema/         # Zod types for NarrativeGraph
│   ├── narrative-engine/     # Segmentation, fabula, style, characters
│   └── egoquest-fiction/     # Psychodynamic scoring for fiction
├── backend/scripts/          # CLI analysis & E2E tests
├── rag/corpus/               # Methodology docs for RAG critics
├── samples/                  # Test manuscripts + output
├── ARCHITECTURE.md           # Full technical design doc
└── docs/VERSIONING.md        # Release & schema version policy
```

---

## How analysis works

```
Manuscript → Scene segmentation → Event extraction (LLM or heuristic)
          → Fabula DAG + causal edges → Syuzhet projection
          → Style & themes → Character ID + state snapshots
          → EgoQuest scoring → Arc aggregation → Validation
```

**Design principles:** graph-first causality, evidence-grounded extractions, symbolic validation before neural critics, confidence gating on psychodynamic signals.

See [ARCHITECTURE.md](ARCHITECTURE.md) for narratology foundations (fabula/syuzhet, Chatman kernels, MARCUS arcs, etc.).

---

## Versioning

| Artifact | Current | Policy |
|----------|---------|--------|
| **App** | `0.1.0` | [SemVer](https://semver.org) — see [CHANGELOG.md](CHANGELOG.md) |
| **Graph schema** | `1.1.0` | Bumped when export format changes |
| **Packages** | `0.1.0` | Monorepo workspaces, synced via `version.json` |

```bash
# After editing version.json:
npm run version:sync
```

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style, and PR guidelines.

---

## License

[MIT](LICENSE) © Samir Mohammed

---

## Related

- [EgoQuest / PsycheConverse](https://github.com/Dinamush/psyche-converse) — source psychodynamic scoring adapted for fiction
- [ARCHITECTURE.md](ARCHITECTURE.md) — system design & roadmap
