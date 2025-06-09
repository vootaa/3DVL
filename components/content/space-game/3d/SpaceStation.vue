<script setup lang="ts">
import type { BufferGeometry, Material } from 'three'

import { useLoop } from '@tresjs/core'
import { MeshStandardMaterial, Color, Group, PointLight } from 'three'
import { shallowRef, ref, onMounted } from 'vue'

import { Logger } from '../../logger'
import { ResourceLoader } from '../utils/ResourceLoader'

const props = defineProps({
  position: {
    type: Array as unknown as () => [number, number, number],
    required: true,
  },
  rotation: {
    type: Array as unknown as () => [number, number, number],
    required: true,
  },
  scale: {
    type: Number,
    required: true,
  },
})

interface GLTFNode {
  geometry: BufferGeometry
  material: Material | Material[]
}

const modelData = ref({
  stationNode: null as GLTFNode | null,
  isLoaded: false,
})

// Create refs for the station group
const stationLight = shallowRef(new PointLight())
const stationGroup = shallowRef(new Group())

const stationMaterial = new MeshStandardMaterial({
  color: new Color('#d0d0d8'),
  metalness: 0.7,
  roughness: 0.3,
})

onMounted(async () => {
  Logger.log('SPACE_STATION', 'Initializing space station component', {
    position: props.position,
    rotation: props.rotation,
    scale: props.scale
  })

  try {
    const result = await ResourceLoader.registerModel('SpaceStationModel',
      '/models/space-game/InternationalSpaceStation.glb')
    
    if (result?.nodes?.InternationalSpaceStation_mesh) {
      modelData.value.stationNode = result.nodes.InternationalSpaceStation_mesh as GLTFNode
      modelData.value.isLoaded = true
      
      Logger.log('SPACE_STATION', 'Space station model loaded successfully', {
        modelName: 'SpaceStationModel',
        nodeName: 'InternationalSpaceStation_mesh',
        hasGeometry: !!modelData.value.stationNode.geometry,
        hasMaterial: !!modelData.value.stationNode.material
      })
    } else {
      Logger.error('SPACE_STATION', 'Space station model missing required node', {
        modelName: 'SpaceStationModel',
        expectedNode: 'InternationalSpaceStation_mesh',
        availableNodes: result?.nodes ? Object.keys(result.nodes) : []
      })
    }
  } catch (error) {
    Logger.error('SPACE_STATION', 'Failed to load space station model', {
      modelName: 'SpaceStationModel',
      modelPath: '/models/space-game/InternationalSpaceStation.glb',
      error
    })
  }
})

useLoop().onBeforeRender(({ elapsed }) => {
  if (stationGroup.value) {
    stationGroup.value.rotation.y += 0.001

    if (stationLight.value) {
      const newIntensity = 2 + Math.sin(elapsed * 0.5)
      stationLight.value.intensity = newIntensity
      
      // Log animation state occasionally
      Logger.random('SPACE_STATION', 'Animation update', {
        rotationY: stationGroup.value.rotation.y,
        lightIntensity: newIntensity,
        elapsed
      }, 0.01)
    }
  }
})
</script>

<template>
  <TresGroup
    ref="stationGroup"
    :position="props.position"
    :rotation="props.rotation"
    :scale="[props.scale, props.scale, props.scale]"
  >
    <template v-if="modelData.isLoaded && modelData.stationNode">
      <TresMesh
        :geometry="modelData.stationNode.geometry"
        :material="modelData.stationNode.material"
      />
    </template>
    <template v-else>
      <TresMesh :material="stationMaterial">
        <TresBoxGeometry :args="[4, 1, 2]" />
      </TresMesh>
    </template>

    <TresPointLight
      ref="stationLight"
      color="#3399ff"
      :intensity="2"
      :distance="800"
      :decay="2"
      :position="[0, 10, 0]"
    />

    <TresPointLight
      color="#ff0000"
      :intensity="1"
      :distance="200"
      :position="[20, 20, 20]"
    />
  </TresGroup>
</template>