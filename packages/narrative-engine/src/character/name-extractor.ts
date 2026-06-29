const NAME_STOP_WORDS = new Set([
  "The", "He", "She", "It", "They", "We", "You", "I", "His", "Her", "Their",
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  "January", "February", "March", "April", "May", "June", "July", "August",
  "September", "October", "November", "December", "Chapter", "Part", "Scene",
  "God", "Lord", "Sir", "Lady", "King", "Queen", "Prince", "Princess",
  "Mr", "Mrs", "Ms", "Dr", "Captain", "General", "Colonel", "Professor",
  "North", "South", "East", "West", "English", "French", "American", "British",
])

const NAME_PATTERN = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g

export type NameMention = {
  name: string
  sceneId: string
  count: number
}

export const extractNameMentions = (
  text: string,
  sceneId: string
): Map<string, number> => {
  const counts = new Map<string, number>()
  const matches = text.matchAll(NAME_PATTERN)

  for (const match of matches) {
    const name = match[1]
    if (!name || NAME_STOP_WORDS.has(name.split(" ")[0])) continue
    if (name.length < 2) continue
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  return counts
}

export const mergeNameCounts = (
  all: Map<string, number>,
  sceneCounts: Map<string, number>
) => {
  for (const [name, count] of sceneCounts) {
    all.set(name, (all.get(name) ?? 0) + count)
  }
}

export const slugifyName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

export const isLikelyCharacterName = (name: string, totalCount: number) =>
  totalCount >= 2 && name.length >= 3
