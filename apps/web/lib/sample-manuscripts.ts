export type SampleManuscript = {
  id: string
  slug: string
  title: string
  description: string
  genre: string
  sceneHint: string
  publicPath: string
}

export const SAMPLE_MANUSCRIPTS: SampleManuscript[] = [
  {
    id: "sample-the-last-light",
    slug: "the-last-light",
    title: "The Last Light",
    description:
      "A storm threatens a coastal village. Elena, Marcus, and Thomas race to restore the lighthouse beam before the supply boat is lost.",
    genre: "Literary drama",
    sceneHint: "7 scenes · 3 chapters",
    publicPath: "/samples/the-last-light.md",
  },
  {
    id: "sample-ward-rounds",
    slug: "ward-rounds",
    title: "Ward Rounds",
    description:
      "A short hospital vignette. Dr. Amara Singh faces a ventilator crisis and must choose between protocol and a child's life.",
    genre: "Medical fiction",
    sceneHint: "3 scenes · 2 chapters",
    publicPath: "/samples/ward-rounds.md",
  },
]

export const getSampleById = (id: string) =>
  SAMPLE_MANUSCRIPTS.find((s) => s.id === id)

export const isSampleProjectId = (id: string) =>
  SAMPLE_MANUSCRIPTS.some((s) => s.id === id)
