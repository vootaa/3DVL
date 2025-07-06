<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, readonly } from 'vue'

interface Props {
  autoStart?: boolean
  duration?: number
  enabled?: boolean
  globalTime?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: false,
  duration: 13.8,
  enabled: true,
  globalTime: 0
})

const emit = defineEmits<{
  'progress': [progress: number]
  'complete': []
  'start': []
  'reset': []
}>()

const isAnimating = ref(false)
const animationProgress = ref(0)
const startTime = ref(0)
let animationId: number | undefined

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

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
  let progress = Math.min(elapsed / props.duration, 1)
  
  progress = easeInOutCubic(progress)
  
  animationProgress.value = progress
  emit('progress', progress)

  if (progress >= 1) {
    isAnimating.value = false
    emit('complete')
    return
  }

  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  if (props.autoStart) {
    setTimeout(startAnimation, 1000)
  }
})

onUnmounted(() => {
  stopAnimation()
})

watch(() => props.enabled, (enabled) => {
  if (!enabled) {
    stopAnimation()
  }
})

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
</template>