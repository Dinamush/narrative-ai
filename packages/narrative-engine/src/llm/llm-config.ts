export type LlmProvider = "ollama" | "openai"

export type LlmConfig = {
  provider: LlmProvider
  baseUrl: string
  model: string
  apiKey?: string
  /** Sampling temperature — reasoning models need higher temps */
  temperature?: number
  /** Cap generation length (Ollama `num_predict`) */
  maxTokens?: number
}

export type ExtractionMode = "heuristic" | "ollama" | "openai"

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, "")

const REASONING_MODEL_PATTERN =
  /qwythos|qwen3\.?5|deepseek-r1|reasoning|mythos/i

export const isReasoningModel = (model: string) =>
  REASONING_MODEL_PATTERN.test(model)

export const samplingForModel = (model: string) => {
  if (isReasoningModel(model)) {
    return { temperature: 0.6, maxTokens: 8192 }
  }
  return { temperature: 0.2, maxTokens: 4096 }
}

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
    const model = process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini"
    const sampling = samplingForModel(model)
    return {
      provider: "openai",
      baseUrl: trimTrailingSlash(process.env.OPENAI_BASE_URL ?? "https://api.openai.com"),
      model,
      apiKey,
      ...sampling,
    }
  }

  const model =
    process.env.OLLAMA_MODEL ?? process.env.LLM_MODEL ?? "llama3.2"
  const sampling = samplingForModel(model)
  return {
    provider: "ollama",
    baseUrl: trimTrailingSlash(process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"),
    model,
    ...sampling,
  }
}

export const extractionModeForProvider = (provider: LlmProvider): ExtractionMode =>
  provider === "ollama" ? "ollama" : "openai"

export const getConfiguredExtractionMode = (): ExtractionMode => {
  const config = resolveLlmConfig()
  if (!config) return "heuristic"
  return extractionModeForProvider(config.provider)
}
