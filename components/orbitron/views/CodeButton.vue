<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface Props {
  variant?: 'floating' | 'inline'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'floating',
  size: 'md'
})

const route = useRoute()

function getSlugFromPath(path: string) {
  const slug = path.split('/').pop()
  return slug || '3DVL' // Fallback for base paths
}

const repoPath = computed(() => {
  return `https://github.com/vootaa/3dvl/tree/main/components/content/${getSlugFromPath(route.path)}`
})

const repoTitle = computed(() => {
  return `${getSlugFromPath(route.path)} – code on Github`
})

const containerClasses = computed(() => {
  const sizeMap = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5'
  }
  return [
    'flex items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-110',
    'dark:bg-gray-900/50 dark:border-cyan-500/30',
    'bg-white/50 border-blue-300/50',
    props.variant === 'floating' ? 'shadow-lg hover:shadow-xl backdrop-blur-sm' : '',
    sizeMap[props.size]
  ]
})

const iconClasses = computed(() => [
  'i-carbon-logo-github block w-full h-full transition-colors duration-200',
  'dark:text-cyan-400 dark:hover:text-cyan-300',
  'text-blue-600 hover:text-blue-500'
])
</script>

<template>
  <a
    :href="repoPath"
    :title="repoTitle"
    target="_blank"
    rel="noopener noreferrer"
    :class="containerClasses"
    aria-label="View source code on GitHub"
    style="font-family: 'Kode Mono', monospace;"
  >
    <span :class="iconClasses" />
  </a>
</template>

<style scoped>
a:hover span {
  filter: drop-shadow(0 0 5px currentColor);
}
</style>
