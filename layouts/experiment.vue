<script lang="ts" setup>
import NebulaPanel from '~/components/orbitron/views/NebulaPanel.vue'
</script>

<template>
  <div>
    <!-- Orbitron UI Component - positioned at bottom right -->
    <div class="fixed right-5 bottom-5 z-20">
      <!-- Nebula Identity Panel -->
      <NebulaPanel variant="compact" />
    </div>

    <slot />
  </div>
</template>

<style scoped></style>