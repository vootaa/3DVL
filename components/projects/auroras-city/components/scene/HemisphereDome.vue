<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted } from 'vue'

import type { SceneConfig } from '../../config/scene-config'
import { auroraVertexShader, auroraFragmentShader } from '../../shaders/aurora-shader'

interface Props {
    config: SceneConfig
}

const props = defineProps<Props>()

const auroraMaterial = ref()

// Aurora shader uniforms
const shaderUniforms = reactive({
    uTime: { value: 0.0 },
    uDomeRadius: { value: props.config.dome.radius },
    uPlainRadius: { value: props.config.terrain.plainRadius },
    uAuroraIntensity: { value: 1.0 },
    uAuroraColor1: { value: [0.0, 1.0, 0.8] },  // Cyan-green
    uAuroraColor2: { value: [0.4, 0.2, 1.0] },  // Purple-blue
    uAuroraColor3: { value: [1.0, 0.3, 0.6] }   // Pink-red
})

let animationId: number

// Animation loop for aurora effects
const animate = () => {
    shaderUniforms.uTime.value += 0.016 // ~60fps

    // Dynamic aurora intensity variation
    const baseIntensity = 0.6
    const variation = Math.sin(shaderUniforms.uTime.value * 0.5) * 0.2
    shaderUniforms.uAuroraIntensity.value = baseIntensity + variation

    animationId = requestAnimationFrame(animate)
}

const updateUniforms = () => {
    shaderUniforms.uDomeRadius.value = props.config.dome.radius
    shaderUniforms.uPlainRadius.value = props.config.terrain.plainRadius
}

onMounted(() => {
    updateUniforms()
    animate() // Start aurora animation
})

onUnmounted(() => {
    if (animationId) {
        cancelAnimationFrame(animationId)
    }
})

// Update uniforms when config changes
watch(() => [props.config.dome, props.config.terrain.plainRadius], () => {
    updateUniforms()
}, { deep: true })
</script>

<template>
    <TresMesh :position="[0, 0, 0]">
        <TresSphereGeometry :args="[config.dome.radius, config.dome.segments, config.dome.segments / 2,
            0, Math.PI * 2, 0, Math.PI / 2]" />
        <TresShaderMaterial ref="auroraMaterial" :vertexShader="auroraVertexShader"
            :fragmentShader="auroraFragmentShader" :uniforms="shaderUniforms" :transparent="true" :depthWrite="false"
            :side="1" :blending="2" />
    </TresMesh>
</template>