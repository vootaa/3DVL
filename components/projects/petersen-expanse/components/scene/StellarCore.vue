<script setup lang="ts">
import { ref, onMounted, toRef } from 'vue'
import { AdditiveBlending, ShaderMaterial, BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'
import { useRenderLoop } from '@tresjs/core'

import { orbitalConfig } from '../../configs/orbital-config'
import { starClusterConfig } from '../../configs/star-cluster-config'
import { getCurrentLODLevel } from '../../configs/lodlevel-config'
import { Logger } from '../../../../utils/logger'

import starVertexShader from '../../shaders/star-vertex.glsl'
import starFragmentShader from '../../shaders/star-fragment.glsl'

interface Props {
  galaxyCenter?: Vector3
  globalTime?: number
  evolutionProgress?: number
  enabled?: boolean
  cameraRef?: any
}

const props = withDefaults(defineProps<Props>(), {
  galaxyCenter: () => new Vector3(0, 0, 0),
  globalTime: 0,
  evolutionProgress: 0,
  enabled: true,
  cameraRef: null
})

const galaxyCenter = toRef(props, 'galaxyCenter')
const chaoticPositions = ref<Float32Array>(new Float32Array())
const currentPositions = ref<Vector3[]>([])
function getStellarPositions(): Vector3[] {
  return currentPositions.value
}

const { stars } = starClusterConfig
const stellarCoreColors = starClusterConfig.visual.colors
const stellarCoreSizes = {
  'green-star': { base: 14, amplitude: 0.05 },
  'golden-star': { base: 18, amplitude: 0.10 },
  'blue-star': { base: 28, amplitude: 0.15 }
}
type StellarType = 'green-star' | 'golden-star' | 'blue-star'

const stellarCoreGeometry = ref<BufferGeometry>()
const stellarCoreMaterial = ref<ShaderMaterial>()
const stellarCoreClusterRef = ref()

function initStellarCore() {
  Logger.log('STELLAR', 'Initial stellar attributes...')

  const geometry = new BufferGeometry()
  const positions = new Float32Array(stars.length * 3)
  const colors = new Float32Array(stars.length * 3)
  const sizes = new Float32Array(stars.length)
  const alphas = new Float32Array(stars.length)
  const times = new Float32Array(stars.length)
  const pulseOffsets = new Float32Array(stars.length)
  const targetRadii = new Float32Array(stars.length)
  const initialAngles = new Float32Array(stars.length)
  const chaoticPositionsArray = new Float32Array(stars.length * 3)

  stars.forEach((star, index) => {
    const i3 = index * 3

    const maxChaosRadius = Math.max(1.5, 3.0, 4.8) * 2.0
    const chaosRadius = Math.sqrt(Math.random()) * maxChaosRadius
    const chaosAngle = Math.random() * Math.PI * 2
    const chaosHeight = (Math.random() - 0.5) * 1.5

    chaoticPositionsArray[i3] = Math.cos(chaosAngle) * chaosRadius
    chaoticPositionsArray[i3 + 1] = chaosHeight
    chaoticPositionsArray[i3 + 2] = Math.sin(chaosAngle) * chaosRadius

    positions[i3] = chaoticPositionsArray[i3]
    positions[i3 + 1] = chaoticPositionsArray[i3 + 1]
    positions[i3 + 2] = chaoticPositionsArray[i3 + 2]

    targetRadii[index] = star.r
    initialAngles[index] = star.theta * Math.PI / 180

    const color = stellarCoreColors[star.type as StellarType]
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b

    const sizeConfig = stellarCoreSizes[star.type as StellarType]
    sizes[index] = sizeConfig.base
    alphas[index] = 0.85

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
  geometry.setAttribute('initialAngle', new Float32BufferAttribute(initialAngles, 1))
  geometry.setAttribute('chaoticPosition', new Float32BufferAttribute(chaoticPositionsArray, 3))

  chaoticPositions.value = chaoticPositionsArray

  Logger.log('STELLAR', `Stellar attributes computed for ${stars.length} stars`)

  const material = new ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      globalTime: { value: 0 },
      evolutionProgress: { value: 0 },
      baseRotationSpeed: { value: orbitalConfig.rotationSpeed },
      resolution: { value: [window.innerWidth, window.innerHeight, 1.0] },
      cameraDistance: { value: 10.0 }
    },
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    blending: AdditiveBlending,
    depthTest: false,
    transparent: true
  })

  stellarCoreGeometry.value = geometry
  stellarCoreMaterial.value = material
}

function updateCurrentPositions() {
  const positions: Vector3[] = []
  stars.forEach((star, index) => {
    const smoothProgress = Math.min(1, Math.max(0, props.evolutionProgress))

    const chaoticPos = new Vector3(
      chaoticPositions.value[index * 3],
      chaoticPositions.value[index * 3 + 1],
      chaoticPositions.value[index * 3 + 2]
    )

    const currentAngle = (star.theta * Math.PI / 180) + props.globalTime * orbitalConfig.rotationSpeed
    const orbitalPos = new Vector3(
      star.r * Math.cos(currentAngle),
      0,
      star.r * Math.sin(currentAngle)
    )

    const currentPos = chaoticPos.clone().lerp(orbitalPos, smoothProgress)

    // galaxy center offset
    if (galaxyCenter.value) {
      currentPos.add(galaxyCenter.value)
    }

    positions.push(currentPos)
  })

  currentPositions.value = positions

  /*
  Logger.throttle('STELLAR_UPDATE_POS', `Updated ${positions.length} stellar positions`)
  if (positions.length > 0) {
    Logger.throttle('STELLAR_UPDATE_POS_DETAIL', `First: ${positions[0].toArray().join(', ')}, Last: ${positions[positions.length - 1].toArray().join(', ')}`)
  } */
}

const cameraDistance = ref(1000)

const { onLoop } = useRenderLoop()
onLoop(() => {
  try {
    if (!props.enabled || !stellarCoreMaterial.value) return

    if (stellarCoreClusterRef.value && props.cameraRef?.value) {
      try {
        const cameraPos = props.cameraRef.value.position
        const corePos = stellarCoreClusterRef.value.position

        if (cameraPos && corePos && typeof cameraPos.distanceTo === 'function') {
          cameraDistance.value = cameraPos.distanceTo(corePos)
        }
      } catch (e) {
        Logger.throttle('STELLAR_CAMERA', 'Camera distance calculation failed')
      }
    }

    try {
      const lodLevel = getCurrentLODLevel(cameraDistance.value, 'stellar')

      if (stellarCoreMaterial.value.uniforms.particleSize) {
        stellarCoreMaterial.value.uniforms.particleSize.value = lodLevel.particleSize || 1.0
      }
    } catch (e) {
      Logger.throttle('TETHERS_LOD', 'LOD calculation failed')
    }

    stellarCoreMaterial.value.uniforms.time.value = props.globalTime
    stellarCoreMaterial.value.uniforms.globalTime.value = props.globalTime
    stellarCoreMaterial.value.uniforms.evolutionProgress.value = props.evolutionProgress

    try {
      updateCurrentPositions()
    } catch (error) {
      Logger.error('STELLAR', 'Failed to update stellar positions', error)
    }


    if (stellarCoreClusterRef.value && galaxyCenter) {
      try {
        stellarCoreClusterRef.value.position.set(galaxyCenter.value.x || 0, galaxyCenter.value.y || 0, galaxyCenter.value.z || 0)
      } catch (e) {
        Logger.throttle('TETHERS_POS', 'Position update failed')
      }
    }
  } catch (error) {
    Logger.error('STELLAR', 'Error in StellarCore render loop', error)
  }
})

onMounted(() => {
  try {
    initStellarCore()
  } catch (error) {
    Logger.error('STELLAR', 'Failed to initialize StellarCore', error)
  }
})

defineExpose({
  getStellarPositions
})
</script>

<template>
  <TresGroup v-if="enabled" ref="stellarCoreClusterRef">
    <TresPoints v-if="stellarCoreGeometry && stellarCoreMaterial" :geometry="stellarCoreGeometry"
      :material="stellarCoreMaterial" />
  </TresGroup>
</template>
