import type { SceneStyleVector } from "@narrative-ai/graph-schema"

export type RegisterFeatures = SceneStyleVector["registerMDA"]

export const analyzeRegister = (text: string): RegisterFeatures => {
  const words = text.split(/\s+/).filter(Boolean)
  const lower = text.toLowerCase()
  const tokens = lower.split(/\W+/).filter(Boolean)
  const total = Math.max(tokens.length, 1)
  const unique = new Set(tokens).size

  const firstPerson = (lower.match(/\b(i|me|my|mine|we|us|our|ours)\b/g) ?? []).length
  const thirdPerson = (lower.match(/\b(he|she|they|him|her|them|his|hers|their)\b/g) ?? []).length
  const pastTense = (lower.match(/\b\w+ed\b/g) ?? []).length
  const modals = (lower.match(/\b(would|could|should|must|might|may|shall)\b/g) ?? []).length
  const nouns = (lower.match(/\b[A-Z][a-z]+\b/g) ?? []).length
  const dialogue = (text.match(/"[^"]+"|'[^']+'/g) ?? []).length

  const pronounTotal = firstPerson + thirdPerson || 1
  const ttr = unique / total

  return {
    narrativity: Math.min(1, pastTense / total + dialogue * 0.05 + thirdPerson / pronounTotal * 0.3),
    orality: Math.min(1, firstPerson / pronounTotal * 0.5 + dialogue * 0.08),
    informational: Math.min(1, ttr * 0.6 + nouns / total),
    argumentation: Math.min(1, modals / total * 8),
  }
}
