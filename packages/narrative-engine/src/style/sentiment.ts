const POSITIVE = [
  "love",
  "hope",
  "joy",
  "happy",
  "peace",
  "win",
  "success",
  "beautiful",
  "laugh",
  "smile",
  "safe",
  "freedom",
  "triumph",
  "warm",
  "gentle",
  "kind",
  "trust",
]

const NEGATIVE = [
  "fear",
  "death",
  "kill",
  "murder",
  "blood",
  "terror",
  "horror",
  "hate",
  "pain",
  "cry",
  "scream",
  "danger",
  "dark",
  "lost",
  "fail",
  "betray",
  "war",
  "gun",
  "knife",
  "died",
  "dead",
]

const HIGH_AROUSAL = [
  "suddenly",
  "ran",
  "shouted",
  "fought",
  "explosion",
  "chase",
  "scream",
  "panic",
  "urgent",
  "fast",
  "crash",
  "attack",
]

export type SentimentScore = {
  valence: number
  arousal: number
}

export const scoreSentiment = (text: string): SentimentScore => {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean)
  if (words.length === 0) return { valence: 0.5, arousal: 0.3 }

  let pos = 0
  let neg = 0
  let arousal = 0

  for (const word of words) {
    if (POSITIVE.some((w) => word.includes(w))) pos++
    if (NEGATIVE.some((w) => word.includes(w))) neg++
    if (HIGH_AROUSAL.some((w) => word.includes(w))) arousal++
  }

  const total = words.length
  const valence = Math.min(1, Math.max(0, 0.5 + (pos - neg) / Math.max(total * 0.15, 1)))
  const arousalScore = Math.min(1, Math.max(0.1, arousal / Math.max(total * 0.08, 1)))

  return { valence, arousal: arousalScore }
}

export const sentimentToTension = (sentiment: SentimentScore): number => {
  const negativePull = 1 - sentiment.valence
  return Math.min(1, Math.max(0, negativePull * 0.65 + sentiment.arousal * 0.35))
}
