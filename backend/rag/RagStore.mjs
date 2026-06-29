import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORE_PATH = path.resolve(__dirname, "../../rag/store/index.json")
const CORPUS_DIR = path.resolve(__dirname, "../../rag/corpus")

const cosineSimilarity = (a, b) => {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

const loadStore = () => {
  if (!fs.existsSync(STORE_PATH)) {
    return { chunks: [], updatedAt: null }
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"))
}

const saveStore = (store) => {
  const dir = path.dirname(STORE_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  store.updatedAt = new Date().toISOString()
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
}

const splitLongText = (text, maxChars) => {
  const parts = []
  for (let i = 0; i < text.length; i += maxChars) {
    parts.push(text.slice(i, i + maxChars).trim())
  }
  return parts.filter(Boolean)
}

const chunkText = (text, maxChars = 800) => {
  const paragraphs = text.split(/\n\n+/)
  const chunks = []
  let current = ""

  for (const rawPara of paragraphs) {
    const paras =
      rawPara.length > maxChars ? splitLongText(rawPara, maxChars) : [rawPara]

    for (const para of paras) {
      if ((current + para).length > maxChars && current.length > 0) {
        chunks.push(current.trim())
        current = para
      } else {
        current = current ? `${current}\n\n${para}` : para
      }
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

const inferDomain = (filename, content) => {
  const lower = `${filename} ${content.slice(0, 600)}`.toLowerCase()
  if (lower.includes("domain: character") || lower.includes("attribution")) return "character"
  if (lower.includes("domain: style") || lower.includes("register") || lower.includes("wavelength")) return "style"
  if (lower.includes("domain: theme")) return "theme"
  if (lower.includes("domain: egoquest") || lower.includes("shadow") || lower.includes("differentiation")) return "egoquest"
  if (lower.includes("domain: plot") || lower.includes("fabula") || lower.includes("syuzhet")) return "plot"
  return "general"
}

export class RagStore {
  constructor({ embedFn } = {}) {
    this.embedFn = embedFn
  }

  async embed(text) {
    if (!this.embedFn) throw new Error("Embedding function not configured")
    return this.embedFn(text)
  }

  async ingestCorpus({ force = false } = {}) {
    if (!fs.existsSync(CORPUS_DIR)) {
      return { ingested: 0, message: "No corpus directory found" }
    }

    const files = fs.readdirSync(CORPUS_DIR).filter((f) => f.endsWith(".md"))
    const store = force ? { chunks: [], updatedAt: null } : loadStore()
    const existingKeys = new Set(store.chunks.map((c) => `${c.sourceFile}:${c.chunkIndex}`))
    let ingested = 0
    let skipped = 0

    for (const file of files) {
      const filePath = path.join(CORPUS_DIR, file)
      const content = fs.readFileSync(filePath, "utf8")
      const domain = inferDomain(file, content)
      const chunks = chunkText(content)

      for (let i = 0; i < chunks.length; i++) {
        const key = `${file}:${i}`
        if (!force && existingKeys.has(key)) {
          skipped++
          continue
        }

        const embedding = await this.embed(chunks[i])
        const entry = {
          id: `${file.replace(/\.md$/, "")}_${i}`,
          title: `${domain} — ${file} (chunk ${i + 1})`,
          domain,
          framework: domain,
          content: chunks[i],
          sourceFile: file,
          chunkIndex: i,
          embedding,
        }

        store.chunks.push(entry)
        existingKeys.add(key)
        ingested++
      }
    }

    saveStore(store)
    return { ingested, skipped, total: store.chunks.length, files: files.length, force }
  }

  async search(query, { topK = 5, domain = null } = {}) {
    const queryEmbedding = await this.embed(query)
    const store = loadStore()
    const scored = store.chunks
      .filter((c) => !domain || c.domain === domain || c.framework === domain)
      .map((c) => ({
        ...c,
        score: cosineSimilarity(queryEmbedding, c.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return scored.map(({ embedding, ...rest }) => rest)
  }

  getStats() {
    const store = loadStore()
    const byDomain = {}
    for (const chunk of store.chunks) {
      const key = chunk.domain ?? chunk.framework ?? "general"
      byDomain[key] = (byDomain[key] || 0) + 1
    }
    return {
      totalChunks: store.chunks.length,
      byDomain,
      updatedAt: store.updatedAt,
      corpusFiles: fs.existsSync(CORPUS_DIR)
        ? fs.readdirSync(CORPUS_DIR).filter((f) => f.endsWith(".md"))
        : [],
    }
  }

  formatContext(results) {
    if (!results.length) return ""
    return results
      .map(
        (r, i) =>
          `[Knowledge ${i + 1}: ${r.domain ?? r.framework}, score=${(r.score ?? 0).toFixed(3)}]\n${r.content}`
      )
      .join("\n\n---\n\n")
  }
}
