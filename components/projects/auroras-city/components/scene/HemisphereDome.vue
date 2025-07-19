<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted } from 'vue'

import type { SceneConfig } from '../../config/scene-config'
import { energyShieldVertexShader, energyShieldFragmentShader } from '../../shaders/energy-shield-shader'

interface Props {
    config: SceneConfig
}
const props = defineProps<Props>()

const shieldMaterial = ref()

const shieldUniforms = reactive({
    uTime: { value: 0.0 },
    uDomeRadius: { value: props.config.dome.radius },
    uIntensity: { value: props.config.dome.energyShield.intensity },
    uEdgeGlow: { value: props.config.dome.energyShield.edgeGlow },
    uPulseSpeed: { value: props.config.dome.energyShield.pulseSpeed },
    uNoiseScale: { value: props.config.dome.energyShield.noiseScale },
    uBaseColor: { value: props.config.dome.energyShield.baseColor },
    uEdgeColor: { value: props.config.dome.energyShield.edgeColor },
    uPulseColor: { value: props.config.dome.energyShield.pulseColor }
})

let animationId: number
const animate = () => {
    shieldUniforms.uTime.value += 0.005
    animationId = requestAnimationFrame(animate)
}
onMounted(() => animate())
onUnmounted(() => animationId && cancelAnimationFrame(animationId))

watch(() => props.config.dome.energyShield, (val) => {
    shieldUniforms.uIntensity.value = val.intensity
    shieldUniforms.uEdgeGlow.value = val.edgeGlow
    shieldUniforms.uPulseSpeed.value = val.pulseSpeed
    shieldUniforms.uNoiseScale.value = val.noiseScale
    shieldUniforms.uBaseColor.value = val.baseColor
    shieldUniforms.uEdgeColor.value = val.edgeColor
    shieldUniforms.uPulseColor.value = val.pulseColor
}, { deep: true })
</script>

<template>
    <TresMesh :position="[0, 0, 0]">
        <TresSphereGeometry
            :args="[config.dome.radius, config.dome.segments, config.dome.segments / 2, 0, Math.PI * 2, 0, Math.PI / 2]" />
        <TresShaderMaterial ref="shieldMaterial" :vertexShader="energyShieldVertexShader"
            :fragmentShader="energyShieldFragmentShader" :uniforms="shieldUniforms" :transparent="true"
            :depthWrite="false" :side="1" :blending="2" />
    </TresMesh>
</template>