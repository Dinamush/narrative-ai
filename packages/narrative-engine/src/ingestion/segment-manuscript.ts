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

/** Strong breaks: ---, ***, ###. Weak breaks: -- on its own line (literary beat). */
const SCENE_BREAK_PATTERN = /^\*{3,}$|^#{3,}$|^[-—–]{2,}$/

const TIME_JUMP_OPENER =
  /^(?:some time later|later,?|days? passed|hours? later|that (?:evening|morning|night)|the next (?:day|morning|evening)|weeks? later|months? later|years? later|one rainy afternoon|blackness hung)\b/i

const STAGE_DIRECTION =
  /^(?:\*{0,2}(?:CHORUS|SCENE\s+\d+|ACT\s+[IVX\d]+|INTERLUDE|EPILOGUE)\s*[:\*]|\([^)]*(?:wash|fade|cut to|int\.|ext\.)|Scene\s+\d+\s+after\s+)/i

const MAX_SCENE_WORDS = 900

const countWords = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const splitOversizedSceneText = (text: string): string[] => {
  if (countWords(text) <= MAX_SCENE_WORDS) return [text]

  const byWeakBreak = text.split(/\n\s*[-—–]{2,}\s*\n/).map((p) => p.trim()).filter(Boolean)
  if (byWeakBreak.length > 1) return byWeakBreak

  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  if (paragraphs.length <= 1) return [text]

  const chunks: string[] = []
  let buffer: string[] = []
  let bufferWords = 0

  for (const paragraph of paragraphs) {
    const words = countWords(paragraph)
    if (bufferWords + words > MAX_SCENE_WORDS && buffer.length > 0) {
      chunks.push(buffer.join("\n\n"))
      buffer = [paragraph]
      bufferWords = words
      continue
    }
    buffer.push(paragraph)
    bufferWords += words
  }

  if (buffer.length > 0) chunks.push(buffer.join("\n\n"))
  return chunks.length > 0 ? chunks : [text]
}

const rebalanceOversizedScenes = (scenes: SegmentedScene[]): SegmentedScene[] => {
  const expanded: SegmentedScene[] = []

  for (const scene of scenes) {
    const parts = splitOversizedSceneText(scene.text)
    if (parts.length === 1) {
      expanded.push(scene)
      continue
    }

    let offset = scene.scene.textSpanRef.start
    for (const part of parts) {
      expanded.push({
        ...scene,
        scene: {
          ...scene.scene,
          id: `scene-${expanded.length}`,
          syuzhetIndex: expanded.length,
          eventIds: [],
          textSpanRef: { start: offset, end: offset + part.length },
        },
        text: part,
      })
      offset += part.length + 1
    }
  }

  return expanded.map((s, index) => ({
    ...s,
    scene: { ...s.scene, id: `scene-${index}`, syuzhetIndex: index },
  }))
}

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
  let pendingDiscourseOp: SceneNode["discourseOps"] | undefined

  const flushScene = () => {
    const text = sceneBuffer.join("\n").trim()
    if (!text) {
      sceneBuffer = []
      pendingDiscourseOp = undefined
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
        discourseOps: pendingDiscourseOp,
      },
      chapterIndex,
      chapterId,
      chapterTitle,
      text,
    })

    syuzhetIndex += 1
    sceneBuffer = []
    sceneStart = cursor
    pendingDiscourseOp = undefined
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
    const prevBlank = i === 0 || !lines[i - 1]?.trim()
    const nextBlank = i === lines.length - 1 || !lines[i + 1]?.trim()

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

    if (SCENE_BREAK_PATTERN.test(trimmed) && (prevBlank || nextBlank || trimmed.length <= 4)) {
      flushScene()
      sceneStart = cursor
      continue
    }

    if (prevBlank && sceneBuffer.length > 0) {
      if (TIME_JUMP_OPENER.test(trimmed)) {
        flushScene()
        sceneStart = lineStart
        pendingDiscourseOp = ["ellipsis"]
      } else if (STAGE_DIRECTION.test(trimmed)) {
        flushScene()
        sceneStart = lineStart
      }
    }

    sceneBuffer.push(line)
  }

  flushChapter()

  let finalScenes = rebalanceOversizedScenes(scenes)

  if (chapters.length === 0 && finalScenes.length > 0) {
    chapters.push({
      id: "chapter-1",
      index: 1,
      sceneIds: finalScenes.map((s) => s.scene.id),
      textSpanRef: {
        start: finalScenes[0].scene.textSpanRef.start,
        end: finalScenes[finalScenes.length - 1].scene.textSpanRef.end,
      },
    })
    finalScenes = finalScenes.map((s) => ({
      ...s,
      chapterIndex: 1,
      chapterId: "chapter-1",
    }))
  }

  if (chapters.length === 0 && finalScenes.length === 0) {
    const text = rawText.trim()
    finalScenes = [
      {
        scene: {
          id: "scene-0",
          syuzhetIndex: 0,
          eventIds: [],
          textSpanRef: { start: 0, end: text.length },
        },
        chapterIndex: 1,
        chapterId: "chapter-1",
        text,
      },
    ]
    chapters.push({
      id: "chapter-1",
      index: 1,
      sceneIds: ["scene-0"],
      textSpanRef: { start: 0, end: text.length },
    })
  }

  if (chapters.length > 0 && finalScenes.length > 0) {
    const chapterSceneIds = finalScenes.map((s) => s.scene.id)
    chapters[0] = {
      ...chapters[0],
      sceneIds: chapterSceneIds,
      textSpanRef: {
        start: finalScenes[0].scene.textSpanRef.start,
        end: finalScenes[finalScenes.length - 1].scene.textSpanRef.end,
      },
    }
  }

  return { chapters, scenes: finalScenes }
}
