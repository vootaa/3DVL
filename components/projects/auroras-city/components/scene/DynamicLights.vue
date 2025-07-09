<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted, ref } from 'vue'
import { Color, PointLight, Vector2, Group, Clock } from 'three'
import { useLoop } from '@tresjs/core'

interface Props {
  lightCount?: number
  lightIntensity?: number
  lightDistance?: number
  position?: [number, number, number]
}

const props = withDefaults(defineProps<Props>(), {
  lightCount: 3,
  lightIntensity: 2,
  lightDistance: 5,
  position: () => [0, 0, 0] as [number, number, number]
})

const lightsGroup = shallowRef(new Group())
const lights = ref<PointLight[]>([])

const clock = new Clock()
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
  for (let i = 0; i < props.lightCount; i++) {
    const light = new PointLight(0xffffff, props.lightIntensity, props.lightDistance)
    lights.value.push(light)
    lightsGroup.value.add(light)
  }
  
  clock.start()
  console.log('Lights Clock started')
})

const { onBeforeRender } = useLoop()

onBeforeRender(() => {
  const elapsed = clock.getElapsedTime()
  
  lights.value.forEach((light, index) => {
    const angle = (index / props.lightCount) * Math.PI * 2 + elapsed * 0.5
    light.position.set(
      props.position[0] + Math.cos(angle) * 4,
      props.position[1] + Math.sin(elapsed * 4 + index) * 1.2,
      props.position[2] + Math.sin(angle) * 4
    )
    
    const uv = new Vector2(
      0.5 + Math.cos(angle) * 0.35,
      0.5 + Math.sin(angle) * 0.35
    )

    sinusoidalLightFn(light, uv, elapsed)
  })
})

onUnmounted(() => {
  lights.value.forEach(light => {
    light.dispose()
  })
  clock.stop()
})
</script>

<template>
  <TresGroup ref="lightsGroup" />
</template>