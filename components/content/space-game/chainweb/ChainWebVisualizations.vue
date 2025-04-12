<script setup lang="ts">
import { ref, inject } from 'vue'
import TrackIntegration from './TrackIntegration.vue'
import type { GameStore } from '../GameStore'

const gameStore = inject('gameStore') as GameStore
</script>

<template>
    <!-- Using TrackIntegration component to avoid feature duplication -->
    <TrackIntegration :portalPosition="0.0" :chainWebPosition="0.65" :numPortals="1" :numChainWebs="3" />
</template>
