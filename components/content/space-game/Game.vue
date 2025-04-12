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

import type { GameStore } from './GameStore'

// Import Chainweb components directly
import PetersenGraphPortal from './chainweb/PetersenGraphPortal.vue'
import ChainWeb3D from './chainweb/ChainWeb3D.vue'

// Import the new composable for placement logic
import { useTrackPlacement } from './chainweb/utils/useTrackPlacement'
// Import the extracted event handlers
import { handlePortalTransition, handleAcceleration } from './chainweb/utils/eventHandlers'

// Inject gameStore
const gameStore = inject('gameStore') as GameStore

// Define target 't' parameters for portal and chainweb
const portalT = ref(0.05) // Example: Place portal early
const chainWebT = ref(0.65) // Example: Place ChainWeb3D after rings area

// Use the composable to get reactive position, rotation, and active state
const { position: portalPosition, rotation: portalRotation, active: portalActive } = useTrackPlacement(portalT)
const { position: chainwebPosition, rotation: chainwebRotation, active: chainwebActive } = useTrackPlacement(chainWebT)

// Main game loop update
// Ensure gameStore is available before using it in the loop
if (gameStore) {
    useLoop().onBeforeRender(gameStore.actions.update)
} else {
    console.error('GameStore not injected in Game.vue')
}

</script>

<template>
    <TresAmbientLight :intensity="0.25" />
    <Stars :count="1000" />
    <Track />
    <Particles />
    <Suspense fallback="{null}">
        <TresGroup>
            {/* Pass gameStore to handlers */}
            <PetersenGraphPortal v-if="portalActive && gameStore" :position="portalPosition" :rotation="portalRotation"
                :active="portalActive" @portal-entered="() => handlePortalTransition(gameStore)" />
            <Rings />
            <Enemies />
            <Planets />
            <ChainWeb3D v-if="chainwebActive && gameStore" :position="chainwebPosition" :rotation="chainwebRotation"
                :active="chainwebActive" @accelerate="() => handleAcceleration(gameStore)" />
            <Rocks />
            <Rig>
                <Ship />
            </Rig>
            <Explosions />
            <SpaceGameEffects />
        </TresGroup>
    </Suspense>
</template>