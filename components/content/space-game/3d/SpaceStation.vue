<script setup lang="ts">
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { shallowRef } from 'vue'
import { useLoader, useLoop } from '@tresjs/core'
import { Group, PointLight } from 'three'

// Load the space station model with nodes and materials
const { scene, nodes, materials } = await useLoader(GLTFLoader, '/models/space-game/InternationalSpaceStation.glb')

// Create refs for the station group
const stationGroup = shallowRef(new Group())
const stationLight = shallowRef(new PointLight())

// Define initial position - adjust these values as needed
const position = [500, 100, -800]
const scale = 30

useLoop().onBeforeRender(({ elapsed }) => {
    // Animation code...
})
</script>

<template>
    <TresGroup ref="stationGroup" :position="position" :scale="[scale, scale, scale]">
        <!-- Option 1: Use specific meshes if available in the model -->
        <TresMesh v-if="nodes.InternationalSpaceStation_mesh" :geometry="nodes.InternationalSpaceStation_mesh.geometry">
            <TresMeshStandardMaterial color="#b0c4de" :metalness="0.8" :roughness="0.2" emissive="#3366ff"
                :emissiveIntensity="0.2" />
        </TresMesh>

        <!-- Option 2: If the model structure is different, use primitive as fallback -->
        <primitive v-else :object="scene" />

        <!-- Add point light -->
        <TresPointLight ref="stationLight" color="#3399ff" :intensity="2" :distance="1000" :decay="2"
            :position="[0, 10, 0]" />
    </TresGroup>
</template>