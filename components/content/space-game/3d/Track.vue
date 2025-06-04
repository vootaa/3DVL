<script setup lang="ts">
import { inject } from 'vue'
import { gameStateManager } from '../core/GameStateManager'

import type { GameStore } from '../GameStore'
const gameStore = inject('gameStore') as GameStore

const { scale: s, track } = gameStore.mutation
const trackColor = computed(() => {
  if (gameStateManager.isBattleMode()) {
    return '#FF8C00'
  }
  else if (gameStateManager.isExploreMode()) {
    return '#20B2AA'
  }
  else {
    return '#7CFC00'
  }
})
</script>

<template>
  <TresMesh
    :geometry="track"
    :scale="[s, s, s]"
  >
    <TresMeshBasicMaterial :color="trackColor" />
  </TresMesh>
</template>