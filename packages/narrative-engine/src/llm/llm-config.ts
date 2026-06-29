export type LlmProvider = "ollama" | "openai"

export type LlmConfig = {
  provider: LlmProvider
  baseUrl: string
  model: string
  apiKey?: string
}

export type ExtractionMode = "heuristic" | "ollama" | "openai"

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, "")

export const resolveLlmProvider = (): LlmProvider | null => {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase()
  if (explicit === "ollama") return "ollama"
  if (explicit === "openai") return "openai"
  if (explicit === "none" || explicit === "off") return null

  if (process.env.OPENAI_API_KEY?.trim()) return "openai"
  return "ollama"
}

export const resolveLlmConfig = (): LlmConfig | null => {
  const provider = resolveLlmProvider()
  if (!provider) return null

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) return null
    return {
      provider: "openai",
      baseUrl: trimTrailingSlash(process.env.OPENAI_BASE_URL ?? "https://api.openai.com"),
      model: process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      apiKey,
    }
  }

  return {
    provider: "ollama",
    baseUrl: trimTrailingSlash(process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"),
    model: process.env.OLLAMA_MODEL ?? process.env.LLM_MODEL ?? "llama3.2",
  }
}

export const extractionModeForProvider = (provider: LlmProvider): ExtractionMode =>
  provider === "ollama" ? "ollama" : "openai"

export const getConfiguredExtractionMode = (): ExtractionMode => {
  const config = resolveLlmConfig()
  if (!config) return "heuristic"
  return extractionModeForProvider(config.provider)
}
