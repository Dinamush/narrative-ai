import type { Chapter, SceneNode } from "@narrative-ai/graph-schema"

export type SegmentedScene = {
  scene: SceneNode
  chapterIndex: number
  chapterId: string
  chapterTitle?: string
  text: string
}

export type SegmentationResult = {
  chapters: Chapter[]
  scenes: SegmentedScene[]
}

const CHAPTER_PATTERN =
  /^(?:chapter|ch\.?|part)\s+(\d+|[IVXLCDM]+)(?:\s*[:\-.—]\s*(.+))?$/i

const SCENE_BREAK_PATTERN = /^\*{3,}$|^#{3,}$|^[-—]{3,}$/

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

export const segmentManuscript = (rawText: string): SegmentationResult => {
  if (!rawText.trim()) {
    return { chapters: [], scenes: [] }
  }

  const lines = rawText.split(/\r?\n/)
  const chapters: Chapter[] = []
  const scenes: SegmentedScene[] = []

  let chapterIndex = 0
  let chapterId = "chapter-0"
  let chapterTitle: string | undefined
  let chapterStart = 0
  let sceneBuffer: string[] = []
  let sceneStart = 0
  let syuzhetIndex = 0
  let cursor = 0

  const flushScene = () => {
    const text = sceneBuffer.join("\n").trim()
    if (!text) {
      sceneBuffer = []
      return
    }

    const sceneId = `scene-${syuzhetIndex}`
    const sceneEnd = cursor

    scenes.push({
      scene: {
        id: sceneId,
        syuzhetIndex,
        eventIds: [],
        textSpanRef: { start: sceneStart, end: sceneEnd },
      },
      chapterIndex,
      chapterId,
      chapterTitle,
      text,
    })

    syuzhetIndex += 1
    sceneBuffer = []
    sceneStart = cursor
  }

  const flushChapter = () => {
    flushScene()
    if (scenes.length === 0 && chapterStart === 0 && cursor === 0) return

    const chapterScenes = scenes
      .filter((s) => s.chapterId === chapterId)
      .map((s) => s.scene.id)

    if (chapterScenes.length > 0 || chapters.length === 0) {
      chapters.push({
        id: chapterId,
        index: chapterIndex,
        title: chapterTitle,
        sceneIds: chapterScenes,
        textSpanRef: { start: chapterStart, end: cursor },
      })
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineStart = cursor
    cursor += line.length + 1

    const trimmed = line.trim()

    if (CHAPTER_PATTERN.test(trimmed)) {
      flushChapter()
      const match = trimmed.match(CHAPTER_PATTERN)
      chapterIndex += 1
      chapterTitle = match?.[2]?.trim()
      chapterId = `chapter-${chapterIndex}${chapterTitle ? `-${slugify(chapterTitle)}` : ""}`
      chapterStart = lineStart
      sceneStart = cursor
      sceneBuffer = []
      continue
    }

    if (SCENE_BREAK_PATTERN.test(trimmed)) {
      flushScene()
      sceneStart = cursor
      continue
    }

    sceneBuffer.push(line)
  }

  flushChapter()

  if (chapters.length === 0 && scenes.length > 0) {
    chapters.push({
      id: "chapter-1",
      index: 1,
      sceneIds: scenes.map((s) => s.scene.id),
      textSpanRef: {
        start: scenes[0].scene.textSpanRef.start,
        end: scenes[scenes.length - 1].scene.textSpanRef.end,
      },
    })
    scenes.forEach((s) => {
      s.chapterIndex = 1
      s.chapterId = "chapter-1"
    })
  }

  if (chapters.length === 0 && scenes.length === 0) {
    const text = rawText.trim()
    const sceneId = "scene-0"
    scenes.push({
      scene: {
        id: sceneId,
        syuzhetIndex: 0,
        eventIds: [],
        textSpanRef: { start: 0, end: text.length },
      },
      chapterIndex: 1,
      chapterId: "chapter-1",
      text,
    })
    chapters.push({
      id: "chapter-1",
      index: 1,
      sceneIds: [sceneId],
      textSpanRef: { start: 0, end: text.length },
    })
  }

  return { chapters, scenes }
}
