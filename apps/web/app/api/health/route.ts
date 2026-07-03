import { APP_CODENAME, APP_VERSION, GRAPH_SCHEMA_VERSION } from "@/lib/app-meta"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: "narrative-ai",
    version: APP_VERSION,
    codename: APP_CODENAME,
    schemaVersion: GRAPH_SCHEMA_VERSION,
    repository: "https://github.com/Dinamush/narrative-ai",
  })
}
