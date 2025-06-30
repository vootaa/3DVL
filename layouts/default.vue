<script lang="ts" setup>
import ThemeSwitcher from '~/components/ui/ThemeSwitcher.vue';
import SocialLinks from '~/components/ui/SocialLinks.vue';
import NebulaPanel from '~/components/orbitron/views/NebulaPanel.vue';
import ProjectSwitcher from '~/components/ui/ProjectSwitcher.vue';
import LogoBrand from '~/components/ui/LogoBrand.vue';
import CopyrightFooter from '~/components/ui/CopyrightFooter.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col bg-black">
    <!-- Logo at top-left -->
    <div class="fixed top-5 left-5 z-50">
      <LogoBrand />
    </div>
    <header class="fixed top-5 right-5 z-50 flex items-center gap-4">
      <ClientOnly>
        <ThemeSwitcher />
      </ClientOnly>
      <SocialLinks />
    </header>
    <main class="flex-1 flex flex-col">
      <slot />
    </main>
    <!-- Copyright at bottom left -->
    <CopyrightFooter />
    <!-- UI Components - positioned at bottom right -->
    <div class="fixed right-5 bottom-5 z-20 flex items-end gap-3">
      <ProjectSwitcher />
      <NebulaPanel variant="compact" />
    </div>
  </div>
</template>