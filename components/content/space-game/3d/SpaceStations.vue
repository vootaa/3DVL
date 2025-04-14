<script setup lang="ts">
import { inject } from 'vue'
import type { GameStore } from '../GameStore'
import SpaceStation from './SpaceStation.vue'

const gameStore: GameStore = inject('gameStore') as GameStore
const { position, rotation, scale } = gameStore.spaceStation
</script>

<template>
    <TresGroup>
        <SpaceStation :position="position" :rotation="[rotation.x, rotation.y, rotation.z]" :scale="scale" />
    </TresGroup>
</template>