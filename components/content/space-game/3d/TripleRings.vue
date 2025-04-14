<script setup lang="ts">
import { inject } from 'vue'
import type { GameStore } from '../GameStore'
import TripleRing from './TripleRing.vue'

const gameStore: GameStore = inject('gameStore') as GameStore
</script>

<template>
    <TresGroup>
        <TripleRing v-for="{ position, rotation, scale }, i of gameStore.tripleRings" :key="i" :position="position"
            :rotation="[rotation.x, rotation.y, rotation.z]" :scale="scale" />
    </TresGroup>
</template>