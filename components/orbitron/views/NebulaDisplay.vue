<script setup lang="ts">
import type { NebulaData } from '../core/nebula-generator'
import { useNebula } from '../composables/useNebula'
import { formatNebulaId, formatTimestamp } from '../utils/format-utils'
import { getSpaceFontClass } from '../utils/format-utils'

interface Props {
  seed?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  interactive?: boolean
  showInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  interactive: true,
  showInfo: false
})

const { 
  currentNebula, 
  nebulaStyle, 
  generateNebula, 
  saveNebula 
} = useNebula(props.seed)

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-96 h-96'
  }
  return sizes[props.size]
})

const containerClasses = computed(() => [
  'relative rounded-full overflow-hidden border border-cyan-500/30',
  'backdrop-blur-sm transition-all duration-500',
  sizeClasses.value,
  'font-mono tracking-wider', // Use space-game font directly
  {
    'hover:scale-105 cursor-pointer': props.interactive,
    'shadow-lg shadow-cyan-500/20': props.interactive
  }
])

const handleGenerate = () => {
  if (props.interactive) {
    generateNebula()
  }
}

const handleSave = () => {
  if (currentNebula.value) {
    saveNebula()
  }
}
</script>

<template>
  <div class="nebula-display-container">
    <div 
      :class="containerClasses"
      :style="nebulaStyle"
      @click="handleGenerate"
    >
      <!-- Cosmic overlay pattern -->
      <div class="absolute inset-0 opacity-30">
        <div class="stars-pattern"></div>
      </div>
      
      <!-- Nebula info overlay -->
      <div 
        v-if="showInfo && currentNebula" 
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-center text-white text-shadow-glow">
          <div class="text-xs font-mono tracking-wider">{{ formatNebulaId(currentNebula.id) }}</div>
          <div class="text-2xs opacity-75 font-mono">{{ currentNebula.pattern.toUpperCase() }}</div>
        </div>
      </div>
      
      <!-- Interactive controls -->
      <div 
        v-if="interactive" 
        class="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity"
      >
        <button
          @click.stop="handleSave"
          class="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 text-xs"
          title="Save Nebula"
        >
          <span class="i-carbon-save w-3 h-3"></span>
        </button>
      </div>
    </div>
    
    <!-- Nebula details -->
    <div v-if="showInfo && currentNebula" class="mt-4 text-center">
      <div class="text-sm text-cyan-300 font-mono tracking-wider">
        {{ formatNebulaId(currentNebula.id) }}
      </div>
      <div class="text-xs text-gray-400 mt-1 font-mono">
        {{ currentNebula.pattern }} • {{ Math.round(currentNebula.intensity * 100) }}% intensity
      </div>
      <div class="text-xs text-gray-500 font-mono">
        {{ formatTimestamp(currentNebula.created) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-shadow-glow {
  text-shadow: 0 0 10px currentColor;
}

.stars-pattern {
  background-image: 
    radial-gradient(2px 2px at 20px 30px, #fff, transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 90px 40px, #fff, transparent),
    radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent);
  background-repeat: repeat;
  background-size: 200px 100px;
  animation: drift 20s linear infinite;
}

@keyframes drift {
  0% { transform: translateX(0); }
  100% { transform: translateX(-200px); }
}

.nebula-display-container {
  @apply flex flex-col items-center;
}
</style>
