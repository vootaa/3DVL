<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  component?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  component: 'orbitron'
})

const repoPath = computed(() => {
  const baseUrl = 'https://github.com/vootaa/3DVL/tree/main/components'
  return `${baseUrl}/${props.component}`
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }
  return sizes[props.size]
})

const containerClasses = computed(() => [
  'inline-flex items-center justify-center rounded border transition-all duration-200',
  'bg-gray-900/80 border-cyan-500/30 hover:border-cyan-400 hover:bg-gray-800/90',
  'backdrop-blur-sm hover:shadow-lg hover:shadow-cyan-400/20',
  sizeClasses.value
])

const repoTitle = computed(() => `View ${props.component} component source code`)
</script>

<template>
  <a
    :href="repoPath"
    :title="repoTitle"
    target="_blank"
    rel="noopener noreferrer"
    :class="containerClasses"
    aria-label="View component source code on GitHub"
  >
    <span
      class="i-carbon-logo-github text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
      :class="sizeClasses"
    />
  </a>
</template>

<style scoped>
a:hover span {
  filter: drop-shadow(0 0 5px currentColor);
}
</style>
}
</style>
}

a:hover span {
  filter: drop-shadow(0 0 5px currentColor);
}
</style>
