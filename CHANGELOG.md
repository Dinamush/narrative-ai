# Changelog

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-03

### Added

- **Public release** — MIT license, README, contributing guide, `.env.example`
- **Versioning** — `version.json`, `npm run version:sync`, graph schema `1.1.0`
- **Web app** — project upload, analysis progress, structure / characters / arc / diagnostics views
- **Analysis pipeline** — segmentation, fabula extraction, syuzhet projection, style analysis
- **Character pipeline** — name extraction, fabula participant fusion, dialogue attribution, EgoQuest gating
- **Literary segmentation** — `--` weak breaks, time-jump openers, oversized-scene split (~900 words)
- **Dynamic LLM extraction** — scene-scaled event caps (6–24), Creole-aware prompts
- **Sample manuscripts** — The Last Light, Ward Rounds, Red Ants (Creole)
- **CLI scripts** — `analyze:sample`, `analyze-red-ants`, `test:e2e`, `test:ollama`
- **LLM providers** — Ollama (default) and OpenAI with heuristic fallback
- **RAG corpus** — methodology documents for future critics

### Changed

- Character identification improved for dialect fiction (stopwords, role descriptors, alias merge)
- E2E tests auto-detect dev server port (3000–3002)

### Known limitations

- EgoQuest scores gated when attributed text &lt; 80 characters
- Ant/Uncle role heuristics may appear on unrelated manuscripts
- Persistence is local-only (IndexedDB); cloud sync planned

[0.1.0]: https://github.com/Dinamush/narrative-ai/releases/tag/v0.1.0
