<script setup lang="ts">
import { inject } from 'vue'
import type { GameStore } from '../GameStore'
import SpaceStation from './SpaceStation.vue'
import SpaceProbe from './SpaceProbe.vue'

const gameStore: GameStore = inject('gameStore') as GameStore
const stationData = gameStore.spaceStation
const probeData = gameStore.spaceProbe
</script>

<template>
  <TresGroup>
    <SpaceStation
      :position="stationData.position"
      :rotation="[stationData.rotation.x, stationData.rotation.y, stationData.rotation.z]"
      :scale="stationData.scale"
    />
    <SpaceProbe
      :position="probeData.position"
      :rotation="[probeData.rotation.x, probeData.rotation.y, probeData.rotation.z]"
      :scale="probeData.scale"
    />
  </TresGroup>
</template>