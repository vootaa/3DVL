<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Evolution timeline state
const isVisible = ref(true)
const currentAge = ref(0)
const maxAge = 13.8 // 13.8 billion years (age of universe)
const animationDuration = 20000 // 20 seconds

// Timeline animation
let startTime: number | null = null
let animationId: number | null = null

const formatAge = (ageInBillions: number): string => {
  if (ageInBillions < 0.1) {
    return `${(ageInBillions * 1000).toFixed(0)}M years ago`
  } else {
    return `${ageInBillions.toFixed(1)}B years ago`
  }
}

const startEvolutionAnimation = () => {
  const animate = (currentTime: number) => {
    if (startTime === null) {
      startTime = currentTime
    }
    
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / animationDuration, 1)
    
    // Evolution goes backwards in time (from universe formation to now)
    currentAge.value = maxAge * (1 - progress)
    
    if (progress < 1) {
      animationId = requestAnimationFrame(animate)
    } else {
      // Hide after animation completes with a delay
      setTimeout(() => {
        isVisible.value = false
      }, 2000)
    }
  }
  
  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  // Start animation after a short delay
  setTimeout(() => {
    startEvolutionAnimation()
  }, 1000)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<template>
  <div v-if="isVisible" class="evolution-timeline">
    <div class="timeline-content">
      <div class="timeline-text">
        <span class="timeline-title">Petersen Galaxy Evolution Timeline</span>
        <span class="timeline-age">{{ formatAge(currentAge) }}</span>
      </div>
      <div class="timeline-progress">
        <div 
          class="progress-bar" 
          :style="{ width: `${((maxAge - currentAge) / maxAge) * 100}%` }"
        ></div>
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
  align-items: center;
  gap: 16px;
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

.timeline-title {
  color: #66ddff;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.timeline-age {
  color: #00ccff;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  font-weight: 700;
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
  
  .timeline-icon {
    font-size: 20px;
  }
  
  .timeline-title {
    font-size: 11px;
  }
  
  .timeline-age {
    font-size: 13px;
  }
  
  .timeline-progress {
    width: 60px;
  }
}
</style>
