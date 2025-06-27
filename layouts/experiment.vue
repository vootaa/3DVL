<script lang="ts" setup>
import CodeButton from '~/components/orbitron/views/CodeButton.vue'
import NebulaPanel from '~/components/orbitron/views/NebulaPanel.vue'
</script>

<template>
  <div>
    <!-- Orbitron UI Components - positioned on the right side -->
    <div class="fixed right-5 bottom-5 z-20 flex flex-row items-center gap-4">
      <!-- Code Access Button -->
      <CodeButton variant="floating" size="lg" />

      <!-- Nebula Identity Panel - using refactored components -->
      <NebulaPanel variant="compact" />
    </div>

    <slot />
  </div>
</template>

<style scoped></style>