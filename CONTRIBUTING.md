# Contributing to Narrative AI

Thank you for helping improve Narrative AI! This guide covers local setup and how we accept changes.

## Getting started

1. **Fork** the repo on GitHub
2. **Clone** your fork and install dependencies:

   ```bash
   git clone https://github.com/YOUR_USERNAME/narrative-ai.git
   cd narrative-ai
   npm install
   cp .env.example apps/web/.env.local
   ```

3. **Run the dev server:**

   ```bash
   npm run dev
   ```

4. **Verify** your environment:

   ```bash
   npm run analyze:sample    # pipeline regression
   npm run test:ollama       # optional, if using Ollama
   ```

## What to work on

Check [open issues](https://github.com/Dinamush/narrative-ai/issues) or propose:

- Segmentation / character ID edge cases (especially dialect fiction)
- Plot validation rules and critic prompts
- UI polish and accessibility
- Documentation and sample manuscripts
- Tests and CI

Read [ARCHITECTURE.md](ARCHITECTURE.md) before large changes — it is the design source of truth.

## Pull request guidelines

1. **Branch** from `main` with a descriptive name (`fix/creole-stopwords`, `feat/health-endpoint`)
2. **Keep scope focused** — one logical change per PR
3. **Run checks** before opening:

   ```bash
   npm run build
   npm run analyze:sample
   npm run typecheck
   ```

4. **Describe** what changed and why in the PR body
5. Use **conventional commits** when possible:

   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation only
   - `refactor:` code change without behavior change
   - `test:` tests only

## Code style

- **TypeScript** strict mode, no semicolons (match existing files)
- **Tailwind** for styling in React components
- **Early returns** over deep nesting
- Event handlers prefixed with `handle` (`handleClick`, `handleSubmit`)
- Reuse existing patterns in `packages/narrative-engine` before adding abstractions

## Versioning

When your change affects the public API or export format:

1. Update `version.json` (app and/or `schemaVersion`)
2. Run `npm run version:sync`
3. Add an entry to [CHANGELOG.md](CHANGELOG.md) under `[Unreleased]`

See [docs/VERSIONING.md](docs/VERSIONING.md) for the full policy.

## Questions?

Open a [GitHub Discussion](https://github.com/Dinamush/narrative-ai/discussions) or issue if something is unclear.
