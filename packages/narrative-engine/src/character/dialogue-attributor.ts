import type { TextSpan } from "@narrative-ai/graph-schema"

export type AttributedSpan = {
  characterName: string
  text: string
  span: TextSpan
  type: "dialogue" | "internal" | "action"
}

const DIALOGUE_PATTERNS = [
  /"([^"]{4,})"\s*,?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|asked|replied|whispered|shouted|muttered|cried|exclaimed)/gi,
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|asked|replied|whispered|shouted|muttered|cried|exclaimed)\s*,?\s*"([^"]{4,})"/gi,
  /'([^']{4,})'\s*,?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|asked|replied)/gi,
]

const INTERNAL_PATTERNS = [
  /(?:thought|wondered|realized|knew|felt|feared|hoped|wished|remembered)\s+(?:that\s+)?([^.!?]{8,}[.!?])/gi,
]

export const attributeSceneText = (
  sceneText: string,
  textOffsetStart: number,
  knownNames: string[]
): AttributedSpan[] => {
  const spans: AttributedSpan[] = []
  const nameSet = new Set(knownNames.map((n) => n.toLowerCase()))

  for (const pattern of DIALOGUE_PATTERNS) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(sceneText)) !== null) {
      const isNameFirst = pattern.source.startsWith("(")
      const dialogue = isNameFirst ? match[2] : match[1]
      const speaker = isNameFirst ? match[1] : match[2]
      if (!dialogue || !speaker) continue
      if (!nameSet.has(speaker.toLowerCase())) continue

      const start = textOffsetStart + match.index + match[0].indexOf(dialogue)
      spans.push({
        characterName: speaker,
        text: dialogue,
        span: { start, end: start + dialogue.length },
        type: "dialogue",
      })
    }
  }

  for (const pattern of INTERNAL_PATTERNS) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(sceneText)) !== null) {
      const thought = match[1]?.trim()
      if (!thought || thought.length < 8) continue

      const start = textOffsetStart + match.index
      for (const name of knownNames) {
        if (sceneText.slice(Math.max(0, match.index - 40), match.index).includes(name)) {
          spans.push({
            characterName: name,
            text: thought,
            span: { start, end: start + match[0].length },
            type: "internal",
          })
          break
        }
      }
    }
  }

  return spans
}

export const collectAttributedText = (
  spans: AttributedSpan[],
  characterName: string
): string =>
  spans
    .filter((s) => s.characterName.toLowerCase() === characterName.toLowerCase())
    .map((s) => s.text)
    .join(" ")
