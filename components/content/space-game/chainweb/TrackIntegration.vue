<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { Vector3, MathUtils } from 'three'
import { useGameStore } from '../GameStore'
import PetersenGraphPortal from './PetersenGraphPortal.vue'
import ChainWeb3D from './ChainWeb3D.vue'

const props = defineProps({
    portalPosition: {
        type: Number,
        default: 0.05, // t parameter for the starting portal
    },
    chainWebPosition: {
        type: Number,
        default: 0.65, // t parameter for the ChainWeb3D (after rings)
    },
    numPortals: {
        type: Number,
        default: 1,
    },
    numChainWebs: {
        type: Number,
        default: 3,
    }
})

const gameStore = useGameStore()
const portals = ref<Array<{ position: Vector3, rotation: any, scale: number, active: boolean }>>([])
const chainWebs = ref<Array<{ position: Vector3, rotation: any, scale: number, active: boolean }>>([])

// Track player position for performance optimizations
const playerT = computed(() => gameStore.mutation.t)

// Generate positions based on track t parameter (similar to randomRings in GameStore)
function generatePositionFromT(t: number) {
    const track = gameStore.mutation.track
    const pos = track.parameters.path.getPointAt(t)
    pos.multiplyScalar(gameStore.mutation.scale)

    // Calculate rotation to align with track
    const segments = track.tangents.length
    const pickt = t * segments
    const pick = Math.floor(pickt)
    const lookAt = track.parameters.path.getPointAt((t + 1 / track.parameters.path.getLength()) % 1)
        .multiplyScalar(gameStore.mutation.scale)

    // Use lookAt to determine rotation
    const direction = new Vector3().subVectors(lookAt, pos).normalize()
    const up = track.binormals[pick] || new Vector3(0, 1, 0)

    // Create rotation from direction and up vector
    const matrix = new Matrix4().lookAt(pos, lookAt, up)
    const rotation = new Euler().setFromRotationMatrix(matrix)

    return {
        position: pos,
        rotation,
        scale: 25 // Base scale
    }
}

onMounted(() => {
    // Create portals at the beginning of the track
    for (let i = 0; i < props.numPortals; i++) {
        const t = props.portalPosition + (i * 0.01) // Small spacing between multiple portals if needed
        const portalData = generatePositionFromT(t)
        portals.value.push({
            ...portalData,
            active: true
        })
    }

    // Create ChainWeb3D visualizations after rings
    for (let i = 0; i < props.numChainWebs; i++) {
        const t = props.chainWebPosition + (i * 0.05) // More spacing between ChainWeb visualizations
        const chainWebData = generatePositionFromT(t)
        chainWebs.value.push({
            ...chainWebData,
            scale: chainWebData.scale * (1 + i * 0.2), // Increase scale for each subsequent chainweb
            active: true
        })
    }
})

// Optimization: Update active state based on player proximity
watch(playerT, (newT) => {
    // Only activate objects that are nearby the player (within ±0.15 on t parameter)
    portals.value.forEach((portal, index) => {
        const portalT = props.portalPosition + (index * 0.01)
        portal.active = Math.abs(newT - portalT) < 0.15 ||
            Math.abs(newT - portalT + 1) < 0.15 ||
            Math.abs(newT - portalT - 1) < 0.15 // Handle loop around
    })

    chainWebs.value.forEach((chainWeb, index) => {
        const chainWebT = props.chainWebPosition + (index * 0.05)
        chainWeb.active = Math.abs(newT - chainWebT) < 0.15 ||
            Math.abs(newT - chainWebT + 1) < 0.15 ||
            Math.abs(newT - chainWebT - 1) < 0.15 // Handle loop around
    })
})

// Handle acceleration effect to update GameStore
const handleAcceleration = () => {
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
        gameStore.mutation.looptime = originalLooptime
        gameStore.mutation.fov = originalFov
    }, 2000)
}

// Handle portal transition effect
const handlePortalTransition = () => {
    // Visual transition effect
    gameStore.actions.playAudio(audio.warp, 0.7)

    const originalFov = gameStore.mutation.fov
    gameStore.mutation.fov = originalFov * 1.2

    // Return to normal after transition
    setTimeout(() => {
        gameStore.mutation.fov = originalFov
    }, 1500)
}

// Import audio for effects
import * as audio from '../audio'
import { Matrix4, Euler } from 'three'
</script>

<template>
    <TresObject3D>
        <!-- Portals at game start -->
        <template v-for="(portal, index) in portals" :key="`portal-${index}`">
            <PetersenGraphPortal v-if="portal.active" :position="portal.position" :rotation="portal.rotation"
                :scale="portal.scale" @portal-entered="handlePortalTransition" />
        </template>

        <!-- ChainWeb3D after rings -->
        <template v-for="(chainWeb, index) in chainWebs" :key="`chainweb-${index}`">
            <ChainWeb3D v-if="chainWeb.active" :position="chainWeb.position" :rotation="chainWeb.rotation"
                :scale="chainWeb.scale" @accelerate="handleAcceleration" />
        </template>
    </TresObject3D>
</template>
