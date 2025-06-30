<script lang="ts" setup>
import ThemeSwitcher from '~/components/ui/ThemeSwitcher.vue';
import SocialLinks from '~/components/ui/SocialLinks.vue';
import NebulaPanel from '~/components/orbitron/views/NebulaPanel.vue';
import ProjectSwitcher from '~/components/ui/ProjectSwitcher.vue';
</script>

<template>
  <div>
    <!-- Logo & Site Name at top-left -->
    <div class="fixed top-5 left-5 z-50 flex items-center gap-2">
      <img src="/logo.svg" alt="Vootaa Logo" class="w-10 h-10" />
      <span class="font-bold text-xl tracking-wide select-none" style="font-family: 'Kode Mono', monospace;">Vootaa</span>
    </div>
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
    <!-- Copyright at bottom-left -->
    <div class="fixed bottom-5 left-5 z-20 text-xs text-gray-500 select-none flex items-center" style="font-family: 'Kode Mono', monospace;">
      3D Vision Lab&nbsp;<span class="opacity-60">@ vootaa.com</span>
    </div>
  </div>
</template>

<style scoped></style>
