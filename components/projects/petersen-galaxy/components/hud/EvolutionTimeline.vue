<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineEmits } from 'vue'

const isVisible = ref(false)

const maxAge = 13.8 // 13.8 billion years
const currentAge = ref(maxAge)
const animationDuration = 13800 // ms

let startTime: number | null = null
let animationId: number | null = null

const emit = defineEmits(['visible-change'])

/**
 * Format age as a fixed-width full number in years with thousands separator and 'ago'
 * e.g. 13,800,000,000 ago
 */
function formatFullAge(ageInBillions: number): string {
  if (ageInBillions <= 0) return '00,000,000,000 Year(s) Ago'
  const years = Math.round(ageInBillions * 1_000_000_000)
  // Pad with zeros to always show 11 digits (e.g. 00000000000)
  const padded = years.toString().padStart(11, '0')
  // Add thousands separator
  const withCommas = padded.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${withCommas} Year(s) Ago`
}

const progress = ref(0)

const startEvolutionAnimation = () => {
  const animate = (currentTime: number) => {
    if (startTime === null) {
      startTime = currentTime
    }
    const elapsed = currentTime - startTime
    const prog = Math.min(elapsed / animationDuration, 1)
    progress.value = prog
    currentAge.value = maxAge * (1 - prog)
    if (prog < 1) {
      animationId = requestAnimationFrame(animate)
    } else {
      // Animation finished, keep at 0 for 2 seconds, then disappear
      currentAge.value = 0
      setTimeout(() => {
        isVisible.value = false
      }, 2000)
    }
  }
  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  isVisible.value = true
  setTimeout(() => {
    startEvolutionAnimation()
  }, 1000)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

watch(isVisible, (val) => {
  emit('visible-change', val)
})
</script>

<template>
  <div v-if="isVisible" class="evolution-timeline">
    <div class="timeline-content">
      <div class="timeline-text timeline-center">
        <span class="timeline-title">Petersen Galaxy Evolution Timeline</span>
        <span class="timeline-age">
          {{ formatFullAge(currentAge) }}
        </span>
      </div>
      <div class="timeline-progress">
        <div class="progress-bar" :style="{ width: `${progress * 100}%` }"></div>
      </div>
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
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.timeline-age {
  color: #00ccff;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-size: 16px;
  font-weight: 700;
  margin-top: 4px;
  letter-spacing: 1px;
}

.timeline-progress {
  width: 80px;
  height: 4px;
  background: rgba(0, 204, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #0088cc, #66ddff);
  border-radius: 2px;
  transition: width 0.1s ease;
}

/* Responsive design */
@media only screen and (max-width: 768px) {
  .timeline-content {
    min-width: 280px;
    padding: 10px 16px;
    gap: 10px;
  }

  .timeline-title {
    font-size: 16px;
  }

  .timeline-age {
    font-size: 11px;
  }

  .timeline-progress {
    width: 60px;
  }
}
</style>
