<script setup lang="ts">
import { inject } from 'vue'
import type { GameStore } from '../GameStore'
import { GameMode, ObservationMode } from '../GameStore'

const gameStore = inject('gameStore') as GameStore
const { scale: s, track } = gameStore.mutation
const trackColor = computed(() => {
  if (gameStore.gameMode === GameMode.Battle) {
    return '#FF8C00'
  }
  else if (gameStore.observationMode !== ObservationMode.None) {
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