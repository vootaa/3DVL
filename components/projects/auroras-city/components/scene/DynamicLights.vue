<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted, ref } from 'vue'
import { Color, PointLight, Vector2, Group, Clock } from 'three'
import { useLoop } from '@tresjs/core'

interface Props {
  lightCount?: number
  lightIntensity?: number
  lightDistance?: number
  position?: [number, number, number]
  lightFunction?: 'sinusoidalLightFn_TresJS' | 'sinusoidalLightFn_TresJS2'
}

const props = withDefaults(defineProps<Props>(), {
  lightCount: 4,
  lightIntensity: 1.5,
  lightDistance: 6,
  position: () => [0, 0, 0] as [number, number, number],
  lightFunction: 'sinusoidalLightFn_TresJS'
})

const lightsGroup = shallowRef(new Group())
const lights = ref<PointLight[]>([])

const clock = new Clock()
const color = new Color()

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/*
  Modified sinusoidal light function to create a dynamic lighting effect from TresJS example.
*/
function sinusoidalLightFn_TresJS(light: PointLight, uv: Vector2, iTime: number) {
  color.g = 0.5 * clamp((1.0 - Math.sqrt(Math.abs(Math.cos(uv.y + uv.x + iTime)))) ** (Math.sin(iTime) + 2.0), 0.2, 1.0)
  color.b = 0.5 * clamp((1.0 - Math.sin(uv.y + iTime)) ** (Math.cos(iTime) + 2.0), 0.2, 1.0)
  color.r = 0.5 * clamp(Math.sin(iTime + uv.x + Math.sin(uv.y + iTime)), 0.2, 1.0)
  light.color.lerp(color, 0.6) // Smoothly interpolate color
}

function sinusoidalLightFn_TresJS2(light: PointLight, uv: Vector2, iTime: number) {
  // Convert to radial coordinates - consistent with shader
  const center = new Vector2(0.5, 0.5)
  const pos = uv.clone().sub(center)
  const radius = pos.length()
  const angle = Math.atan2(pos.y, pos.x)

  // Same calculation logic as in the shader
  color.g = Math.pow(1.0 - Math.sqrt(Math.abs(Math.cos(radius * 6.0 + angle + iTime * 0.1))), Math.sin(iTime) + 2.0)
  color.b = Math.pow(1.0 - Math.sin(radius * 4.0 + iTime), Math.cos(iTime) + 2.0)
  color.r = Math.sin(iTime + angle + Math.sin(radius * 3.0 + iTime))
  light.color.lerp(color, 0.1)
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
    // Circular orbit motion
    const baseAngle = (index / props.lightCount) * Math.PI * 2
    const orbitAngle = baseAngle + elapsed * 0.3
    const orbitRadius = 2.0 + Math.sin(elapsed * 0.5 + index) * 0.5

    light.position.set(
      props.position[0] + Math.cos(orbitAngle) * orbitRadius,
      props.position[1] + Math.sin(elapsed * 0.8 + index) * 1.5 + 2.0, // Vertical oscillation
      props.position[2] + Math.sin(orbitAngle) * orbitRadius
    )

    // Radial UV coordinates
    const uv = new Vector2(
      0.5 + Math.cos(orbitAngle) * 0.4,
      0.5 + Math.sin(orbitAngle) * 0.4
    )

    if (props.lightFunction === 'sinusoidalLightFn_TresJS2') {
      sinusoidalLightFn_TresJS2(light, uv, elapsed)
    } else {
      sinusoidalLightFn_TresJS(light, uv, elapsed)
    }
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
