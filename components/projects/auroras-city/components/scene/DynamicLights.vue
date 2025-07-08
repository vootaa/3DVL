<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted } from 'vue'
import { Color, PointLight, Vector2 } from 'three'
import { useLoop } from '@tresjs/core'

interface Props {
  lightCount?: number
  lightIntensity?: number
  lightDistance?: number
}

const props = withDefaults(defineProps<Props>(), {
  lightCount: 3,
  lightIntensity: 2,
  lightDistance: 5
})

const lights = shallowRef<PointLight[]>([])
const clock = { getElapsedTime: () => Date.now() / 1000 }

const color = new Color()
const center = new Vector2(0.5, 0.5)

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function sinusoidalLightFn(light: PointLight, uv: Vector2, iTime: number) {
  color.g = 0.5 * clamp((1.0 - Math.sqrt(Math.abs(Math.cos(uv.y + uv.x + iTime)))) ** (Math.sin(iTime) + 2.0), 0.2, 1)
  color.b = 0.5 * clamp((1.0 - Math.sin(uv.y + iTime)) ** (Math.cos(iTime) + 2.0), 0.2, 1)
  color.r = 0.5 * clamp(Math.sin(iTime + uv.x + Math.sin(uv.y + iTime)), 0.2, 1)
  
  light.color.lerp(color, 0.06)
}

onMounted(() => {
  // Create lights
  for (let i = 0; i < props.lightCount; i++) {
    const light = new PointLight(0xffffff, props.lightIntensity, props.lightDistance)
    const angle = (i / props.lightCount) * Math.PI * 2
    light.position.set(
      Math.cos(angle) * 3,
      2,
      Math.sin(angle) * 3
    )
    lights.value.push(light)
  }
})

useLoop().onBeforeRender(() => {
  const elapsed = clock.getElapsedTime()
  
  lights.value.forEach((light, index) => {
    // Animate light position
    const angle = (index / props.lightCount) * Math.PI * 2 + elapsed * 0.5
    light.position.set(
      Math.cos(angle) * 3,
      2 + Math.sin(elapsed + index) * 0.5,
      Math.sin(angle) * 3
    )
    
    // Update light color using shader logic
    sinusoidalLightFn(light, center, elapsed)
  })
})

onUnmounted(() => {
  lights.value.forEach(light => {
    light.dispose()
  })
})
</script>

<template>
  <TresGroup>
    <TresPointLight
      v-for="index in lightCount"
      :key="index"
      :intensity="lightIntensity"
      :distance="lightDistance"
      :position="[0, 0, 0]"
    />
  </TresGroup>
</template>