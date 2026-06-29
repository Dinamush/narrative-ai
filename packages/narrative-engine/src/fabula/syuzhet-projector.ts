import type { EventNode, ReferenceLink, SceneNode } from "@narrative-ai/graph-schema"

export const projectSyuzhetReferences = (
  work: { graph: { syuzhet: { nodes: SceneNode[] } } },
  sceneEventMap: Map<string, EventNode[]>
): { referenceMap: ReferenceLink[]; updatedScenes: SceneNode[] } => {
  const referenceMap: ReferenceLink[] = []

  const updatedScenes = work.graph.syuzhet.nodes.map((scene) => {
    const events = sceneEventMap.get(scene.id) ?? []
    for (const event of events) {
      referenceMap.push({
        sceneId: scene.id,
        eventId: event.id,
        textOffset: [
          event.evidenceSpan.start - scene.textSpanRef.start,
          event.evidenceSpan.end - scene.textSpanRef.start,
        ],
      })
    }

    return {
      ...scene,
      eventIds: events.map((e) => e.id),
    }
  })

  return { referenceMap, updatedScenes }
}
