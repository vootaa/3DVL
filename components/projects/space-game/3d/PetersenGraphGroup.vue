<script setup lang="ts">
import { inject } from 'vue'
import type { GameStore } from '../GameStore'
import PetersenGraphPlane from './PetersenGraphPlane.vue'

const gameStore: GameStore = inject('gameStore') as GameStore
</script>

<template>
  <TresGroup>
    <PetersenGraphPlane
      v-for="({ position, rotation, scale }, i) of gameStore.PetersenGraphGroup"
      :key="i"
      :position="position"
      :rotation="[rotation.x, rotation.y, rotation.z]"
      :scale="scale"
    />
  </TresGroup>
</template>