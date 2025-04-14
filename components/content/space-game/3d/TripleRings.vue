<script setup lang="ts">
import { inject } from 'vue'
import type { GameStore } from '../GameStore'
import { Color, DoubleSide, MeshBasicMaterial, RingGeometry } from 'three';

const geometryInner = new RingGeometry(0.3, 0.31, 64)
const geometryMiddle = new RingGeometry(0.6, 0.61, 64)
const geometryOuter = new RingGeometry(0.96, 0.97, 64)
const material = new MeshBasicMaterial({ color: new Color('lightgreen'), side: DoubleSide })
const gameStore: GameStore = inject('gameStore') as GameStore
</script>

<template>
    <TresGroup>
        <template v-for="{ position, rotation, scale }, i of gameStore.tripleRings" :key="i">
            <TresMesh :geometry="geometryInner" :position="position" :material="material" :rotation="rotation"
                :scale="scale" />
            <TresMesh :geometry="geometryMiddle" :position="position" :material="material" :rotation="rotation"
                :scale="scale" />
            <TresMesh :geometry="geometryOuter" :position="position" :material="material" :rotation="rotation"
                :scale="scale" />
        </template>
    </TresGroup>
</template>