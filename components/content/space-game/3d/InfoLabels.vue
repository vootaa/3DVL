<script setup lang="ts">
import { inject } from 'vue'
import { gameStateManager } from '../core/GameStateManager'

import TextPlane from './TextPlane.vue'

import type { GameStore } from '../GameStore'
const gameStore = inject('gameStore') as GameStore
</script>

<template>
  <TresGroup v-if="gameStateManager.canShowInfoTextMode() && gameStore.showInfoText">
    <TextPlane
      v-for="(label, i) of gameStore.infoLabels"
      :key="i"
      :position="label.position"
      :rotation="[label.rotation.x, label.rotation.y, label.rotation.z]"
      :scale="label.scale"
      :text="label.text"
      :color="label.color"
    />
  </TresGroup>
</template>