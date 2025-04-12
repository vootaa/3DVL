import { ref, watch, inject, type Ref } from 'vue'
import { Vector3, Euler, Matrix4 } from 'three'
import type { GameStore } from '../../GameStore'

/**
 * Calculates position, rotation, and active state for an object placed on the game track.
 * @param targetT Reactive ref to the target 't' parameter (0 to 1) on the track.
 * @param activationRange The range around targetT (+/-) where the object is considered active.
 * @returns Reactive refs for position, rotation, and active state.
 */
export function useTrackPlacement(targetT: Ref<number>, activationRange: number = 0.15) {
    const gameStore = inject('gameStore') as GameStore
    const position = ref(new Vector3())
    const rotation = ref(new Euler())
    const active = ref(false)

    const calculatePlacement = (t: number) => {
        if (!gameStore?.mutation?.track) {
            return { pos: new Vector3(), rot: new Euler() }
        }
        const track = gameStore.mutation.track
        const scale = gameStore.mutation.scale
        const path = track.parameters.path

        const pos = path.getPointAt(t)
        pos.multiplyScalar(scale)

        // Calculate rotation to align with track
        const segments = track.tangents.length
        const pickt = t * segments
        const pick = Math.floor(pickt) % segments // Ensure pick is within bounds
        const lookAtT = (t + 1 / path.getLength()) % 1 // Ensure lookAtT wraps around
        const lookAt = path.getPointAt(lookAtT).multiplyScalar(scale)

        // Use lookAt to determine rotation
        const direction = new Vector3().subVectors(lookAt, pos).normalize()
        // Ensure binormal index is valid
        const up = track.binormals[pick] || new Vector3(0, 1, 0)

        // Create rotation from direction and up vector
        const matrix = new Matrix4().lookAt(pos, lookAt, up)
        const rot = new Euler().setFromRotationMatrix(matrix)

        return { pos, rot }
    }

    watch([() => gameStore?.mutation?.t, targetT], ([playerT, currentTargetT]) => {
        if (playerT === undefined || currentTargetT === undefined || !gameStore?.mutation?.track) {
            active.value = false
            return
        }

        // Calculate current position and rotation based on targetT
        const { pos, rot } = calculatePlacement(currentTargetT)
        position.value.copy(pos)
        rotation.value.copy(rot)

        // Check activation based on player proximity
        const diff = Math.abs(playerT - currentTargetT)
        const distance = Math.min(diff, 1 - diff) // Handle wrap-around distance
        active.value = distance < activationRange

    }, { immediate: true }) // immediate: true to calculate initial state

    return { position, rotation, active }
}