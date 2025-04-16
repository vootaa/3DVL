<script setup lang="ts">
import { inject } from 'vue'
import type { GameStore } from '../GameStore'
import ChainLayer from './ChainLayer.vue'

const gameStore: GameStore = inject('gameStore') as GameStore

const ringRefs = ref<any[]>([]);
const showConnectionsOption = ref(true);
const showCrossChainConnections = ref(true);

onMounted(() => {
    ringRefs.value = new Array(gameStore.chainweb3D.length).fill(null);
});

function shouldShowLayerConnections(index: number): boolean {
    return showConnectionsOption.value && index < gameStore.chainweb3D.length - 1;
}

function shouldShowCrossChainConnections(index: number): boolean {
    return showCrossChainConnections.value && showConnectionsOption.value && index < gameStore.chainweb3D.length - 1;
}

function getNextLayerPosition(index: number): [number, number, number] {
    if (index >= gameStore.chainweb3D.length - 1) {
        return [0, 0, 0];
    }

    return gameStore.chainweb3D[index + 1].position;
}

function getNextLayerRotation(index: number): [number, number, number] {
    if (index >= gameStore.chainweb3D.length - 1) {
        return [0, 0, 0];
    }

    const rotation = gameStore.chainweb3D[index + 1].rotation;
    return [rotation.x, rotation.y, rotation.z];
}

function getNextLayerScale(index: number): number {
    if (index >= gameStore.chainweb3D.length - 1) {
        return 1;
    }

    return gameStore.chainweb3D[index + 1].scale;
}

function getConnectionColor(index: number): string {
    const colors = ['#ffffff', '#e0e0ff', '#c0c0ff', '#a0a0ff', '#8080ff', '#6060ff'];
    const colorIndex = Math.min(index, colors.length - 1);
    return colors[colorIndex];
}
</script>

<template>
    <TresGroup>
        <ChainLayer v-for="(ring, i) of gameStore.chainweb3D" :key="i" :ref="el => ringRefs[i] = el"
            :position="ring.position" :rotation="[ring.rotation.x, ring.rotation.y, ring.rotation.z]"
            :scale="ring.scale" :showNodes="true" :layerId="i" :showLayerConnections="shouldShowLayerConnections(i)"
            :showCrossChainConnections="shouldShowCrossChainConnections(i)" :nextLayerPosition="getNextLayerPosition(i)"
            :nextLayerRotation="getNextLayerRotation(i)" :nextLayerScale="getNextLayerScale(i)"
            :connectionColor="getConnectionColor(i)" />
    </TresGroup>
</template>