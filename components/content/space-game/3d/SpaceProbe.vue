<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoader, useLoop } from '@tresjs/core'
import { MeshStandardMaterial, Color, Group, PointLight } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

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

// Load the space probe model with nodes and materials
const { scene } = await useLoader(GLTFLoader as any, '/models/space-game/SpaceProbe.glb') as any

// Create refs for the probe group
const probeLight = shallowRef(new PointLight())
const probeGroup = shallowRef(new Group())

const probeMaterial = new MeshStandardMaterial({
  color: new Color('#d8d8e0'),
  metalness: 0.8,
  roughness: 0.2,
})

scene.traverse((object: { isMesh: any; name: string; material: MeshStandardMaterial }) => {
  if (object.isMesh && object.name === 'SpaceProbe_mesh') {
    object.material = probeMaterial
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
    :position="position"
    :rotation="rotation"
    :scale="[scale, scale, scale]"
  >
    <primitive :object="scene" />

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