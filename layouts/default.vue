<script lang="ts" setup>
import ThemeSwitcher from '~/components/ui/ThemeSwitcher.vue';
import SocialLinks from '~/components/ui/SocialLinks.vue';
import NebulaPanel from '~/components/orbitron/views/NebulaPanel.vue';
import ProjectSwitcher from '~/components/ui/ProjectSwitcher.vue';
</script>

<template>
  <div>
    <header class="fixed top-5 right-5 z-50 flex items-center gap-4">
      <ClientOnly>
        <ThemeSwitcher />
      </ClientOnly>
      <SocialLinks />
    </header>
    <main>
      <slot />
    </main>
    <!-- UI Components - positioned at bottom right -->
    <div class="fixed right-5 bottom-5 z-20 flex items-end gap-3">
      <ProjectSwitcher />
      <NebulaPanel variant="compact" />
    </div>
  </div>
</template>

<style scoped></style>
