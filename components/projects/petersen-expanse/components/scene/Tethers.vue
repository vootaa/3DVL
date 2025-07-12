<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Vector3, BufferAttribute } from 'three'
import { useRenderLoop } from '@tresjs/core'

import { tetherConfig, tetherConnections } from '../../configs/tether-config'
import { Logger } from '../../../../utils/logger'

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

const tetherGeometryRef = ref()
const tetherMaterialRef = ref()
const tetherPointsRef = ref()

const tetherAttributes = computed(() => {
  try {
    if (!props.stellarCorePositions || props.stellarCorePositions.length < 20) {
      Logger.throttle('TETHERS_ATTR', 'Waiting for stellar core positions', props.stellarCorePositions?.length)
      return null
    }

    const positions: number[] = []
    const colors: number[] = []
    const alphas: number[] = []
    const tetherIds: number[] = []
    const archParams: number[] = []
    const chaoticPositions: number[] = []

    let tetherIndex = 0

    // Process forward connections
    tetherConnections.forward.forEach((connection) => {
      try {
        if (!connection || connection.length < 2) {
          Logger.warn('TETHERS', 'Invalid connection format', connection)
          return
        }

        if (connection[0] >= props.stellarCorePositions.length ||
          connection[1] >= props.stellarCorePositions.length) {
          Logger.warn('TETHERS', 'Invalid connection indices', connection)
          return
        }

        const fromPos = props.stellarCorePositions[connection[0]] || new Vector3()
        const toPos = props.stellarCorePositions[connection[1]] || new Vector3()

        if (!fromPos || !toPos) {
          Logger.warn('TETHERS', 'Invalid positions for connection', connection)
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
            Logger.warn('TETHERS', 'Invalid position calculated', pos)
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
      } catch (error) {
        Logger.error('TETHERS', 'Error processing forward connection', error)
      }
    })

    // Process reverse connections
    tetherConnections.reverse.forEach((connection) => {
      try {
        if (!connection || connection.length < 2) return

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
      } catch (error) {
        Logger.error('TETHERS', 'Error processing reverse connection', error)
      }
    })

    // Validation
    if (positions.length === 0) {
      Logger.warn('TETHERS', 'No tether particles generated')
      return null
    }

    const expectedLength = positions.length / 3
    if (colors.length !== expectedLength * 3 ||
      alphas.length !== expectedLength ||
      tetherIds.length !== expectedLength ||
      archParams.length !== expectedLength * 2 ||
      chaoticPositions.length !== expectedLength * 3) {
      Logger.error('TETHERS', 'Array length mismatch in tether attributes')
      return null
    }

    if (positions.length === 0) {
      Logger.warn('TETHERS', 'No tether particles generated')
      return null
    }

    // Return BufferAttribute objects instead of plain arrays
    return {
      position: new BufferAttribute(new Float32Array(positions), 3),
      color: new BufferAttribute(new Float32Array(colors), 3),
      alpha: new BufferAttribute(new Float32Array(alphas), 1),
      tetherId: new BufferAttribute(new Float32Array(tetherIds), 1),
      archParams: new BufferAttribute(new Float32Array(archParams), 2),
      chaoticPosition: new BufferAttribute(new Float32Array(chaoticPositions), 3)
    }
  } catch (error) {
    Logger.error('TETHERS', 'Error in tetherAttributes computation', error)
    return null
  }
})

const tetherShader = computed(() => {
  try {
    if (!tetherVertexShader || !tetherFragmentShader) {
      Logger.error('TETHERS', 'Shader files not loaded')
      return null
    }

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
    Logger.error('TETHERS', 'Error creating tether shader', error)
    return null
  }
})

const { onLoop } = useRenderLoop()
onLoop(() => {
  try {
    if (!props.enabled || !tetherMaterialRef.value) return

    const material = tetherMaterialRef.value

    if (!material.uniforms) {
      Logger.throttle('TETHERS', 'Material uniforms not available')
      return
    }

    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = props.globalTime || 0
    }
    if (material.uniforms.uEvolutionProgress) {
      material.uniforms.uEvolutionProgress.value = props.evolutionProgress || 0
    }

    if (tetherPointsRef.value && props.galaxyCenter) {
      try {
        tetherPointsRef.value.position.set(props.galaxyCenter.x || 0, props.galaxyCenter.y || 0, props.galaxyCenter.z || 0)
      } catch (e) {
        Logger.throttle('TETHERS_POS', 'Position update failed')
      }
    }
  } catch (error) {
    Logger.error('TETHERS', 'Error in Tethers render loop', error)
  }
})

// Safer watch
watch(() => props.stellarCorePositions, (newPositions, _oldPositions) => {
  try {
    if (!newPositions || newPositions.length === 0) {
      Logger.throttle('TETHERS_WATCH', 'Waiting for stellar core positions...')
      return
    }

    if (newPositions.length !== 20) {
      Logger.throttle('TETHERS_WATCH', `Expected 20 stellar positions, got ${newPositions.length}`)
      return
    }

    Logger.throttle('TETHERS_WATCH', 'Stellar core positions updated, recalculating tethers')
  } catch (error) {
    Logger.error('TETHERS', 'Error watching stellar core positions', error)
  }
}, { deep: true, immediate: true })

onMounted(() => {
  try {
    Logger.log('TETHERS', 'Tethers component mounted')
    Logger.log('TETHERS', 'Stellar core positions', props.stellarCorePositions?.length || 0)
    Logger.log('TETHERS', 'Tether connections forward', tetherConnections.forward.length)
    Logger.log('TETHERS', 'Tether connections reverse', tetherConnections.reverse.length)
  } catch (error) {
    Logger.error('TETHERS', 'Error in Tethers onMounted', error)
  }
})
</script>

<template>
  <TresGroup
    v-if="enabled && tetherAttributes && tetherShader && tetherAttributes.position && tetherAttributes.position.array.length > 0">
    <TresPoints ref="tetherPointsRef">
      <TresBufferGeometry ref="tetherGeometryRef" :attributes="tetherAttributes" />
      <TresShaderMaterial ref="tetherMaterialRef" v-bind="tetherShader" />
    </TresPoints>
  </TresGroup>
</template>