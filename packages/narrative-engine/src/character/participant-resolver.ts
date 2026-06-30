import type { EventNode } from "@narrative-ai/graph-schema"

const ROLE_PATTERNS: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /\b(?:the\s+)?old\s+woman\b/i, canonical: "Old woman" },
  { pattern: /\b(?:his|her|the)\s+cousin\b/i, canonical: "Cousin" },
  { pattern: /\b(?:his|her|the)\s+uncle\b/i, canonical: "Uncle" },
  { pattern: /\b(?:the\s+)?larger\s+man\b/i, canonical: "Uncle" },
  { pattern: /\b(?:the\s+)?cloaked\s+man\b/i, canonical: "Ant" },
  { pattern: /\b(?:the\s+)?nephew\b/i, canonical: "Ant" },
  { pattern: /\b(?:the\s+)?pleading\s+man\b/i, canonical: "Cousin" },
  { pattern: /\b(?:the\s+)?old\s+aunty\b/i, canonical: "Old woman" },
  { pattern: /\baunty\b/i, canonical: "Old woman" },
  { pattern: /\b(?:his|her|the)\s+mother\b/i, canonical: "Mother" },
  { pattern: /\bmom\b/i, canonical: "Mother" },
  { pattern: /\bpolice\b/i, canonical: "Police" },
]

export const normalizeParticipantName = (raw: string): string | null => {
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length < 2) return null

  const lower = trimmed.toLowerCase()
  if (
    ["he", "she", "they", "it", "we", "you", "i", "yuh", "meh", "ah", "bai"].includes(
      lower
    )
  ) {
    return null
  }

  for (const { pattern, canonical } of ROLE_PATTERNS) {
    if (pattern.test(trimmed)) return canonical
  }

  if (/^(?:the|a|an)\s+/i.test(trimmed) && !/^[A-Z]/.test(trimmed.replace(/^(?:the|a|an)\s+/i, ""))) {
    return null
  }

  const words = trimmed.split(/\s+/)
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase()
  }

  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

export const collectFabulaParticipants = (
  events: EventNode[]
): Map<string, number> => {
  const counts = new Map<string, number>()

  for (const event of events) {
    for (const raw of event.participants ?? []) {
      const name = normalizeParticipantName(raw)
      if (!name) continue
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
  }

  return counts
}

export const mergeParticipantCounts = (
  target: Map<string, number>,
  source: Map<string, number>,
  weight = 1
) => {
  for (const [name, count] of source) {
    target.set(name, (target.get(name) ?? 0) + count * weight)
  }
}
