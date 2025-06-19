<script setup lang="ts">
import type { CodeButtonProps } from '../core/types'
import { CODE_BUTTON_THEMES } from '../core/types'

interface Props extends CodeButtonProps {
  theme?: 'github'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'floating',
  theme: 'github',
  size: 'md'
})

const currentTheme = computed(() => CODE_BUTTON_THEMES[props.theme])

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }
  return sizes[props.size]
})

const containerClasses = computed(() => {
  return [
    'rounded-full border-3 transition-all duration-200 hover:scale-110',
    'font-mono tracking-wider', // Space-game font styling
    {
      'shadow-lg hover:shadow-xl': props.variant === 'floating',
      'backdrop-blur-sm': props.variant === 'floating'
    }
  ]
})

const iconClasses = computed(() => [
  'i-carbon-logo-github transition-all duration-200 hover:opacity-80',
  sizeClasses.value
])
</script>

<template>
  <span :class="containerClasses">
    <a
      :href="to"
      :title="title"
      :class="iconClasses"
    />
  </span>
</template>

<style scoped>
/* Space-game cosmic theme integration */
.dark span {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.8), rgba(10, 10, 15, 0.9));
  border-color: rgba(6, 182, 212, 0.3);
}

.dark a {
  color: rgb(103, 232, 249);
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

span, .sepia span {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 245, 255, 0.8));
  border-color: rgb(191, 219, 254);
}

a, .sepia a {
  color: rgb(37, 99, 235);
  text-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.sepia span {
  background: linear-gradient(135deg, rgba(255, 251, 235, 0.9), rgba(254, 243, 199, 0.8));
  border-color: rgb(253, 230, 138);
}

.sepia a {
  color: rgb(146, 64, 14);
  text-shadow: 0 0 8px rgba(217, 119, 6, 0.3);
}

/* Space-game glow effects */
span:hover a {
  filter: drop-shadow(0 0 8px currentColor);
}

/* Orbitron animation - matching space-game style */
@keyframes orbitron-pulse {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
    transform: scale(1.02);
  }
}

.dark span:hover {
  animation: orbitron-pulse 2s ease-in-out infinite;
}

/* Utility classes */
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.hover\:shadow-xl:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

.border-3 {
  border-width: 3px;
}

.hover\:scale-110:hover {
  transform: scale(1.1);
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-200 {
  transition-duration: 200ms;
}

.hover\:opacity-80:hover {
  opacity: 0.8;
}

.font-mono {
  font-family: 'Kode Mono', ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.tracking-wider {
  letter-spacing: 0.05em;
}
</style>
