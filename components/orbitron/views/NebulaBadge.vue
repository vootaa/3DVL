<script setup lang="ts">
import { computed } from 'vue'

interface BadgeVariant {
  name: string
  class: string
  description?: string
}

// Local variants definition with theme-consistent styling
const NEBULA_VARIANTS: BadgeVariant[] = [
  { name: 'primary', class: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' },
  { name: 'secondary', class: 'bg-gray-500/20 text-gray-300 border border-gray-500/30' },
  { name: 'success', class: 'bg-green-500/20 text-green-300 border border-green-500/30' },
  { name: 'warning', class: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
  { name: 'danger', class: 'bg-red-500/20 text-red-300 border border-red-500/30' },
  { name: 'info', class: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
]

interface Props {
  variant?: string
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean
  pulse?: boolean
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  rounded: false,
  pulse: false
})

const selectedVariant = computed((): BadgeVariant => {
  return NEBULA_VARIANTS.find(v => v.name === props.variant) || NEBULA_VARIANTS[0]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }
  return sizes[props.size]
})

const badgeClasses = computed(() => {
  return [
    'inline-flex items-center font-medium transition-all duration-200',
    'tracking-wider',
    selectedVariant.value.class,
    sizeClasses.value,
    {
      'rounded-full': props.rounded,
      'rounded-md': !props.rounded,
      'animate-pulse': props.pulse
    },
    props.customClass
  ]
})
</script>

<template>
  <span :class="badgeClasses" class="orbitron-font">
    <slot>{{ selectedVariant.description || selectedVariant.name }}</slot>
  </span>
</template>

<style scoped>
.orbitron-font {
  font-family: 'Kode Mono', monospace;
}
</style>
