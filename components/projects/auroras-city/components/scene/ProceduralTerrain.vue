<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted } from 'vue'
import { PlaneGeometry } from 'three'


import type { SceneConfig } from '../../config/scene-config'
import { calculateTerrainHeight } from '../../utils/terrain-utils'
import { terrainVertexShader, terrainFragmentShader } from '../../shaders/terrain-shader'

interface Props {
  config: SceneConfig
}

const props = defineProps<Props>()

const terrainMesh = ref()
const terrainGeometry = ref()
const terrainMaterial = ref()

// Shader uniforms
const shaderUniforms = reactive({
  uTime: { value: 0.0 },
  uPlainRadius: { value: props.config.terrain.plainRadius },
  uTransitionRadius: { value: props.config.terrain.transitionRadius },
  uMountainRadius: { value: props.config.terrain.mountainRadius },
  uMaxHeight: { value: props.config.terrain.maxHeight },
  uEnergyEffects: { value: props.config.terrain.enableEnergyEffects }
})

let animationId: number

// Animation loop for time uniform
const animate = () => {
  shaderUniforms.uTime.value += 0.016 // ~60fps
  animationId = requestAnimationFrame(animate)
}

const generateTerrain = () => {
  if (!terrainGeometry.value) return

  const geometry = terrainGeometry.value as PlaneGeometry
  const positions = geometry.attributes.position.array as Float32Array

  // Modify vertices height
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const z = positions[i + 1] // Note: PlaneGeometry uses Y as the second coordinate

    // Calculate height using enhanced terrain function
    const height = calculateTerrainHeight(x, z, props.config.terrain)
    positions[i + 2] = height // Set Y position (height)
  }

  // Update geometry
  geometry.attributes.position.needsUpdate = true
  geometry.computeVertexNormals() // Recalculate normals for proper lighting
}

const updateUniforms = () => {
  shaderUniforms.uPlainRadius.value = props.config.terrain.plainRadius
  shaderUniforms.uTransitionRadius.value = props.config.terrain.transitionRadius
  shaderUniforms.uMountainRadius.value = props.config.terrain.mountainRadius
  shaderUniforms.uMaxHeight.value = props.config.terrain.maxHeight
  shaderUniforms.uEnergyEffects.value = props.config.terrain.enableEnergyEffects
}

onMounted(() => {
  // Generate terrain after component is mounted
  setTimeout(() => {
    generateTerrain()
    updateUniforms()
    animate() // Start animation loop
  }, 100)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

// Regenerate terrain when config changes
watch(() => props.config.terrain, () => {
  generateTerrain()
  updateUniforms()
}, { deep: true })
</script>


<template>
  <TresMesh ref="terrainMesh" :position="[0, 0, 0]" :rotation="[-Math.PI / 2, 0, 0]">
    <TresPlaneGeometry ref="terrainGeometry"
      :args="[config.terrain.size, config.terrain.size, config.terrain.segments, config.terrain.segments]" />
    <TresShaderMaterial ref="terrainMaterial" :vertexShader="terrainVertexShader"
      :fragmentShader="terrainFragmentShader" :uniforms="shaderUniforms" />
  </TresMesh>
</template>
