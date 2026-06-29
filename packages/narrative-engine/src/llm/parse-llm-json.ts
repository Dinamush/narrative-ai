export const parseLlmJson = <T>(raw: string): T => {
  const trimmed = raw.trim()

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i)
  const body = fenced ? fenced[1].trim() : trimmed

  const objectStart = body.indexOf("{")
  const objectEnd = body.lastIndexOf("}")
  if (objectStart >= 0 && objectEnd > objectStart) {
    return JSON.parse(body.slice(objectStart, objectEnd + 1)) as T
  }

  const arrayStart = body.indexOf("[")
  const arrayEnd = body.lastIndexOf("]")
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return JSON.parse(body.slice(arrayStart, arrayEnd + 1)) as T
  }

  return JSON.parse(body) as T
}
