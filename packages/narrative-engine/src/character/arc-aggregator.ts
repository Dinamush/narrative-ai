import type {
  ArcShape,
  CharacterArcMetrics,
  CharacterNode,
  CharacterStateSnapshot,
  NarrativePosition,
  NarrativeWork,
} from "@narrative-ai/graph-schema"

const ema = (values: number[], alpha = 0.35): number[] => {
  if (values.length === 0) return []
  const out = [values[0]]
  for (let i = 1; i < values.length; i++) {
    out.push(alpha * values[i] + (1 - alpha) * out[i - 1])
  }
  return out
}

const classifyArcShape = (series: number[]): ArcShape => {
  if (series.length < 3) return "flat"
  const first = series.slice(0, Math.ceil(series.length / 3))
  const last = series.slice(-Math.ceil(series.length / 3))
  const mid = series.slice(Math.floor(series.length / 3), Math.ceil((2 * series.length) / 3))

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1)
  const start = avg(first)
  const middle = avg(mid)
  const end = avg(last)
  const delta = end - start

  if (Math.abs(delta) < 0.08) return "flat"
  if (middle < start && middle < end && end - middle > 0.1) return "u_shape"
  if (Math.max(...series) - Math.min(...series) < 0.15) return "oscillating"
  return delta > 0 ? "rise" : "fall"
}

const findTurningPoints = (sceneIds: string[], series: number[]): string[] => {
  const points: string[] = []
  for (let i = 1; i < series.length - 1; i++) {
    const prev = series[i - 1]
    const curr = series[i]
    const next = series[i + 1]
    if (Math.abs(curr - prev) > 0.12 && Math.abs(curr - next) > 0.12) {
      points.push(sceneIds[i])
    }
  }
  return points.slice(0, 5)
}

export const aggregateCharacterArcs = (
  nodes: CharacterNode[]
): CharacterNode[] => {
  const now = new Date().toISOString()

  return nodes.map((node) => {
    const snapshots = [...node.stateSnapshots].sort(
      (a, b) => a.position.syuzhetIndex - b.position.syuzhetIndex
    )

    if (snapshots.length === 0) return node

    const sceneIds = snapshots.map((s) => s.position.sceneId)
    const differentiation = snapshots.map((s) => s.egoQuest?.profile
      ? (s.egoQuest.profile as { differentiation?: { score?: number } }).differentiation?.score ?? 0.5
      : s.affect.valence * 0.5 + 0.25)
    const shadowIntensity = snapshots.map((s) => s.egoQuest?.profile
      ? (s.egoQuest.profile as { shadow?: { intensity?: number } }).shadow?.intensity ?? 0
      : Math.max(0, -s.affect.valence) * s.affect.arousal)
    const driverStability = snapshots.map((s) => s.egoQuest?.profile
      ? (s.egoQuest.profile as { driver?: { stability?: number } }).driver?.stability ?? 0.5
      : 0.5)
    const circumstanceActor = snapshots.map((s) => s.affect.circumstanceAsActor)
    const circumstanceExperiencer = snapshots.map((s) => s.affect.circumstanceAsExperiencer)

    const smoothedDiff = ema(differentiation)
    const arcShape = classifyArcShape(smoothedDiff)
    const turningPointSceneIds = findTurningPoints(sceneIds, smoothedDiff)

    let shadowPeakSceneId: string | undefined
    let maxShadow = -1
    for (let i = 0; i < shadowIntensity.length; i++) {
      if (shadowIntensity[i] > maxShadow) {
        maxShadow = shadowIntensity[i]
        shadowPeakSceneId = sceneIds[i]
      }
    }

    const arcMetrics: CharacterArcMetrics = {
      characterId: node.id,
      arcShape,
      turningPointSceneIds,
      uedDisplacementPeak: Math.max(...differentiation) - Math.min(...differentiation),
      uedDisplacementLength: differentiation.length,
      actionDivergenceByChapter: undefined,
      egoQuestArc: {
        differentiationStart: differentiation[0] ?? 0.5,
        differentiationEnd: differentiation[differentiation.length - 1] ?? 0.5,
        shadowPeakSceneId,
        driverStabilityMean:
          driverStability.reduce((a, b) => a + b, 0) / Math.max(driverStability.length, 1),
      },
      computedAt: now,
    }

    return {
      ...node,
      arcMetrics,
      arcTrajectory: {
        differentiation: smoothedDiff,
        shadowIntensity,
        driverStability,
        circumstanceActor,
        circumstanceExperiencer,
        sceneIds,
      },
    }
  })
}

export const buildCharacterInsights = (
  nodes: CharacterNode[]
): NarrativeWork["analysis"]["characterInsights"] =>
  nodes
    .filter((n) => n.stateSnapshots.length > 0)
    .map((node) => {
      const latest = node.stateSnapshots[node.stateSnapshots.length - 1]
      const egoLines = latest.egoQuest?.dominantMechanisms ?? []
      const keyTensions =
        latest.egoQuest?.profile &&
        typeof latest.egoQuest.profile === "object" &&
        "internalTensions" in latest.egoQuest.profile
          ? (latest.egoQuest.profile.internalTensions as string[])
          : []

      return {
        characterId: node.id,
        summary: `${node.name} appears in ${node.stateSnapshots.length} scene${node.stateSnapshots.length === 1 ? "" : "s"} with ${node.role ?? "unknown"} role.`,
        arcType: node.arcMetrics?.arcShape,
        arcShape: node.arcMetrics?.arcShape,
        keyTensions,
        majorTurningPoints: node.arcMetrics?.turningPointSceneIds ?? [],
        stateDeltaHighlights: egoLines.slice(0, 3),
      }
    })

export const computeDeltaFromPrior = (
  prior: CharacterStateSnapshot,
  current: CharacterStateSnapshot
): CharacterStateSnapshot["deltaFromPrior"] => {
  const beliefRevisions: string[] = []
  const goalChanges: string[] = []

  const priorGoals = new Set(prior.goals.map((g) => g.text))
  for (const goal of current.goals) {
    if (!priorGoals.has(goal.text)) goalChanges.push(goal.text)
  }

  const priorKnowledge = new Set(prior.knowledge.map((k) => k.text))
  for (const k of current.knowledge) {
    if (!priorKnowledge.has(k.text)) beliefRevisions.push(k.text)
  }

  return {
    priorSnapshotId: prior.id,
    beliefRevisions,
    goalChanges,
    relationshipShifts: [],
    egoQuestShifts: [],
  }
}

export type SceneContext = {
  sceneId: string
  position: NarrativePosition
  sceneText: string
  textOffsetStart: number
}
