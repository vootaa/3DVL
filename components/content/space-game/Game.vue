<script setup lang="ts">
import { useLoop } from '@tresjs/core'

import { Logger } from '../logger'

import Planets from './3d/Planets.vue'
import Stars from './3d/Stars.vue'
import Particles from './3d/Particles.vue'
import Rings from './3d/Rings.vue'
import Chainweb3D from './3d/Chainweb3D.vue'
import PetersenGraphGroup from './3d/PetersenGraphGroup.vue'
import InfoLabels from './3d/InfoLabels.vue'
import Rocks from './3d/Rocks.vue'
import Track from './3d/Track.vue'
import Explosions from './3d/Explosions.vue'
import Rig from './3d/Rig.vue'
import Ship from './3d/Ship.vue'
import SpaceObjects from './3d/SpaceObjects.vue'
import SpaceGameEffects from './3d/SpaceGameEffects.vue'

import { gameStore } from './GameStore'

if (gameStore) {
  useLoop().onBeforeRender(gameStore.actions.update)
  Logger.log('GAME', 'Game loop initialized with gameStore update handler')
} else {
  Logger.error('GAME', 'GameStore not injected in Game.vue', {
    gameStoreType: typeof gameStore,
    gameStoreValue: gameStore
  })
}
</script>

<template>
  <TresAmbientLight :intensity="0.25" />
  <Stars :count="300" />
  <Track />
  <Particles />
  <Suspense fallback="{null}">
    <TresGroup>
      <Rings />
      <Chainweb3D />
      <PetersenGraphGroup />
      <InfoLabels />
      <Planets />
      <Rocks />
      <SpaceObjects />
      <Rig>
        <Ship />
      </Rig>
      <Explosions />
      <SpaceGameEffects />
    </TresGroup>
  </Suspense>
</template>