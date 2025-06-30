<script lang="ts" setup>
import NebulaPanel from '~/components/orbitron/views/NebulaPanel.vue';
import ProjectSwitcher from '~/components/ui/ProjectSwitcher.vue';
</script>

<template>
  <div>
    <!-- UI Components - positioned at bottom right -->
    <div class="fixed right-5 bottom-5 z-20 flex items-end gap-3">
      <ProjectSwitcher />
      <NebulaPanel variant="compact" />
    </div>

    <slot />
  </div>
</template>

<style scoped></style>