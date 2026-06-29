import { RagStore } from "../rag/RagStore.mjs"

const hashEmbed = (text) => {
  const dim = 64
  const vec = new Array(dim).fill(0)
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean)

  for (const token of tokens) {
    let hash = 0
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0
    }
    vec[hash % dim] += 1
  }

  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1
  return vec.map((v) => v / norm)
}

const store = new RagStore({ embedFn: hashEmbed })
const force = process.argv.includes("--force")

const result = await store.ingestCorpus({ force })
console.log(JSON.stringify(result, null, 2))
