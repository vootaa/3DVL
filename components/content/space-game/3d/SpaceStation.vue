<script setup lang="ts">
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { shallowRef } from 'vue'
import { useLoader, useLoop } from '@tresjs/core'
import { MeshStandardMaterial, Color, Group, PointLight } from 'three'

const props = defineProps({
    position: {
        type: Array as unknown as () => [number, number, number],
        required: true
    },
    rotation: {
        type: Array as unknown as () => [number, number, number],
        required: true
    },
    scale: {
        type: Number,
        required: true
    }
});

// Load the space station model with nodes and materials
const { scene } = await useLoader(GLTFLoader as any, '/models/space-game/InternationalSpaceStation.glb') as any

// Create refs for the station group
const stationLight = shallowRef(new PointLight())
const stationGroup = shallowRef(new Group())

const stationMaterial = new MeshStandardMaterial({
    color: new Color('#d0d0d8'),
    metalness: 0.7,
    roughness: 0.3,
})

scene.traverse((object: { isMesh: any; name: string; material: MeshStandardMaterial; }) => {
    if (object.isMesh && object.name === 'InternationalSpaceStation_mesh') {
        object.material = stationMaterial
    }
})

useLoop().onBeforeRender(({ elapsed }) => {
    if (stationGroup.value) {
        stationGroup.value.rotation.y += 0.001

        if (stationLight.value) {
            stationLight.value.intensity = 2 + Math.sin(elapsed * 0.5)
        }
    }
})
</script>

<template>
    <TresGroup :position="position" :rotation="rotation" :scale="[scale, scale, scale]" ref="stationGroup">
        <primitive :object="scene" />

        <TresPointLight ref="stationLight" color="#3399ff" :intensity="2" :distance="800" :decay="2"
            :position="[0, 10, 0]" />

        <TresPointLight color="#ff0000" :intensity="1" :distance="200" :position="[20, 20, 20]" />
    </TresGroup>
</template>