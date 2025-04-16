<script setup lang="ts">
import { inject } from 'vue'
import type { GameStore } from '../GameStore'
import { GameMode } from '../GameStore'

const gameStore = inject('gameStore') as GameStore
const { scale: s, track } = gameStore.mutation
const trackColor = computed(() =>
  gameStore.gameMode === GameMode.Battle ? 'indianred' : 'dodgerblue'
)
</script>

<template>
  <TresMesh :geometry="track" :scale="[s, s, s]">
    <TresMeshBasicMaterial :color="trackColor" />
  </TresMesh>
</template>