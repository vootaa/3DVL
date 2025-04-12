import type { GameStore } from '../../GameStore'
import * as audio from '../../audio'

export const handlePortalTransition = (gameStore: GameStore) => {
    if (!gameStore) return
    // Visual transition effect
    gameStore.actions.playAudio(audio.warp, 0.7)

    const originalFov = gameStore.mutation.fov
    gameStore.mutation.fov = originalFov * 1.2

    // Return to normal after transition
    setTimeout(() => {
        if (gameStore) gameStore.mutation.fov = originalFov
    }, 1500)
}

export const handleAcceleration = (gameStore: GameStore) => {
    if (!gameStore) return
    // Similar to warp effect in GameStore.ts
    gameStore.actions.playAudio(audio.warp)

    // Store original values
    const originalFov = gameStore.mutation.fov
    const originalLooptime = gameStore.mutation.looptime

    // Increase speed by reducing looptime and increasing FOV
    gameStore.mutation.looptime = originalLooptime * 0.8
    gameStore.mutation.fov = originalFov * 1.3

    // Return to normal after 2 seconds
    setTimeout(() => {
        if (gameStore) {
            gameStore.mutation.looptime = originalLooptime
            gameStore.mutation.fov = originalFov
        }
    }, 2000)
}