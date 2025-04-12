<script setup lang="ts">
import { ref } from 'vue'
import TrackIntegration from './TrackIntegration.vue'
import { useGameStore } from '../GameStore'

const gameStore = useGameStore()
</script>

<template>
    <!-- Using TrackIntegration component to avoid feature duplication -->
    <TrackIntegration :portalPosition="0.0" :chainWebPosition="0.65" :numPortals="1" :numChainWebs="3" />
</template>
