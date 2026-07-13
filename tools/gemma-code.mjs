#!/usr/bin/env node
/**
 * Lightweight local coding agent against Ollama (Gemma etc.).
 * Usage:
 *   node tools/gemma-code.mjs "add a comment to function foo" --file path/to/file.ts
 *   node tools/gemma-code.mjs "explain this file" --file path/to/file.ts --dry
 *   node tools/gemma-code.mjs "refactor ..." --file a.ts --file b.ts
 *
 * Env:
 *   OLLAMA_BASE_URL  (default http://127.0.0.1:11434)
 *   OLLAMA_MODEL     (default gemma4e4b)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const BASE = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/+$/, "")
const MODEL = process.env.OLLAMA_MODEL ?? "gemma4e4b"

const args = process.argv.slice(2)
const files = []
let dry = false
const promptParts = []

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--file" || args[i] === "-f") {
    if (!args[i + 1]) {
      console.error("Missing path after --file")
      process.exit(1)
    }
    files.push(resolve(args[++i]))
    continue
  }
  if (args[i] === "--dry") {
    dry = true
    continue
  }
  if (args[i] === "--model" && args[i + 1]) {
    process.env.OLLAMA_MODEL = args[++i]
    continue
  }
  if (args[i] === "--help" || args[i] === "-h") {
    console.log(`gemma-code — local Ollama code editor

Usage:
  node tools/gemma-code.mjs "<instruction>" --file <path> [--file <path2>] [--dry]

Env: OLLAMA_BASE_URL OLLAMA_MODEL (default gemma4e4b)
`)
    process.exit(0)
  }
  promptParts.push(args[i])
}

const instruction = promptParts.join(" ").trim()
if (!instruction) {
  console.error("Provide an instruction string. See --help.")
  process.exit(1)
}
if (files.length === 0) {
  console.error("Provide at least one --file <path>")
  process.exit(1)
}

for (const file of files) {
  if (!existsSync(file)) {
    console.error(`File not found: ${file}`)
    process.exit(1)
  }
}

const fileBlocks = files.map((file) => {
  const content = readFileSync(file, "utf8")
  const posix = file.replace(/\\/g, "/")
  return `### FILE: ${posix}\n\`\`\`\n${content}\n\`\`\``
}).join("\n\n")

const system = `You are a careful coding agent editing local source files.
Return ONLY a JSON object (no markdown fences, no thinking tags) with this shape:
{
  "edits": [
    { "file": "<path using forward slashes>", "content": "<full new file contents as a JSON string>" }
  ],
  "notes": "<one short sentence summarizing the change>"
}
Rules:
- Only edit the files that need changes.
- In JSON, escape newlines as \\n and quotes as \\". Never put raw Windows backslashes in "file" — use forward slashes.
- Preserve formatting style of each file (semicolons, quotes, etc.).
- content must be the COMPLETE file after edits, not a patch.
- If no change is needed, return {"edits":[],"notes":"no change"}.
- Do not invent new files unless asked.`

const user = `Instruction:
${instruction}

Files:
${fileBlocks}`

const model = process.env.OLLAMA_MODEL ?? MODEL

console.log(`Model: ${model}`)
console.log(`Endpoint: ${BASE}/v1/chat/completions`)
console.log(`Files: ${files.length}`)

const response = await fetch(`${BASE}/v1/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model,
    stream: false,
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  }),
})

if (!response.ok) {
  const detail = await response.text().catch(() => "")
  console.error(`Ollama error ${response.status}: ${detail.slice(0, 400)}`)
  process.exit(1)
}

const data = await response.json()
let raw = data.choices?.[0]?.message?.content ?? ""
raw = raw
  .replace(/<think>[\s\S]*?<\/think>/gi, "")
  .replace(/```(?:json)?\s*([\s\S]*?)```/i, "$1")
  .trim()

const start = raw.indexOf("{")
const end = raw.lastIndexOf("}")
if (start < 0 || end <= start) {
  console.error("Model did not return JSON. Raw response:")
  console.error(raw.slice(0, 800))
  process.exit(1)
}

const normalizePath = (p) => resolve(String(p).replace(/\//g, "\\"))

const repairJson = (text) => {
  // Fix raw Windows backslashes in "file" values (invalid JSON escapes)
  return text.replace(/"file"\s*:\s*"([^"]*)"/g, (_, p) => {
    const fixed = p.replace(/\\/g, "/")
    return `"file":"${fixed}"`
  })
}

let parsed
try {
  parsed = JSON.parse(raw.slice(start, end + 1))
} catch {
  try {
    parsed = JSON.parse(repairJson(raw.slice(start, end + 1)))
  } catch (error) {
    console.error("Failed to parse JSON:", error.message)
    console.error(raw.slice(0, 800))
    process.exit(1)
  }
}

const edits = Array.isArray(parsed.edits) ? parsed.edits : []
console.log(`Notes: ${parsed.notes ?? "(none)"}`)
console.log(`Edits: ${edits.length}${dry ? " (dry-run)" : ""}`)

if (edits.length === 0) process.exit(0)

for (const edit of edits) {
  const target = normalizePath(edit.file)
  const allowed = files.some((f) => normalizePath(f) === target)
  if (!allowed) {
    console.warn(`Skipping edit outside requested files: ${edit.file}`)
    continue
  }
  if (typeof edit.content !== "string") {
    console.warn(`Skipping invalid content for ${edit.file}`)
    continue
  }
  if (dry) {
    console.log(`[dry] would write ${target} (${edit.content.length} chars)`)
    continue
  }
  writeFileSync(target, edit.content, "utf8")
  console.log(`Wrote ${target}`)
}
