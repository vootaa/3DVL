<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ShaderMaterial, Clock } from 'three'
import { useLoop } from '@tresjs/core'

import type { SceneConfig } from '../../config/scene-config'
import { petersenNodes, polarToCartesian } from '../../config/scene-config'
import { createTemplesGeometry } from '../../utils/temples-geometry'
import { templesVertexShader, templesFragmentShader } from '../../shaders/temples-shader'

interface Props {
    config: SceneConfig
}

const props = defineProps<Props>()

const geometry = ref()
const material = ref()
const meshRef = ref()

const clock = new Clock()

const uniforms = {
    uTime: { value: 0 }
}

// Convert Petersen nodes to temple positions
const templePositions = computed(() => {
    return petersenNodes.map(node => {
        const pos3d = polarToCartesian(node.r, node.theta, 0)
        return { x: pos3d.x, z: pos3d.z }
    })
})

onMounted(() => {
    clock.start()

    // Create unified geometry for all temples
    geometry.value = createTemplesGeometry({
        temples: {
            positions: templePositions.value,
            height: props.config.temples.height || 3.0,
            baseSize: props.config.temples.baseSize || 1.0
        }
    })

    material.value = new ShaderMaterial({
        vertexShader: templesVertexShader,
        fragmentShader: templesFragmentShader,
        uniforms,
        transparent: false,
        depthWrite: true,
        depthTest: true,
        side: 2, // DoubleSide
    })
})

const { onBeforeRender } = useLoop()

onBeforeRender(() => {
    const elapsed = clock.getElapsedTime()
    uniforms.uTime.value = elapsed
})

onUnmounted(() => {
    if (material.value) material.value.dispose()
    if (geometry.value) geometry.value.dispose()
    clock.stop()
})
</script>

<template>
    <TresMesh v-if="geometry && material" ref="meshRef" :material="material" :geometry="geometry" />
</template>