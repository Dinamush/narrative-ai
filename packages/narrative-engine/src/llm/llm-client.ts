import type { LlmConfig } from "./llm-config.js"

export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export class LlmRequestError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "LlmRequestError"
    this.status = status
  }
}

export const chatCompletionJson = async (
  config: LlmConfig,
  messages: ChatMessage[],
  options?: { temperature?: number }
): Promise<string> => {
  const url = `${config.baseUrl}/v1/chat/completions`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`
  }

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: options?.temperature ?? 0.2,
    stream: false,
  }

  if (config.provider === "openai") {
    body.response_format = { type: "json_object" }
  }

  if (config.provider === "ollama") {
    body.format = "json"
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new LlmRequestError(
      `LLM request failed (${config.provider}): ${response.status}${detail ? ` — ${detail.slice(0, 200)}` : ""}`,
      response.status
    )
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
    message?: { content?: string }
  }

  const content =
    data.choices?.[0]?.message?.content ??
    data.message?.content

  if (!content?.trim()) {
    throw new LlmRequestError(`Empty LLM response (${config.provider})`)
  }

  return content
}

export const checkLlmAvailability = async (
  config: LlmConfig
): Promise<{ ok: boolean; model?: string; error?: string }> => {
  try {
    if (config.provider === "ollama") {
      const response = await fetch(`${config.baseUrl}/api/tags`)
      if (!response.ok) {
        return { ok: false, error: `Ollama unreachable (${response.status})` }
      }
      const data = (await response.json()) as {
        models?: Array<{ name: string }>
      }
      const names = data.models?.map((m) => m.name) ?? []
      const hasModel = names.some(
        (name) => name === config.model || name.startsWith(`${config.model}:`)
      )
      if (!hasModel && names.length > 0) {
        return {
          ok: false,
          error: `Model "${config.model}" not found. Available: ${names.slice(0, 5).join(", ")}`,
        }
      }
      return { ok: true, model: config.model }
    }

    return { ok: true, model: config.model }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "LLM unavailable",
    }
  }
}
