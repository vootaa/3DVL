<script setup lang="ts">
import { inject } from 'vue'
import type { GameStore } from '../GameStore'
import PetersenPlasmaGraph from './PetersenPlasmaGraph.vue'

const gameStore: GameStore = inject('gameStore') as GameStore
</script>

<template>
    <TresGroup>
        <PetersenPlasmaGraph v-for="({ position, rotation, scale }, i) of gameStore.PetersenPlasmaGraph" :key="i"
            :position="position" :rotation="[rotation.x, rotation.y, rotation.z]" :scale="scale" :plane-size="2" />
    </TresGroup>
</template>