<script lang="ts" setup>
import CodeButton from '~/components/orbitron/views/CodeButton.vue'
import NebulaPanel from '~/components/orbitron/views/NebulaPanel.vue'

const route = useRoute()

function getSlugFromPath(path: string) {
  return path.split('/').pop()
}

function getRepoPathFromPath(path: string) {
  return `https://github.com/vootaa/3dvl/tree/main/components/content/${getSlugFromPath(path)}`
}

function getRepoTitleFromPath(path: string) {
  return `${getSlugFromPath(path)} – code on Github`
}

const repoPath = getRepoPathFromPath(route.path)
const repoTitle = getRepoTitleFromPath(route.path)
</script>

<template>
  <div>
    <!-- Orbitron UI Components - positioned on the right side -->
    <div class="fixed right-5 top-1/2 transform -translate-y-1/2 z-20 flex flex-col items-end gap-4">
      <!-- Nebula Identity Panel - using refactored components -->
      <NebulaPanel variant="compact" />
      
      <!-- Code Access Button -->
      <CodeButton
        :to="repoPath"
        :title="repoTitle"
        variant="floating"
        size="lg"
      />
    </div>
    
    <slot />
  </div>
</template>

<style scoped>
/* Utility classes for positioning */
.fixed {
  position: fixed;
}

.right-5 {
  right: 1.25rem;
}

.top-1\/2 {
  top: 50%;
}

.transform {
  transform: var(--tw-transform);
}

.-translate-y-1\/2 {
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.z-20 {
  z-index: 20;
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-end {
  align-items: flex-end;
}

.gap-4 {
  gap: 1rem;
}
</style>
