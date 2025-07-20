<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ShaderMaterial, Clock } from 'three'
import { useLoop } from '@tresjs/core'

import type { SceneConfig } from '../../config/scene-config'
import { createOrbitalRingsGeometry } from '../../utils/orbital-rings-geometry'
import { orbitalRingsVertexShader, orbitalRingsFragmentShader } from '../../shaders/orbital-rings-shader'

interface Props {
    config: SceneConfig
}

const props = defineProps<Props>()

const geometry = ref()
const material = ref()
const meshRef = ref()

const clock = new Clock()

const uniforms = {
    uTime: { value: 0 },
    uEnergyIntensity: { value: 1.0 }
}

onMounted(() => {
    clock.start()

    // Create unified geometry for all rings
    geometry.value = createOrbitalRingsGeometry({
        rings: props.config.rings,
        height: props.config.rings.height,
        thickness: props.config.rings.thickness,
        segments: 64
    })

    material.value = new ShaderMaterial({
        vertexShader: orbitalRingsVertexShader,
        fragmentShader: orbitalRingsFragmentShader,
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