import { InteractionPrompt } from './hud/InteractionPrompt'
import type { RoomSceneProps } from '@/features/planner/scene/sceneContract'
import { useRoomSceneRuntime } from '@/features/planner/scene/useRoomSceneRuntime'
import { useRoomSceneSync } from '@/features/planner/scene/useRoomSceneSync'

export function RoomScene(props: RoomSceneProps) {
  const {
    containerRef,
    interactionPrompt,
    stateRef,
    engineRef,
    modeRef,
    activeRoomRef,
    walkRef,
    immersiveRef,
    interactionSystemRef,
    publishInteractionPrompt,
  } = useRoomSceneRuntime(props)
  useRoomSceneSync(props, {
    stateRef,
    engineRef,
    modeRef,
    activeRoomRef,
    walkRef,
    immersiveRef,
    interactionSystemRef,
    publishInteractionPrompt,
  })

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
      <InteractionPrompt action={interactionPrompt} />
    </div>
  )
}
