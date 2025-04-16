<script setup lang="ts">
import { inject, computed } from 'vue'
import type { GameStore } from '../GameStore'
import { GameMode } from '../GameStore'
import TextPlane from './TextPlane.vue'

const gameStore: GameStore = inject('gameStore') as GameStore

const showLabels = computed(() => {
    return gameStore.gameMode === GameMode.Explore && gameStore.showInfoText
})
</script>

<template>
    <TresGroup v-if="showLabels">
        <TextPlane v-for="(label, i) of gameStore.infoLabels" :key="i" :position="label.position"
            :rotation="[label.rotation.x, label.rotation.y, label.rotation.z]" :scale="label.scale" :text="label.text"
            :color="label.color" />
    </TresGroup>
</template>