# Narrative AI — Web App

Next.js frontend for the Narrative AI analysis platform.

## Quick start

From the **repository root**:

```bash
npm install
cp ../.env.example .env.local   # optional LLM config
npm run dev
```

Open the URL printed in the terminal (usually http://localhost:3000).

## Environment

Copy [`.env.example`](../../.env.example) to `apps/web/.env.local`.  
Ollama is used by default when no OpenAI key is set.

## API routes

| Route | Description |
|-------|-------------|
| `GET /api/health` | App version, schema version, repo link |
| `GET /api/llm/status` | LLM provider availability |
| `POST /api/analyze` | Start analysis job |
| `GET /api/analyze/[jobId]/stream` | SSE progress stream |

## Full documentation

See the [root README](../../README.md) and [ARCHITECTURE.md](../../ARCHITECTURE.md).
