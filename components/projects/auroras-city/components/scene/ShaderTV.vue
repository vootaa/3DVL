<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ShaderMaterial, Clock, Vector2, DoubleSide } from 'three'
import { useLoop } from '@tresjs/core'

import type { SceneConfig } from '../../config/scene-config'
import { polarToCartesian } from '../../config/scene-config'
import { createShaderTVGeometry } from '../../utils/shader-tv-geometry'
import { shaderTVVertexShader, getMultiShaderTVFragmentShader } from '../../shaders/shader-tv-shader'
import { isValidShaderName } from '../../shaders/shader-registry'

import { Logger } from '~/components/utils/logger'

interface Props {
    config: SceneConfig
}

const props = defineProps<Props>()

const geometry = ref()
const material = ref()
const meshRef = ref()

const clock = new Clock()

const tvConfigs = computed(() => {
    // Calculate all TV configs
    return props.config.shaderTV.tvs.map((tv, index) => ({
        position: polarToCartesian(tv.radius, tv.angle, 0),
        screenSize: tv.screenSize ?? props.config.shaderTV.defaultScreenSize,
        baseWidth: tv.baseWidth ?? props.config.shaderTV.defaultBaseWidth,
        baseHeight: tv.baseHeight ?? props.config.shaderTV.defaultBaseHeight,
        tvIndex: index
    }))
})

const shaderSources = computed(() => {
    // Extract and validate all shader names
    return props.config.shaderTV.tvs.map(tv => {
        if (!isValidShaderName(tv.shaderSource)) {
            Logger.warn('ShaderValidate', `Invalid shader name: ${tv.shaderSource}, using default shader`)
            return 'default-shader'
        }
        return tv.shaderSource
    })
})

// Create uniforms - support multiple TVs
const uniforms = ref({
    iTime: { value: 0 },
    iResolution: { value: new Vector2(600, 600) },
    uTVCount: { value: 0 } // TV count
})

onMounted(() => {
    clock.start()

    // Create geometry - pass all TV configs
    geometry.value = createShaderTVGeometry(tvConfigs.value)

    // Update uniforms
    uniforms.value.uTVCount.value = props.config.shaderTV.tvs.length

    // Create material - pass all shader sources
    material.value = new ShaderMaterial({
        vertexShader: shaderTVVertexShader,
        fragmentShader: getMultiShaderTVFragmentShader(shaderSources.value),
        uniforms: uniforms.value,
        transparent: false,
        depthWrite: true,
        depthTest: true,
        side: DoubleSide, // Use Three.js constant
    })
})

const { onBeforeRender } = useLoop()

onBeforeRender(() => {
    if (uniforms.value) {
        const elapsed = clock.getElapsedTime()
        uniforms.value.iTime.value = elapsed
    }
})

onUnmounted(() => {
    if (material.value) material.value.dispose()
    if (geometry.value) geometry.value.dispose()
    clock.stop()
})
</script>

<template>
    <TresMesh v-if="tvConfigs.length > 0 && geometry && material" ref="meshRef" :material="material"
        :geometry="geometry" />
</template>