<script setup lang="ts">
import type { BadgeVariant } from '../core/types'
import { NEBULA_VARIANTS } from '../core/types'

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
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  return sizes[props.size]
})

const badgeClasses = computed(() => {
  return [
    'inline-flex items-center font-medium transition-all duration-200',
    'font-mono tracking-wider', // Space-game font
    selectedVariant.value.class,
    sizeClasses.value,
    {
      'rounded-full': props.rounded,
      'rounded': !props.rounded,
      'animate-pulse': props.pulse
    },
    props.customClass
  ]
})
</script>

<template>
  <span :class="badgeClasses">
    <slot>{{ selectedVariant.description || selectedVariant.name }}</slot>
  </span>
</template>

<style scoped>
/* Base badge styles */
.inline-flex {
  display: inline-flex;
}

.items-center {
  align-items: center;
}

.font-medium {
  font-weight: 500;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-200 {
  transition-duration: 200ms;
}

.font-mono {
  font-family: 'Kode Mono', ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

/* Size classes */
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }

.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }

.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }

/* Border radius */
.rounded { border-radius: 0.25rem; }
.rounded-full { border-radius: 9999px; }

/* Colors */
.bg-blue-500 { background-color: rgb(59, 130, 246); }
.bg-gray-500 { background-color: rgb(107, 114, 128); }
.bg-green-500 { background-color: rgb(34, 197, 94); }
.bg-yellow-500 { background-color: rgb(234, 179, 8); }
.bg-red-500 { background-color: rgb(239, 68, 68); }

.text-white { color: rgb(255, 255, 255); }
.text-black { color: rgb(0, 0, 0); }

/* Animation */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>
