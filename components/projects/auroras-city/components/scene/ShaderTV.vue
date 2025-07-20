<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ShaderMaterial, Clock, Vector2 } from 'three'
import { useLoop } from '@tresjs/core'

import type { SceneConfig } from '../../config/scene-config'
import { polarToCartesian } from '../../config/scene-config'
import { createShaderTVGeometry } from '../../utils/shader-tv-geometry'
import { shaderTVVertexShader, getShaderTVFragmentShader } from '../../shaders/shader-tv-shader'

interface Props {
    config: SceneConfig
    shaderSource: string
}

const props = defineProps<Props>()

const geometry = ref()
const material = ref()
const meshRef = ref()

const clock = new Clock()
// Calculate TV position
const tvPosition = computed(() => {
    const pos3d = polarToCartesian(
        props.config.shaderTV.radius,
        props.config.shaderTV.angle,
        0
    )
    return { x: pos3d.x, z: pos3d.z }
})

// Create uniforms - minimal configuration
const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new Vector2(800, 800) } // Fixed resolution for simplicity
}

onMounted(() => {
    clock.start()

    // Create geometry - use config parameters
    geometry.value = createShaderTVGeometry({
        tv: {
            positions: [tvPosition.value],
            screenSize: props.config.shaderTV.screenSize,
            baseWidth: props.config.shaderTV.baseWidth,
            baseHeight: props.config.shaderTV.baseHeight
        }
    })

    // Create material
    material.value = new ShaderMaterial({
        vertexShader: shaderTVVertexShader,
        fragmentShader: getShaderTVFragmentShader(props.shaderSource),
        uniforms,
        transparent: false,
        depthWrite: true,
        depthTest: true,
        side: 2, // DoubleSide for screen
    })
})

const { onBeforeRender } = useLoop()

onBeforeRender(() => {
    const elapsed = clock.getElapsedTime()
    uniforms.iTime.value = elapsed
})

onUnmounted(() => {
    if (material.value) material.value.dispose()
    if (geometry.value) geometry.value.dispose()
    clock.stop()
})
</script>

<template>
    <TresMesh v-if="shaderSource && geometry && material" ref="meshRef" :material="material" :geometry="geometry" />
</template>