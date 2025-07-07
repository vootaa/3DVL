<script setup lang="ts">
import { computed, watch } from 'vue'

interface Props {
  visible?: boolean
  evolutionProgress?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  evolutionProgress: 0
})

const emit = defineEmits(['visible-change'])

const maxAge = 13.8 // 13.8 billion years

/**
 * Format age as a fixed-width full number in years with thousands separator and 'ago'
 * e.g. 13,800,000,000 ago
 */
function formatFullAge(ageInBillions: number): string {
  if (ageInBillions <= 0) return 'NOW'
  const years = Math.round(ageInBillions * 1_000_000_000)
  // Pad with zeros to always show 11 digits (e.g. 00000000000)
  const padded = years.toString().padStart(11, '0')
  // Add thousands separator
  const withCommas = padded.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${withCommas} Years Ago`
}

const currentAge = computed(() => {
  return maxAge * (1 - props.evolutionProgress)
})

const formattedAge = computed(() => {
  return formatFullAge(currentAge.value)
})

watch(() => props.visible, (val) => {
  emit('visible-change', val)
})
</script>

<template>
  <div v-if="visible" class="evolution-timeline">
    <div class="timeline-content">
      <div class="timeline-text timeline-center">
        <span class="timeline-title">Petersen Galaxy Evolution Timeline</span>
        <span class="timeline-age">
          {{ formattedAge }}
        </span>
      </div>
      <div class="timeline-progress">
        <div class="progress-bar" :style="{ width: `${evolutionProgress * 100}%` }"></div>
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
  font-family: 'Kode Mono', monospace;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.timeline-age {
  color: #00ccff;
  font-family: 'Kode Mono', monospace;
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
