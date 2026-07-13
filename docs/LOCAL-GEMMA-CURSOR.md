# Use local Gemma in Cursor / CLI

## What works (and what doesn’t)

Cursor Agent/Chat **cannot** call `http://127.0.0.1:11434` directly.
Requests are built on Cursor’s servers, so the OpenAI override URL must be a
**public HTTPS** endpoint (Cloudflare Tunnel / ngrok).

For offline local edits with no tunnel, use the repo CLI instead.

## Model aliases already on this machine

| Alias | Points at |
|-------|-----------|
| `gemma4e4b` | Gemma 4 E4B uncensored, `num_ctx=16384`, coding-friendly sampling |
| `gemma4:e4b-uncensored` | Same weights, original tuned alias |

Use **`gemma4e4b`** in Cursor (no `:` / `-`) — Cursor has stripped special characters from model names in the past.

## Option A — Cursor IDE (tunnel required)

### 1. Keep Ollama + model warm

```powershell
ollama run gemma4e4b "" --keepalive 60m
```

### 2. Start the tunnel (leave this terminal open)

```powershell
npm run gemma:tunnel
```

The script forces `--protocol http2` (needed when QUIC/UDP 7844 is blocked)
and `--http-host-header=localhost:11434` (required or Ollama returns 403).

Copy the printed `https://….trycloudflare.com` URL.

### 3. Cursor Settings → Models

| Field | Value |
|-------|-------|
| OpenAI API Key | `ollama` (any non-empty string) |
| Override OpenAI Base URL | `https://YOUR-SUBDOMAIN.trycloudflare.com/v1` |
| Custom model name | `gemma4e4b` |

Then pick **`gemma4e4b`** in the chat/agent model dropdown.

### Security note

A quick tunnel exposes your Ollama API to the internet for as long as the
process runs. Stop the tunnel when you’re done. Prefer a named Cloudflare
tunnel with access rules for longer-term setups.

## Option B — Local coding CLI (no tunnel)

Talks straight to `http://127.0.0.1:11434` and writes file edits:

```powershell
# Dry-run (see what Gemma would change)
npm run gemma:code -- "Add a one-line JSDoc to export const APP_VERSION" --file apps/web/lib/app-meta.ts --dry

# Apply the edit
npm run gemma:code -- "Add a one-line JSDoc to export const APP_VERSION" --file apps/web/lib/app-meta.ts
```

Env overrides:

```powershell
$env:OLLAMA_MODEL="gemma4e4b"
$env:OLLAMA_BASE_URL="http://127.0.0.1:11434"
```

## Endpoint reference

| API | URL |
|-----|-----|
| Ollama native | `http://127.0.0.1:11434` |
| OpenAI-compatible | `http://127.0.0.1:11434/v1/chat/completions` |
| Health / tags | `http://127.0.0.1:11434/api/tags` |
