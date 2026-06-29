import type { Proposition } from "@narrative-ai/graph-schema"

export type PropositionInput = {
  sceneId: string
  fabulaTime: number
  text: string
  textOffsetStart: number
}

const PROPOSITION_PATTERNS = [
  {
    regex: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|was|are|were)\s+(?!not\b)([^.!?]{3,80})/g,
    polarity: "affirmed" as const,
  },
  {
    regex: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|was|are|were)\s+not\s+([^.!?]{3,80})/gi,
    polarity: "negated" as const,
  },
  {
    regex: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:has|had|have)\s+(?!no\b|not\b)([^.!?]{3,80})/g,
    polarity: "affirmed" as const,
  },
]

export const extractPropositions = (input: PropositionInput): Proposition[] => {
  const propositions: Proposition[] = []
  let counter = 0

  for (const pattern of PROPOSITION_PATTERNS) {
    for (const match of input.text.matchAll(pattern.regex)) {
      const subject = match[1]?.trim()
      const predicate = match[2]?.trim()
      if (!subject || !predicate) continue
      if (predicate.length < 3) continue

      const matchIndex = match.index ?? 0
      propositions.push({
        id: `prop-${input.sceneId}-${counter++}`,
        sceneId: input.sceneId,
        fabulaTime: input.fabulaTime,
        subject,
        predicate,
        polarity: pattern.polarity,
        evidenceSpan: {
          start: input.textOffsetStart + matchIndex,
          end: input.textOffsetStart + matchIndex + match[0].length,
        },
      })
    }
  }

  return propositions.slice(0, 20)
}
