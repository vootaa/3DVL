<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ShaderMaterial, Clock } from 'three'
import { useLoop } from '@tresjs/core'

import type { SceneConfig } from '../../config/scene-config'
import { createBoundaryRingGeometry } from '../../utils/boundary-ring-geometry'
import { boundaryRingVertexShader, boundaryRingFragmentShader } from '../../shaders/boundary-ring-shader'

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

onMounted(() => {
    clock.start()

    // Create boundary ring geometry using movable boundary radius
    geometry.value = createBoundaryRingGeometry({
        radius: props.config.movement.boundaryRadius + 5.0,
        height: props.config.rings.height, // Moderate height to be visible but not dominant
        thickness: 0.75, // Thick enough to show grid pattern clearly
        segments: 128, // High resolution for smooth curves
        gridDivisions: 32 // Clear grid pattern
    })

    material.value = new ShaderMaterial({
        vertexShader: boundaryRingVertexShader,
        fragmentShader: boundaryRingFragmentShader,
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