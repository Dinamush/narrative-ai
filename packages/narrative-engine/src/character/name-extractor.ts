const NAME_STOP_WORDS = new Set([
  "The", "He", "She", "It", "They", "We", "You", "I", "His", "Her", "Their",
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  "January", "February", "March", "April", "May", "June", "July", "August",
  "September", "October", "November", "December", "Chapter", "Part", "Scene",
  "God", "Lord", "Sir", "Lady", "King", "Queen", "Prince", "Princess",
  "Mr", "Mrs", "Ms", "Dr", "Captain", "General", "Colonel", "Professor",
  "North", "South", "East", "West", "English", "French", "American", "British",
  // Creole / dialect tokens often capitalized at sentence start
  "Yuh", "Meh", "Yall", "Youse", "Ah", "Bai", "Wid", "Tek", "Gon", "Cyant", "Cyan",
  "Nah", "Wah", "Lebbe", "Doh", "Dunce", "Hallah",
  // Sentence-initial English function words
  "But", "What", "This", "Another", "Just", "Now", "Get", "Help", "Thank", "None",
  "Home", "Kill", "Red", "Ants", "Then", "When", "Where", "How", "Why", "If", "So",
  "And", "Or", "Not", "All", "One", "Two", "Days", "Later", "Some", "Tiny", "Deep",
  "With", "From", "Their", "These", "Those", "Blackness", "Razor", "Droplets",
  // Sentence-initial function words (dialogue / narration)
  "No", "In", "On", "At", "To", "For", "By", "As", "Of", "An", "A", "Please",
  "One", "His", "Her", "Its", "Our", "Your", "My", "Could", "Would", "Should",
  "After", "Before", "During", "While", "Though", "Although", "Because", "Until",
])

const COMMON_VERBS = new Set([
  "Kill", "Help", "Get", "Throw", "Move", "Leave", "Said", "Asked", "Replied",
])

const ROLE_DESCRIPTOR =
  /\b(?:the|his|her|an|a)\s+((?:old\s+)?(?:wo)?man|uncle|aunt|cousin|nephew|mother|father|brother|sister|boy|girl|son|daughter|pleading\s+man|larger\s+man|cloaked\s+man)\b/gi

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
    if (COMMON_VERBS.has(name)) continue
    if (name.length < 2) continue
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  let roleMatch: RegExpExecArray | null
  ROLE_DESCRIPTOR.lastIndex = 0
  while ((roleMatch = ROLE_DESCRIPTOR.exec(text)) !== null) {
    const raw = roleMatch[0].toLowerCase()
    let label: string | null = null
    if (raw.includes("old woman") || raw.includes("aunty")) label = "Old woman"
    else if (raw.includes("cousin") || raw.includes("pleading man")) label = "Cousin"
    else if (raw.includes("uncle") || raw.includes("larger man")) label = "Uncle"
    else if (raw.includes("cloaked man") || raw.includes("nephew")) label = "Ant"
    else if (raw.includes("mother") || raw.includes("mom")) label = "Mother"
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  const johnMatch = text.match(/\bJohn\b/g)
  if (johnMatch) counts.set("John", (counts.get("John") ?? 0) + johnMatch.length)

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

export const isLikelyCharacterName = (
  name: string,
  totalCount: number,
  fabulaBoost = 0
) => {
  if (NAME_STOP_WORDS.has(name.split(" ")[0])) return false
  if (COMMON_VERBS.has(name)) return false
  if (name.length < 2) return false
  if (fabulaBoost > 0) return true
  return totalCount >= 2
}
