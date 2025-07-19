<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { PlaneGeometry, BufferAttribute, Color } from 'three'

import type { SceneConfig } from '../../config/scene-config'
import { calculateTerrainHeight, getTerrainColor } from '../../utils/terrain-utils'

interface Props {
  config: SceneConfig
}

const props = defineProps<Props>()

const terrainMesh = ref()
const terrainGeometry = ref()

const generateTerrain = () => {
  if (!terrainGeometry.value) return
  
  const geometry = terrainGeometry.value as PlaneGeometry
  const positions = geometry.attributes.position.array as Float32Array
  const colors: number[] = []
  
  // Modify vertices and assign colors
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const z = positions[i + 1] // Note: PlaneGeometry uses Y as the second coordinate
    
    // Calculate height using terrain function
    const height = calculateTerrainHeight(x, z, props.config.terrain)
    positions[i + 2] = height // Set Y position (height)
    
    // Calculate distance for color determination
    const distance = Math.sqrt(x * x + z * z)
    const colorHex = getTerrainColor(height, distance, props.config.terrain)
    const color = new Color(colorHex)
    
    // Add RGB values to colors array
    colors.push(color.r, color.g, color.b)
  }
  
  // Update geometry
  geometry.attributes.position.needsUpdate = true
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
  geometry.computeVertexNormals() // Recalculate normals for proper lighting
}

onMounted(() => {
  // Generate terrain after component is mounted
  setTimeout(() => {
    generateTerrain()
  }, 100)
})

// Regenerate terrain when config changes
watch(() => props.config.terrain, () => {
  generateTerrain()
}, { deep: true })
</script>

<template>
    <TresMesh ref="terrainMesh" :position="[0, 0, 0]" :rotation="[-Math.PI / 2, 0, 0]">
        <TresPlaneGeometry ref="terrainGeometry"
            :args="[config.terrain.size, config.terrain.size, config.terrain.segments, config.terrain.segments]" />
        <TresMeshLambertMaterial :vertexColors="true" :wireframe="false" />
    </TresMesh>
</template>