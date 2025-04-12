<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Vector3 } from 'three'
import { useGameStore } from '../GameStore'
import PetersenGraphPortal from './PetersenGraphPortal.vue'
import ChainWeb3D from './ChainWeb3D.vue'

const gameStore = useGameStore()
const portalTransitionActive = ref(false)
const accelerationActive = ref(false)

// Compute positions based on track t parameter
const portalPosition = ref(new Vector3())
const chainWebPosition = ref(new Vector3())

onMounted(() => {
    // Get the position for the starting point (t ≈ 0.0)
    const portalT = 0.0
    portalPosition.value = getPositionFromTrack(portalT)

    // Get the position after Rings sequence (t ≈ 0.6-0.75)
    const chainWebT = 0.65
    chainWebPosition.value = getPositionFromTrack(chainWebT)
})

// Calculate position based on track t parameter (similar to Rings.vue)
function getPositionFromTrack(t: number) {
    const pos = gameStore.mutation.track.parameters.path.getPointAt(t)
    pos.multiplyScalar(gameStore.mutation.scale)
    return pos
}

// Handle portal transition effect
const handlePortalTransition = () => {
    portalTransitionActive.value = true

    // Visual transition effect - could be FOV change, color shift, etc.
    const originalFov = gameStore.mutation.fov
    gameStore.mutation.fov = originalFov * 1.2

    // Return to normal after transition
    setTimeout(() => {
        gameStore.mutation.fov = originalFov
        portalTransitionActive.value = false
    }, 1500)
}

// Handle acceleration effect
const handleAcceleration = () => {
    accelerationActive.value = true

    // Additional effects beyond what's already in ChainWeb3D
    // Could add camera shake, particle effects, etc.

    setTimeout(() => {
        accelerationActive.value = false
    }, 2000)
}
</script>

<template>
    <!-- Portal at game start -->
    <PetersenGraphPortal :position="portalPosition" :scale="30" :active="!portalTransitionActive"
        @portal-entered="handlePortalTransition" />

    <!-- 3D ChainWeb after rings -->
    <ChainWeb3D :position="chainWebPosition" :scale="30" :active="!accelerationActive"
        @accelerate="handleAcceleration" />
</template>
