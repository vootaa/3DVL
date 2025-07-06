<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, toRef } from 'vue'
import {
  AdditiveBlending,
  ShaderMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
} from 'three'
import { orbitalConfig } from '../../configs/orbital-config'
import { starClusterConfig } from '../../configs/star-cluster-config'
import starVertexShader from '../../shaders/star-vertex.glsl'
import starFragmentShader from '../../shaders/star-fragment.glsl'

interface Props {
  skipEvolution?: boolean
  galaxyCenter?: Vector3
}

const props = withDefaults(defineProps<Props>(), {
  skipEvolution: false,
  galaxyCenter: () => new Vector3(0, 0, 0)
})

const galaxyCenter = toRef(props, 'galaxyCenter')
const emit = defineEmits<{ 'evolution-complete': [] }>()

const { innerRadius, middleRadius } = orbitalConfig
const { stars } = starClusterConfig
const starColors = starClusterConfig.visual.colors
const starSizes = {
  'green-star': { base: 14, amplitude: 0.05 },
  'golden-star': { base: 18, amplitude: 0.10 },
  'blue-star': { base: 28, amplitude: 0.15 }
}
type StellarType = 'green-star' | 'golden-star' | 'blue-star'

const starGeometry = ref<BufferGeometry>()
const starMaterial = ref<ShaderMaterial>()
const starClusterRef = ref()

let animationTime = 0
let animationId: number | undefined
let isInitialized = false
const initialChaoticPositions = new Float32Array(stars.length * 3)
let evolutionEmitted = false

function initStars() {
  const geometry = new BufferGeometry()
  const positions = new Float32Array(stars.length * 3)
  const colors = new Float32Array(stars.length * 3)
  const sizes = new Float32Array(stars.length)
  const alphas = new Float32Array(stars.length)
  const times = new Float32Array(stars.length)
  const pulseOffsets = new Float32Array(stars.length)
  const targetRadii = new Float32Array(stars.length)
  const rotationSpeeds = new Float32Array(stars.length)
  const initialAngles = new Float32Array(stars.length)

  stars.forEach((star, index) => {
    const i3 = index * 3
    if (!props.skipEvolution) {
      // Chaotic initial position for animation
      const initialRadius = Math.random() * 6.24
      const initialAngle = Math.random() * Math.PI * 2
      const initialHeight = (Math.random() - 0.5) * 1.5
      positions[i3] = Math.cos(initialAngle) * initialRadius
      positions[i3 + 1] = initialHeight
      positions[i3 + 2] = Math.sin(initialAngle) * initialRadius
      initialChaoticPositions[i3] = positions[i3]
      initialChaoticPositions[i3 + 1] = positions[i3 + 1]
      initialChaoticPositions[i3 + 2] = positions[i3 + 2]
    } else {
      // Directly on orbit
      const targetAngle = star.theta * Math.PI / 180
      positions[i3] = star.r * Math.cos(targetAngle)
      positions[i3 + 1] = 0
      positions[i3 + 2] = star.r * Math.sin(targetAngle)
    }
    targetRadii[index] = star.r
    initialAngles[index] = star.theta * Math.PI / 180
    if (star.r === innerRadius) {
      rotationSpeeds[index] = orbitalConfig.rotationSpeeds.inner
    } else if (star.r === middleRadius) {
      rotationSpeeds[index] = orbitalConfig.rotationSpeeds.middle
    } else {
      rotationSpeeds[index] = orbitalConfig.rotationSpeeds.outer
    }
    const color = starColors[star.type as StellarType]
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
    const sizeConfig = starSizes[star.type as StellarType]
    sizes[index] = !props.skipEvolution ? sizeConfig.base * 0.3 : sizeConfig.base
    alphas[index] = !props.skipEvolution ? 0.1 + Math.random() * 0.1 : 0.85
    times[index] = Math.random() * Math.PI * 2
    pulseOffsets[index] = Math.random() * Math.PI * 2
  })

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('customColor', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1))
  geometry.setAttribute('alpha', new Float32BufferAttribute(alphas, 1))
  geometry.setAttribute('time', new Float32BufferAttribute(times, 1))
  geometry.setAttribute('pulseOffset', new Float32BufferAttribute(pulseOffsets, 1))
  geometry.setAttribute('targetRadius', new Float32BufferAttribute(targetRadii, 1))
  geometry.setAttribute('rotationSpeed', new Float32BufferAttribute(rotationSpeeds, 1))
  geometry.setAttribute('initialAngle', new Float32BufferAttribute(initialAngles, 1))

  const material = new ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      evolutionTime: { value: 0 },
      resolution: { value: [window.innerWidth, window.innerHeight, 1.0] },
      cameraDistance: { value: 10.0 }
    },
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    blending: AdditiveBlending,
    depthTest: false,
    transparent: true
  })

  starGeometry.value = geometry
  starMaterial.value = material
  isInitialized = true
}

function animate() {
  animationTime += 0.016
  if (starMaterial.value && starGeometry.value) {
    starMaterial.value.uniforms.time.value = animationTime
    starMaterial.value.uniforms.evolutionTime.value = animationTime * 0.1

    if (starClusterRef.value && galaxyCenter.value) {
      starClusterRef.value.position.set(galaxyCenter.value.x, galaxyCenter.value.y, galaxyCenter.value.z)
    }

    const positions = starGeometry.value.getAttribute('position')
    const targetRadii = starGeometry.value.getAttribute('targetRadius')
    const rotationSpeeds = starGeometry.value.getAttribute('rotationSpeed')
    const initialAngles = starGeometry.value.getAttribute('initialAngle')
    const sizes = starGeometry.value.getAttribute('size')
    const alphas = starGeometry.value.getAttribute('alpha')

    if (positions && targetRadii && rotationSpeeds && initialAngles) {
      for (let i = 0; i < stars.length; i++) {
        const i3 = i * 3
        const star = stars[i]
        let evolutionProgress = 1.0

        if (!props.skipEvolution && animationTime < 25.0) {
          const rawProgress = Math.min(1.0, animationTime * 0.04)
          evolutionProgress = rawProgress < 0.5
            ? 4 * rawProgress * rawProgress * rawProgress
            : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2

          if (rawProgress >= 1.0 && !evolutionEmitted) {
            evolutionEmitted = true
            emit('evolution-complete')
          }
        } else if (!evolutionEmitted && !props.skipEvolution) {
          evolutionEmitted = true
          emit('evolution-complete')
        }

        const currentAngle = initialAngles.array[i] + animationTime * rotationSpeeds.array[i]
        const targetRadius = targetRadii.array[i]
        const targetX = targetRadius * Math.cos(currentAngle)
        const targetZ = targetRadius * Math.sin(currentAngle)
        const targetY = 0

        if (!props.skipEvolution && evolutionProgress < 1.0) {
          const startX = initialChaoticPositions[i3]
          const startY = initialChaoticPositions[i3 + 1]
          const startZ = initialChaoticPositions[i3 + 2]
          positions.array[i3] = startX + (targetX - startX) * evolutionProgress
          positions.array[i3 + 1] = startY + (targetY - startY) * evolutionProgress
          positions.array[i3 + 2] = startZ + (targetZ - startZ) * evolutionProgress
        } else {
          positions.array[i3] = targetX
          positions.array[i3 + 1] = targetY
          positions.array[i3 + 2] = targetZ
        }

        const sizeConfig = starSizes[star.type as StellarType]
        const baseSize = sizeConfig.base
        const amplitude = sizeConfig.amplitude
        const timeOffset = animationTime + i * 0.5
        const amplitudeVariation = 1.0 + amplitude * Math.sin(timeOffset * 2.0)

        if (!props.skipEvolution && evolutionProgress < 1.0) {
          const currentSize = (baseSize * amplitudeVariation * 0.3) +
            (baseSize * amplitudeVariation - baseSize * amplitudeVariation * 0.3) * evolutionProgress
          sizes.array[i] = currentSize
        } else {
          sizes.array[i] = baseSize * amplitudeVariation
        }

        if (!props.skipEvolution && evolutionProgress < 1.0) {
          const targetAlpha = 0.85
          const currentAlpha = 0.1 + (targetAlpha - 0.1) * evolutionProgress
          alphas.array[i] = currentAlpha
        } else {
          alphas.array[i] = 0.85
        }
      }
      positions.needsUpdate = true
      sizes.needsUpdate = true
      alphas.needsUpdate = true
    }

    const times = starGeometry.value.getAttribute('time')
    if (times) {
      for (let i = 0; i < times.count; i++) {
        times.array[i] += 0.005 + Math.random() * 0.002
      }
      times.needsUpdate = true
    }
  }
  animationId = requestAnimationFrame(animate)
}

watch(galaxyCenter, (val) => {
  if (starClusterRef.value && val) {
    starClusterRef.value.position.set(val.x, val.y, val.z)
  }
})

onMounted(() => {
  if (props.skipEvolution) {
    animationTime = 30.0
  }
  evolutionEmitted = false
  initStars()
  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

const resetStarsPosition = () => {
  if (!isInitialized || !starGeometry.value) return
  animationTime = 30.0
  const positions = starGeometry.value.getAttribute('position')
  const sizes = starGeometry.value.getAttribute('size')
  const alphas = starGeometry.value.getAttribute('alpha')
  const targetRadii = starGeometry.value.getAttribute('targetRadius')
  const initialAngles = starGeometry.value.getAttribute('initialAngle')
  const rotationSpeeds = starGeometry.value.getAttribute('rotationSpeed')
  for (let i = 0; i < stars.length; i++) {
    const i3 = i * 3
    const star = stars[i]
    const angle = initialAngles.array[i] + animationTime * rotationSpeeds.array[i]
    const radius = targetRadii.array[i]
    positions.array[i3] = radius * Math.cos(angle)
    positions.array[i3 + 1] = 0
    positions.array[i3 + 2] = radius * Math.sin(angle)
    const sizeConfig = starSizes[star.type as StellarType]
    sizes.array[i] = sizeConfig.base
    alphas.array[i] = 0.85
  }
  positions.needsUpdate = true
  sizes.needsUpdate = true
  alphas.needsUpdate = true
}

defineExpose({ resetStarsPosition })
</script>

<template>
  <TresGroup ref="starClusterRef">
    <TresPoints
      v-if="starGeometry && starMaterial"
      ref="starPoints"
      :geometry="starGeometry"
      :material="starMaterial"
    />
    <template v-for="star in stars" :key="`core-${star.id}`">
      <TresMesh
        :position="[
          star.r * Math.cos(star.theta * Math.PI / 180),
          (Math.random() - 0.5) * 0.1,
          star.r * Math.sin(star.theta * Math.PI / 180)
        ]"
        :visible="false"
      >
        <TresSphereGeometry :args="[0.02, 8, 8]" />
        <TresMeshBasicMaterial
          :color="starColors[star.type as StellarType]"
          :transparent="true"
          :opacity="0.8"
        />
      </TresMesh>
    </template>
  </TresGroup>
</template>
