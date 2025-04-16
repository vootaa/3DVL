<script setup lang="ts">
import { inject } from 'vue'
import type { GameStore } from '../GameStore'
import TripleRing from './TripleRing.vue'

const gameStore: GameStore = inject('gameStore') as GameStore

const ringRefs = ref<any[]>([]);
const showConnectionsOption = ref(true);

onMounted(() => {
    ringRefs.value = new Array(gameStore.tripleRings.length).fill(null);
});

function shouldShowLayerConnections(index: number): boolean {
    return showConnectionsOption.value && index < gameStore.tripleRings.length - 1;
}

function getNextLayerPosition(index: number): [number, number, number] {
    if (index >= gameStore.tripleRings.length - 1) {
        return [0, 0, 0];
    }

    return gameStore.tripleRings[index + 1].position;
}

function getNextLayerRotation(index: number): [number, number, number] {
    if (index >= gameStore.tripleRings.length - 1) {
        return [0, 0, 0];
    }

    const rotation = gameStore.tripleRings[index + 1].rotation;
    return [rotation.x, rotation.y, rotation.z];
}

function getNextLayerScale(index: number): number {
    if (index >= gameStore.tripleRings.length - 1) {
        return 1;
    }

    return gameStore.tripleRings[index + 1].scale;
}

function getConnectionColor(index: number): string {
    const colors = ['#ffffff', '#e0e0ff', '#c0c0ff', '#a0a0ff', '#8080ff', '#6060ff'];
    const colorIndex = Math.min(index, colors.length - 1);
    return colors[colorIndex];
}
</script>

<template>
    <TresGroup>
        <TripleRing v-for="(ring, i) of gameStore.tripleRings" :key="i" :ref="el => ringRefs[i] = el"
            :position="ring.position" :rotation="[ring.rotation.x, ring.rotation.y, ring.rotation.z]"
            :scale="ring.scale" :showNodes="true" :layerId="i" :showLayerConnections="shouldShowLayerConnections(i)"
            :nextLayerPosition="getNextLayerPosition(i)" :nextLayerRotation="getNextLayerRotation(i)"
            :nextLayerScale="getNextLayerScale(i)" :connectionColor="getConnectionColor(i)" />
    </TresGroup>
</template>