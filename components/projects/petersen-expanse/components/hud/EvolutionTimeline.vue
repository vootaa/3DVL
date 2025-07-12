<script setup lang="ts">
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'

interface Props {
  visible?: boolean
  evolutionProgress?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  evolutionProgress: 0
})

const emit = defineEmits(['visible-change'])

// Responsive state
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// Check if should use compact mode based on screen size
const isCompactMode = computed(() => {
  return windowWidth.value < 768 || windowHeight.value < 600
})

// Check for ultra-compact mode (very small screens)
const isUltraCompactMode = computed(() => {
  return windowWidth.value < 480 || windowHeight.value < 400
})

// Display mode for different screen sizes
const displayMode = computed(() => {
  if (isUltraCompactMode.value) return 'ultra'
  if (isCompactMode.value) return 'compact'
  return 'full'
})

// Handle window resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

const maxAge = 13.8 // 13.8 billion years

/**
 * Format age based on display mode
 */
function formatAge(ageInBillions: number, mode: string): string {
  if (ageInBillions <= 0) return 'NOW'
  
  const years = Math.round(ageInBillions * 1_000_000_000)
  
  switch (mode) {
    case 'ultra':
      // Ultra compact: just show billions with 1 decimal
      return `${ageInBillions.toFixed(1)}B ago`
    
    case 'compact':
      // Compact: show in millions/billions format
      if (ageInBillions >= 1) {
        return `${ageInBillions.toFixed(1)} Billion Years Ago`
      } else {
        const millions = Math.round(ageInBillions * 1000)
        return `${millions} Million Years Ago`
      }
    
    case 'full':
    default:
      // Full: show complete number with commas
      const padded = years.toString().padStart(11, '0')
      const withCommas = padded.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return `${withCommas} Years Ago`
  }
}

const currentAge = computed(() => {
  return maxAge * (1 - props.evolutionProgress)
})

const formattedAge = computed(() => {
  return formatAge(currentAge.value, displayMode.value)
})

// Shortened title for smaller screens
const timelineTitle = computed(() => {
  switch (displayMode.value) {
    case 'ultra':
      return 'Evolution'
    case 'compact':
      return 'Expanse Evolution'
    case 'full':
    default:
      return 'Petersen Expanse Evolution Timeline'
  }
})

watch(() => props.visible, (val) => {
  emit('visible-change', val)
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div v-if="visible" class="evolution-timeline" :class="{
    'compact': isCompactMode,
    'ultra-compact': isUltraCompactMode
  }">
    <div class="timeline-content">
      <!-- Ultra Compact Mode -->
      <template v-if="displayMode === 'ultra'">
        <div class="ultra-compact-layout">
          <div class="timeline-info">
            <span class="timeline-title">{{ timelineTitle }}</span>
            <span class="timeline-age">{{ formattedAge }}</span>
          </div>
          <div class="timeline-progress ultra">
            <div class="progress-bar" :style="{ width: `${evolutionProgress * 100}%` }"></div>
          </div>
        </div>
      </template>

      <!-- Compact Mode -->
      <template v-else-if="displayMode === 'compact'">
        <div class="compact-layout">
          <div class="timeline-text timeline-center">
            <span class="timeline-title">{{ timelineTitle }}</span>
            <span class="timeline-age">{{ formattedAge }}</span>
          </div>
          <div class="timeline-progress compact">
            <div class="progress-bar" :style="{ width: `${evolutionProgress * 100}%` }"></div>
          </div>
        </div>
      </template>

      <!-- Full Mode -->
      <template v-else>
        <div class="timeline-text timeline-center">
          <span class="timeline-title">{{ timelineTitle }}</span>
          <span class="timeline-age">{{ formattedAge }}</span>
        </div>
        <div class="timeline-progress">
          <div class="progress-bar" :style="{ width: `${evolutionProgress * 100}%` }"></div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="css" scoped>
.evolution-timeline {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  animation: slideDown 0.8s ease-out;
}

.evolution-timeline.compact {
  top: 15px;
}

.evolution-timeline.ultra-compact {
  top: 10px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.timeline-content {
  background: linear-gradient(135deg, rgba(0, 12, 20, 0.95), rgba(0, 8, 16, 0.9));
  border: 1px solid rgba(0, 204, 255, 0.6);
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 300px;
  backdrop-filter: blur(10px);
  box-shadow:
    0 8px 32px rgba(0, 204, 255, 0.3),
    inset 0 1px 0 rgba(0, 204, 255, 0.2);
}

.compact .timeline-content {
  padding: 10px 16px;
  gap: 8px;
  min-width: 280px;
  border-radius: 10px;
}

.ultra-compact .timeline-content {
  padding: 8px 12px;
  gap: 6px;
  min-width: 220px;
  border-radius: 8px;
}

/* Ultra Compact Layout */
.ultra-compact-layout {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.ultra-compact-layout .timeline-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  flex-grow: 1;
}

/* Compact Layout */
.compact-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.timeline-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-grow: 1;
}

.timeline-center {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.timeline-title {
  color: #66ddff;
  font-family: 'Kode Mono', monospace;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 0 8px rgba(0, 204, 255, 0.3);
}

.compact .timeline-title {
  font-size: 14px;
  letter-spacing: 0.3px;
}

.ultra-compact .timeline-title {
  font-size: 12px;
  letter-spacing: 0.2px;
}

.timeline-age {
  color: #00ccff;
  font-family: 'Kode Mono', monospace;
  font-size: 16px;
  font-weight: 700;
  margin-top: 4px;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(0, 204, 255, 0.4);
}

.compact .timeline-age {
  font-size: 13px;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.ultra-compact .timeline-age {
  font-size: 11px;
  letter-spacing: 0.3px;
  margin-top: 1px;
}

.timeline-progress {
  width: 80px;
  height: 4px;
  background: rgba(0, 204, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.timeline-progress.compact {
  width: 70px;
  height: 3px;
}

.timeline-progress.ultra {
  width: 50px;
  height: 3px;
  flex-shrink: 0;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #0088cc, #66ddff);
  border-radius: 2px;
  transition: width 0.1s ease;
  box-shadow: 0 0 4px rgba(0, 204, 255, 0.5);
}

/* Responsive design for different screen sizes */
@media only screen and (max-width: 768px) {
  .evolution-timeline {
    top: 15px;
  }

  .timeline-content {
    min-width: 280px;
    padding: 10px 16px;
    gap: 8px;
  }

  .timeline-title {
    font-size: 14px;
  }

  .timeline-age {
    font-size: 13px;
  }

  .timeline-progress {
    width: 60px;
  }
}

@media only screen and (max-width: 480px) {
  .evolution-timeline {
    top: 10px;
  }

  .timeline-content {
    min-width: 220px;
    padding: 8px 12px;
    gap: 6px;
  }

  .timeline-title {
    font-size: 12px;
  }

  .timeline-age {
    font-size: 11px;
  }

  .timeline-progress {
    width: 50px;
    height: 3px;
  }
}

/* Landscape phones */
@media only screen and (max-height: 480px) and (orientation: landscape) {
  .evolution-timeline {
    top: 8px;
  }

  .evolution-timeline.compact {
    top: 6px;
  }

  .evolution-timeline.ultra-compact {
    top: 4px;
  }

  .timeline-content {
    padding: 6px 12px;
  }

  .ultra-compact .timeline-content {
    padding: 4px 8px;
  }
}

/* Very small screens */
@media only screen and (max-width: 400px) {
  .ultra-compact-layout {
    gap: 8px;
  }

  .timeline-content {
    min-width: 180px;
  }

  .timeline-title {
    font-size: 10px;
  }

  .timeline-age {
    font-size: 9px;
  }

  .timeline-progress {
    width: 40px;
    height: 2px;
  }
}
</style>
