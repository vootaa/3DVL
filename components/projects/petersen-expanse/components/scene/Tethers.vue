<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Vector3, BufferAttribute } from 'three'
import { useRenderLoop } from '@tresjs/core'

import { tetherConfig, tetherConnections } from '../../configs/tether-config'
import { getCurrentLODLevel } from '../../configs/lodlevel-config'

import tetherVertexShader from '../../shaders/tether-vertex.glsl'
import tetherFragmentShader from '../../shaders/tether-fragment.glsl'

interface Props {
  enabled?: boolean
  globalTime?: number
  evolutionProgress?: number
  galaxyCenter?: Vector3
  stellarCorePositions?: Vector3[]
  cameraRef?: any
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  globalTime: 0,
  evolutionProgress: 0,
  galaxyCenter: () => new Vector3(0, 0, 0),
  stellarCorePositions: () => [],
  cameraRef: null
})

const cameraDistance = ref(1000)
const tetherGeometryRef = ref()
const tetherMaterialRef = ref()
const tetherPointsRef = ref()

const tetherAttributes = computed(() => {
  const positions: number[] = []
  const colors: number[] = []
  const alphas: number[] = []
  const tetherIds: number[] = []
  const archParams: number[] = []
  const chaoticPositions: number[] = []

  if (props.stellarCorePositions.length < 20) {
    return null
  }

  let tetherIndex = 0

  // process forward connections
  tetherConnections.forward.forEach((connection) => {
    const fromPos = props.stellarCorePositions[connection[0]] || new Vector3()
    const toPos = props.stellarCorePositions[connection[1]] || new Vector3()

    // Create arch particles between nodes
    const particleCount = tetherConfig.particlesPerTether
    for (let i = 0; i < particleCount; i++) {
      const t = i / (particleCount - 1)

      // Quadratic Bézier curve for arch (upward)
      const midPoint = fromPos.clone().lerp(toPos, 0.5)
      midPoint.y += tetherConfig.archHeight // Adjust height for upward arch

      const pos = new Vector3()
        .copy(fromPos)
        .multiplyScalar((1 - t) * (1 - t))
        .add(midPoint.clone().multiplyScalar(2 * (1 - t) * t))
        .add(toPos.clone().multiplyScalar(t * t))

      positions.push(pos.x, pos.y, pos.z)

      // Generate chaotic initial position
      const chaoticRadius = Math.random() * 1000
      const chaoticAngle = Math.random() * Math.PI * 2
      const chaoticHeight = (Math.random() - 0.5) * 500
      chaoticPositions.push(
        Math.cos(chaoticAngle) * chaoticRadius,
        chaoticHeight,
        Math.sin(chaoticAngle) * chaoticRadius
      )

      // Forward color (cyan)
      const color = tetherConfig.colors.forward
      colors.push(color.r, color.g, color.b)

      // Alpha varies along the arch
      const alpha = Math.sin(t * Math.PI) * tetherConfig.baseOpacity
      alphas.push(alpha)

      tetherIds.push(tetherIndex)
      archParams.push(1, t) // archDirection: 1 (upward), progress: t
    }

    tetherIndex++
  })

  // process reverse connections
  tetherConnections.reverse.forEach((connection) => {
    const fromPos = props.stellarCorePositions[connection[0]] || new Vector3()
    const toPos = props.stellarCorePositions[connection[1]] || new Vector3()

    // Create arch particles between nodes
    const particleCount = tetherConfig.particlesPerTether
    for (let i = 0; i < particleCount; i++) {
      const t = i / (particleCount - 1)

      // Quadratic Bézier curve for arch (downward)
      const midPoint = fromPos.clone().lerp(toPos, 0.5)
      midPoint.y -= tetherConfig.archHeight // Adjust height for downward arch

      const pos = new Vector3()
        .copy(fromPos)
        .multiplyScalar((1 - t) * (1 - t))
        .add(midPoint.clone().multiplyScalar(2 * (1 - t) * t))
        .add(toPos.clone().multiplyScalar(t * t))

      positions.push(pos.x, pos.y, pos.z)

      // Generate chaotic initial position
      const chaoticRadius = Math.random() * 1000
      const chaoticAngle = Math.random() * Math.PI * 2
      const chaoticHeight = (Math.random() - 0.5) * 500
      chaoticPositions.push(
        Math.cos(chaoticAngle) * chaoticRadius,
        chaoticHeight,
        Math.sin(chaoticAngle) * chaoticRadius
      )

      // Reverse color (orange)
      const color = tetherConfig.colors.reverse
      colors.push(color.r, color.g, color.b)

      // Alpha varies along the arch
      const alpha = Math.sin(t * Math.PI) * tetherConfig.baseOpacity
      alphas.push(alpha)

      tetherIds.push(tetherIndex)
      archParams.push(-1, t) // archDirection: -1 (downward), progress: t
    }

    tetherIndex++
  })

  return {
    position: new BufferAttribute(new Float32Array(positions), 3),
    color: new BufferAttribute(new Float32Array(colors), 3),
    alpha: new BufferAttribute(new Float32Array(alphas), 1),
    tetherId: new BufferAttribute(new Float32Array(tetherIds), 1),
    archParams: new BufferAttribute(new Float32Array(archParams), 2),
    chaoticPosition: new BufferAttribute(new Float32Array(chaoticPositions), 3)
  }
})

const tetherShader = computed(() => ({
  transparent: true,
  depthWrite: false,
  blending: tetherConfig.blendMode,
  vertexColors: true,
  vertexShader: tetherVertexShader,
  fragmentShader: tetherFragmentShader,
  uniforms: {
    uTime: { value: 0.0 },
    uEvolutionProgress: { value: 0.0 },
    uPointSize: { value: tetherConfig.particleSize },
    uFlowSpeed: { value: tetherConfig.flowSpeed },
    uPulseFrequency: { value: tetherConfig.pulseFrequency },
    uGlowIntensity: { value: tetherConfig.glowIntensity }
  }
}))

const { onLoop } = useRenderLoop()
onLoop(() => {
  if (!props.enabled || !tetherMaterialRef.value) return

  const material = tetherMaterialRef.value
  material.uniforms.uTime.value = props.globalTime
  material.uniforms.uEvolutionProgress.value = props.evolutionProgress

  if (tetherPointsRef.value && props.cameraRef?.value) {
    cameraDistance.value = props.cameraRef.value.position.distanceTo(tetherPointsRef.value.position)
  }

  const lodLevel = getCurrentLODLevel(cameraDistance.value, 'tethers')
  material.uniforms.uPointSize.value = lodLevel.particleSize || tetherConfig.particleSize

  if (tetherPointsRef.value && props.galaxyCenter) {
    tetherPointsRef.value.position.set(props.galaxyCenter.x, props.galaxyCenter.y, props.galaxyCenter.z)
  }
})

// Watch for position changes - trigger geometry recalculation
watch(() => props.stellarCorePositions, () => {
  // tetherAttributes will automatically recalculate because it's computed
}, { deep: true })

onMounted(() => {
  // Initialization logic if needed
})
</script>

<template>
  <TresGroup v-if="enabled && tetherAttributes">
    <TresPoints ref="tetherPointsRef">
      <TresBufferGeometry ref="tetherGeometryRef" :attributes="tetherAttributes" />
      <TresShaderMaterial ref="tetherMaterialRef" v-bind="tetherShader" />
    </TresPoints>
  </TresGroup>
</template>