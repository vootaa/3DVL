<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, readonly } from 'vue'

interface Props {
  autoStart?: boolean
  duration?: number // Animation duration in seconds
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: false,
  duration: 13.8,
  enabled: true
})

const emit = defineEmits<{
  'progress': [progress: number]
  'complete': []
  'start': []
  'reset': []
}>()

// Animation state
const isAnimating = ref(false)
const animationProgress = ref(0)
const startTime = ref(0)
let animationId: number | undefined

function startAnimation() {
  if (!props.enabled || isAnimating.value) return
  
  isAnimating.value = true
  startTime.value = performance.now()
  animationProgress.value = 0
  
  emit('start')
  animate()
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = undefined
  }
  isAnimating.value = false
}

function resetAnimation() {
  stopAnimation()
  animationProgress.value = 0
  emit('reset')
}

function animate() {
  if (!isAnimating.value) return

  const elapsed = (performance.now() - startTime.value) / 1000
  const progress = Math.min(elapsed / props.duration, 1)
  
  animationProgress.value = progress
  emit('progress', progress)

  if (progress >= 1) {
    isAnimating.value = false
    emit('complete')
    return
  }

  animationId = requestAnimationFrame(animate)
}

// Auto-start if enabled
onMounted(() => {
  if (props.autoStart) {
    setTimeout(startAnimation, 1000)
  }
})

onUnmounted(() => {
  stopAnimation()
})

// Watch for enabled changes
watch(() => props.enabled, (enabled) => {
  if (!enabled) {
    stopAnimation()
  }
})

// Expose control methods
defineExpose({
  start: startAnimation,
  stop: stopAnimation,
  reset: resetAnimation,
  isAnimating: readonly(isAnimating),
  progress: readonly(animationProgress)
})
</script>

<template>
  <!-- This component has no visual output, it's purely functional -->
  <div style="display: none;"></div>
</template>
