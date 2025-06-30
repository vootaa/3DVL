<script lang="ts" setup>
import { onMounted } from 'vue';
import ThemeSwitcher from '~/components/ui/ThemeSwitcher.vue';
import SocialLinks from '~/components/ui/SocialLinks.vue';
import { useTheme } from '~/composables/useTheme';

const { initializeTheme, themeStyles } = useTheme();

onMounted(() => {
  initializeTheme();
});
</script>

<template>
  <div :style="themeStyles">
    <header class="fixed top-5 right-5 z-50 flex items-center gap-4">
      <ThemeSwitcher />
      <SocialLinks />
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>

<style scoped>
/* Add any layout-specific styles here */
</style>
