export const hashTextToVector = (text: string, dimensions = 32): number[] => {
  const vec = new Array(dimensions).fill(0)
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean)

  for (const token of tokens) {
    let hash = 0
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0
    }
    vec[hash % dimensions] += 1
  }

  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1
  return vec.map((v) => v / norm)
}

export const cosineDistance = (a: number[], b: number[]): number => {
  const length = Math.min(a.length, b.length)
  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  if (denom === 0) return 1
  return 1 - dot / denom
}
