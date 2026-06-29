import type {
  MentalStateTriple,
  StateStatement,
  TextSpan,
} from "@narrative-ai/graph-schema"

const GOAL_PATTERNS = [
  /(?:wanted|needed|planned|decided|intended|hoped|wished)\s+to\s+([^.!?]{5,80})/gi,
  /(?:must|had to|would have to)\s+([^.!?]{5,80})/gi,
]

const BELIEF_PATTERNS = [
  /(?:knew|believed|thought|realized|understood|suspected)\s+(?:that\s+)?([^.!?]{5,120})/gi,
]

const KNOWLEDGE_PATTERNS = [
  /(?:learned|discovered|found out|heard|remembered)\s+(?:that\s+)?([^.!?]{5,120})/gi,
]

const PHYSICAL_PATTERNS = [
  /(?:felt|trembled|shook|collapsed|winced|gasped|froze|bled|hurt)\s+([^.!?]{3,80})/gi,
]

let statementCounter = 0

const nextId = (prefix: string) => `${prefix}-${++statementCounter}`

const extractFromPatterns = (
  text: string,
  patterns: RegExp[],
  category: StateStatement["category"],
  textOffsetStart: number
): StateStatement[] => {
  const statements: StateStatement[] = []

  for (const pattern of patterns) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      const content = match[1]?.trim()
      if (!content || content.length < 5) continue
      const start = textOffsetStart + match.index
      statements.push({
        id: nextId(`stmt-${category}`),
        category,
        text: content,
        polarity: "affirmed",
        evidenceSpan: { start, end: start + match[0].length },
      })
    }
  }

  return statements.slice(0, 6)
}

export const extractMentalStates = (
  attributedText: string,
  sceneText: string,
  characterId: string,
  characterName: string,
  textOffsetStart: number
): {
  goals: StateStatement[]
  knowledge: StateStatement[]
  dialogue: StateStatement[]
  physical: StateStatement[]
  mentalStates: MentalStateTriple[]
} => {
  statementCounter = 0
  const source = attributedText.length >= 20 ? attributedText : sceneText

  const goals = extractFromPatterns(source, GOAL_PATTERNS, "goals", textOffsetStart)
  const knowledge = extractFromPatterns(source, KNOWLEDGE_PATTERNS, "knowledge", textOffsetStart)
  const physical = extractFromPatterns(source, PHYSICAL_PATTERNS, "physical", textOffsetStart)

  const dialogueMatches = attributedText.match(/[^.!?]+[.!?]?/g) ?? []
  const dialogue: StateStatement[] = dialogueMatches.slice(0, 4).map((line, i) => ({
    id: nextId("stmt-dialogue"),
    category: "dialogue" as const,
    text: line.trim(),
    polarity: "affirmed" as const,
    evidenceSpan: { start: textOffsetStart + i, end: textOffsetStart + i + line.length },
  }))

  const mentalStates: MentalStateTriple[] = []
  const beliefStatements = extractFromPatterns(source, BELIEF_PATTERNS, "knowledge", textOffsetStart)

  for (const belief of beliefStatements.slice(0, 3)) {
    mentalStates.push({
      id: nextId("mst"),
      subject: characterId,
      predicate: "believes_about",
      object: belief.text.slice(0, 80),
      objectType: "proposition",
      perspective: characterName,
      evidenceSpan: belief.evidenceSpan,
    })
  }

  for (const goal of goals.slice(0, 2)) {
    mentalStates.push({
      id: nextId("mst"),
      subject: characterId,
      predicate: "intends_to",
      object: goal.text.slice(0, 80),
      objectType: "proposition",
      perspective: characterName,
      evidenceSpan: goal.evidenceSpan,
    })
  }

  return { goals, knowledge, dialogue, physical, mentalStates }
}

export const resetStatementCounter = () => {
  statementCounter = 0
}

export const collectEvidenceSpans = (
  ...groups: StateStatement[][]
): TextSpan[] =>
  groups.flatMap((g) => g.map((s) => s.evidenceSpan)).slice(0, 12)
