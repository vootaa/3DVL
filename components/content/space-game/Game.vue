<!-- eslint-disable no-console -->
<script setup lang="ts">
import { ref, inject } from 'vue'
import { useLoop } from '@tresjs/core'
import Planets from './3d/Planets.vue'
import Stars from './3d/Stars.vue'
import Particles from './3d/Particles.vue'
import Rings from './3d/Rings.vue'
import Enemies from './3d/Enemies.vue'
import Rocks from './3d/Rocks.vue'
import Track from './3d/Track.vue'
import Explosions from './3d/Explosions.vue'
import Rig from './3d/Rig.vue'
import Ship from './3d/Ship.vue'
import SpaceGameEffects from './3d/SpaceGameEffects.vue'
import { gameStore } from './GameStore'
import * as audio from './audio' // Import audio functions

// Import Chainweb components directly
import PetersenGraphPortal from './chainweb/PetersenGraphPortal.vue'
import ChainWeb3D from './chainweb/ChainWeb3D.vue'

// Import the new composable for placement logic
import { useTrackPlacement } from './utils/useTrackPlacement'

// Define target 't' parameters for portal and chainweb
const portalT = ref(0.05) // Example: Place portal early
const chainWebT = ref(0.65) // Example: Place ChainWeb3D after rings area

// Use the composable to get reactive position, rotation, and active state
const { position: portalPosition, rotation: portalRotation, active: portalActive } = useTrackPlacement(portalT)
const { position: chainwebPosition, rotation: chainwebRotation, active: chainwebActive } = useTrackPlacement(chainWebT)

// --- Event Handlers ---
const handlePortalTransition = () => {
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

const handleAcceleration = () => {
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
// --- End Event Handlers ---

// Main game loop update
useLoop().onBeforeRender(gameStore.actions.update)
</script>

<template>
    <TresAmbientLight :intensity="0.25" />
    <Stars :count="1000" />
    <Track />
    <Particles />
    <Suspense fallback="{null}">
        <TresGroup>
            <PetersenGraphPortal v-if="portalActive" :position="portalPosition" :rotation="portalRotation"
                :active="portalActive" @portal-entered="handlePortalTransition" />
            <Rings />
            <Enemies />
            <Planets />
            <ChainWeb3D v-if="chainwebActive" :position="chainwebPosition" :rotation="chainwebRotation"
                :active="chainwebActive" @accelerate="handleAcceleration" />
            <Rocks />
            <Rig>
                <Ship />
            </Rig>
            <Explosions />
            <SpaceGameEffects />
        </TresGroup>
    </Suspense>
</template>