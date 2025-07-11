<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Vector3 } from 'three'
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

  try {
    let tetherIndex = 0

    // process forward connections
    tetherConnections.forward.forEach((connection) => {
      if (connection[0] >= props.stellarCorePositions.length ||
        connection[1] >= props.stellarCorePositions.length) {
        console.warn('Invalid connection indices:', connection)
        return
      }

      const fromPos = props.stellarCorePositions[connection[0]] || new Vector3()
      const toPos = props.stellarCorePositions[connection[1]] || new Vector3()

      if (!fromPos || !toPos) {
        console.warn('Invalid positions for connection:', connection)
        return
      }

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

        if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
          console.warn('Invalid position calculated:', pos)
          continue
        }

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
      if (connection[0] >= props.stellarCorePositions.length ||
        connection[1] >= props.stellarCorePositions.length) {
        return
      }

      const fromPos = props.stellarCorePositions[connection[0]] || new Vector3()
      const toPos = props.stellarCorePositions[connection[1]] || new Vector3()

      if (!fromPos || !toPos) {
        return
      }

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

        if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
          continue
        }

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

    const expectedLength = positions.length / 3
    if (colors.length !== expectedLength * 3 ||
      alphas.length !== expectedLength ||
      tetherIds.length !== expectedLength ||
      archParams.length !== expectedLength * 2 ||
      chaoticPositions.length !== expectedLength * 3) {
      console.error('Array length mismatch in tether attributes')
      return null
    }

    if (positions.length === 0) {
      console.warn('No tether particles generated')
      return null
    }

    return {
      position: positions,
      color: colors,
      alpha: alphas,
      tetherId: tetherIds,
      archParams: archParams,
      chaoticPosition: chaoticPositions
    }
  } catch (error) {
    console.error('Error in tetherAttributes computation:', error)
    return null
  }
})

const tetherShader = computed(() => {
  try {
    return {
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
    }
  } catch (error) {
    console.error('Error creating tether shader:', error)
    return null
  }
})

const { onLoop } = useRenderLoop()
onLoop(() => {
  try {
    if (!props.enabled || !tetherMaterialRef.value) return

    const material = tetherMaterialRef.value

    if (!material.uniforms) {
      console.warn('Material uniforms not available')
      return
    }

    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = props.globalTime
    }
    if (material.uniforms.uEvolutionProgress) {
      material.uniforms.uEvolutionProgress.value = props.evolutionProgress
    }

    if (tetherPointsRef.value && props.cameraRef?.value) {
      try {
        cameraDistance.value = props.cameraRef.value.position.distanceTo(tetherPointsRef.value.position)
      } catch (e) {
        cameraDistance.value = 1000
      }
    }

    const lodLevel = getCurrentLODLevel(cameraDistance.value, 'tethers')
    if (material.uniforms.uPointSize) {
      material.uniforms.uPointSize.value = lodLevel.particleSize || tetherConfig.particleSize
    }

    if (tetherPointsRef.value && props.galaxyCenter) {
      tetherPointsRef.value.position.set(
        props.galaxyCenter.x,
        props.galaxyCenter.y,
        props.galaxyCenter.z
      )
    }
  } catch (error) {
    console.error('Error in Tethers render loop:', error)
  }
})

watch(() => props.stellarCorePositions, (newPositions, oldPositions) => {
  try {
    if (!newPositions || newPositions.length === 0) {
      console.log('Waiting for stellar core positions...')
      return
    }

    if (newPositions.length !== 20) {
      console.warn(`Expected 20 stellar positions, got ${newPositions.length}`)
      return
    }

    // tetherAttributes is a computed property, so it will automatically update
    console.log('Stellar core positions updated, recalculating tethers')

  } catch (error) {
    console.error('Error watching stellar core positions:', error)
  }
}, { deep: true, immediate: true })

onMounted(() => {
  try {
    console.log('Tethers component mounted')
    console.log('Stellar core positions:', props.stellarCorePositions.length)
    console.log('Tether connections forward:', tetherConnections.forward.length)
    console.log('Tether connections reverse:', tetherConnections.reverse.length)
  } catch (error) {
    console.error('Error in Tethers onMounted:', error)
  }
})
</script>

<template>
  <TresGroup v-if="enabled && tetherAttributes && tetherAttributes.position && tetherAttributes.position.length > 0">
    <TresPoints ref="tetherPointsRef">
      <TresBufferGeometry ref="tetherGeometryRef" :attributes="tetherAttributes" />
      <TresShaderMaterial ref="tetherMaterialRef" v-bind="tetherShader" />
    </TresPoints>
  </TresGroup>
</template>