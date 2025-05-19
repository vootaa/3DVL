<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { BufferGeometry, Material } from 'three'

import { useLoop } from '@tresjs/core'
import { MeshStandardMaterial, Color, Group, PointLight } from 'three'
import { shallowRef, ref, onMounted } from 'vue'

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
  spaceProbeNode: null as GLTFNode | null,
  isLoaded: false,
})

// Create refs for the probe group
const probeLight = shallowRef(new PointLight())
const probeGroup = shallowRef(new Group())

const probeMaterial = new MeshStandardMaterial({
  color: new Color('#d8d8e0'),
  metalness: 0.8,
  roughness: 0.2,
})

onMounted(async () => {
  try {
    const result = await ResourceLoader.registerModel('SpaceProbeModel', '/models/space-game/SpaceProbe.glb')
    if (result?.nodes?.SpaceProbe_mesh) {
      modelData.value.spaceProbeNode = result.nodes.SpaceProbe_mesh as GLTFNode
      modelData.value.isLoaded = true
      console.log('SpaceProbeModel loaded successfully')
    }
    else {
      console.error('SpaceProbe missing SpaceProbe node')
    }
  }
  catch (error) {
    console.error('Failed to load SpaceProbeModel:', error)
  }
})

useLoop().onBeforeRender(({ elapsed }) => {
  if (probeGroup.value) {
    // Rotate the probe at a different speed than the space station
    probeGroup.value.rotation.y += 0.002
    probeGroup.value.rotation.x += 0.001

    if (probeLight.value) {
      // Make the light pulse at a different frequency
      probeLight.value.intensity = 1.5 + Math.sin(elapsed * 0.8)
    }
  }
})
</script>

<template>
  <TresGroup
    ref="probeGroup"
    :position="props.position"
    :rotation="props.rotation"
    :scale="[props.scale, props.scale, props.scale]"
  >
    <template v-if="modelData.isLoaded && modelData.spaceProbeNode">
      <TresMesh
        :geometry="modelData.spaceProbeNode.geometry"
        :material="modelData.spaceProbeNode.material"
      />
    </template>
    <template v-else>
      <TresMesh :material="probeMaterial">
        <TresSphereGeometry :args="[1, 16, 16]" />
      </TresMesh>
    </template>

    <TresPointLight
      ref="probeLight"
      color="#33ccff"
      :intensity="1.5"
      :distance="400"
      :decay="2"
      :position="[0, 5, 0]"
    />

    <TresPointLight
      color="#00ff88"
      :intensity="0.8"
      :distance="150"
      :position="[10, 5, 10]"
    />
  </TresGroup>
</template>