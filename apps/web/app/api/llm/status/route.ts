import {
  checkLlmAvailability,
  getConfiguredExtractionMode,
  resolveLlmConfig,
} from "@/lib/llm-server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const config = resolveLlmConfig()

  if (!config) {
    return NextResponse.json({
      configured: false,
      extractionMode: getConfiguredExtractionMode(),
      message: "LLM disabled — using heuristic extraction",
    })
  }

  const availability = await checkLlmAvailability(config)

  return NextResponse.json({
    configured: true,
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl,
    extractionMode: getConfiguredExtractionMode(),
    available: availability.ok,
    error: availability.error,
  })
}
