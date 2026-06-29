const THEME_LEXICON: Record<string, string[]> = {
  love: ["love", "heart", "kiss", "romance", "marry", "desire"],
  death: ["death", "die", "died", "dead", "funeral", "grave", "kill"],
  power: ["power", "control", "rule", "king", "queen", "command", "authority"],
  betrayal: ["betray", "traitor", "lie", "lied", "deceive", "cheat"],
  family: ["mother", "father", "son", "daughter", "brother", "sister", "family"],
  identity: ["self", "who am", "identity", "name", "become", "transform"],
  justice: ["justice", "fair", "law", "court", "guilty", "innocent", "crime"],
  freedom: ["free", "freedom", "escape", "liberate", "chains", "prison"],
  war: ["war", "battle", "soldier", "fight", "army", "weapon"],
  loss: ["loss", "grief", "mourn", "miss", "gone", "never again"],
}

export type ThemeCluster = {
  label: string
  scenes: string[]
  confidence: number
}

export const extractSceneThemes = (text: string): string[] => {
  const lower = text.toLowerCase()
  const tags: string[] = []

  for (const [theme, keywords] of Object.entries(THEME_LEXICON)) {
    const hits = keywords.filter((kw) => lower.includes(kw)).length
    if (hits >= 1) tags.push(theme)
  }

  return tags
}

export const clusterThemes = (
  sceneTags: Array<{ sceneId: string; tags: string[] }>
): ThemeCluster[] => {
  const map = new Map<string, Set<string>>()

  for (const { sceneId, tags } of sceneTags) {
    for (const tag of tags) {
      const set = map.get(tag) ?? new Set()
      set.add(sceneId)
      map.set(tag, set)
    }
  }

  return [...map.entries()]
    .map(([label, scenes]) => ({
      label,
      scenes: [...scenes],
      confidence: Math.min(1, scenes.size / Math.max(sceneTags.length, 1) + 0.2),
    }))
    .sort((a, b) => b.scenes.length - a.scenes.length)
}

export const detectThemeDrift = (
  sceneTags: Array<{ sceneId: string; tags: string[]; chapterIndex: number }>,
  dominantThemes: string[]
): Array<{ sceneId: string; message: string }> => {
  const drifts: Array<{ sceneId: string; message: string }> = []

  for (let i = 1; i < sceneTags.length; i++) {
    const prev = sceneTags[i - 1]
    const curr = sceneTags[i]
    if (prev.chapterIndex !== curr.chapterIndex) continue

    const prevDominant = prev.tags.filter((t) => dominantThemes.includes(t))
    const currDominant = curr.tags.filter((t) => dominantThemes.includes(t))
    if (prevDominant.length === 0 || currDominant.length === 0) continue

    const overlap = prevDominant.filter((t) => currDominant.includes(t))
    if (overlap.length === 0) {
      drifts.push({
        sceneId: curr.sceneId,
        message: `Theme shift within chapter: ${prevDominant.join(", ")} → ${currDominant.join(", ")}`,
      })
    }
  }

  return drifts
}
