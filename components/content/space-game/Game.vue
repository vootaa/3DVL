<script setup>
import { onMounted, shallowRef } from 'vue'
import { PerspectiveCamera } from 'three'
import { gameStore } from './GameStore'
import ChainWebVisualizations from './chainweb/ChainWebVisualizations.vue'

const camera = shallowRef(new PerspectiveCamera())
onMounted(() => {
    gameStore.actions.init(camera.value)
})
</script>

<template>
    <div id="game">
        <TresCanvas window-size>
            <!-- Add ChainWeb Visualizations -->
            <ChainWebVisualizations />
        </TresCanvas>
    </div>
</template>