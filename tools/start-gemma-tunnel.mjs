#!/usr/bin/env node
/**
 * Expose local Ollama as a public HTTPS URL for Cursor Models override.
 * Prints the URL you paste into: Cursor Settings → Models → Override OpenAI Base URL
 *
 * Usage: npm run gemma:tunnel
 * Requires: cloudflared (winget install Cloudflare.cloudflared)
 */
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"

const CLOUDFLARED_CANDIDATES = [
  process.env.CLOUDFLARED_PATH,
  "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe",
  "C:\\Program Files\\cloudflared\\cloudflared.exe",
  "cloudflared",
].filter(Boolean)

const findBinary = () => {
  for (const candidate of CLOUDFLARED_CANDIDATES) {
    if (candidate === "cloudflared") return candidate
    if (existsSync(candidate)) return candidate
  }
  return null
}

const binary = findBinary()
if (!binary) {
  console.error("cloudflared not found. Install with:")
  console.error("  winget install --id Cloudflare.cloudflared -e")
  process.exit(1)
}

const OLLAMA = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/+$/, "")

console.log("Starting Cloudflare quick tunnel →", OLLAMA)
console.log("Leave this terminal open while using Gemma in Cursor.\n")

const child = spawn(
  binary,
  [
    "tunnel",
    "--protocol",
    "http2",
    "--http-host-header",
    "localhost:11434",
    "--url",
    OLLAMA,
  ],
  {
    stdio: ["ignore", "pipe", "pipe"],
  }
)

let announced = false

const handleChunk = (chunk) => {
  const text = chunk.toString()
  process.stderr.write(text)
  if (announced) return
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
  if (!match) return
  announced = true
  const base = match[0]
  console.log("\n" + "=".repeat(60))
  console.log("CURSOR SETUP")
  console.log("=".repeat(60))
  console.log(`
1. Open Cursor Settings → Models
2. OpenAI API Key: ollama   (any non-empty string)
3. Override OpenAI Base URL: ${base}/v1
4. Add Custom Model named exactly: gemma4e4b
5. Select gemma4e4b in the model picker for a new Agent/Chat

IMPORTANT
- Keep this tunnel running.
- Cursor cannot reach localhost; the public URL is required.
- Prefer model name "gemma4e4b" (no colons) — Cursor strips : and -
`)
}

child.stdout.on("data", handleChunk)
child.stderr.on("data", handleChunk)

child.on("exit", (code) => {
  console.error(`cloudflared exited with code ${code}`)
  process.exit(code ?? 1)
})

process.on("SIGINT", () => {
  child.kill("SIGINT")
  process.exit(0)
})
