<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted } from 'vue'

import type { SceneConfig } from '../../config/scene-config'
import { orbitalRingsVertexShader, orbitalRingsFragmentShader } from '../../shaders/orbital-rings-shader'

interface Props {
    config: SceneConfig
}

const props = defineProps<Props>()

const innerRingMesh = ref()
const middleRingMesh = ref()
const outerRingMesh = ref()

const innerRingGeometry = ref()
const middleRingGeometry = ref()
const outerRingGeometry = ref()

const innerRingMaterial = ref()
const middleRingMaterial = ref()
const outerRingMaterial = ref()

// Common shader uniforms for all rings
const createShaderUniforms = (ringType: 'inner' | 'middle' | 'outer') => reactive({
    uTime: { value: 0.0 },
    uRingType: { value: ringType === 'inner' ? 0.0 : ringType === 'middle' ? 1.0 : 2.0 },
    uRadius: { value: props.config.rings[ringType].radius },
    uWidth: { value: props.config.rings[ringType].width },
    uHeight: { value: props.config.rings.height },
    uThickness: { value: props.config.rings.thickness },
    uEnergyIntensity: { value: ringType === 'inner' ? 1.2 : ringType === 'middle' ? 1.0 : 0.8 },
    uInnerRadius: { value: props.config.rings[ringType].radius - props.config.rings[ringType].width / 2 },
    uOuterRadius: { value: props.config.rings[ringType].radius + props.config.rings[ringType].width / 2 }
})

const innerUniforms = createShaderUniforms('inner')
const middleUniforms = createShaderUniforms('middle')
const outerUniforms = createShaderUniforms('outer')

let animationId: number

// Animation loop - only for shader time animation
const animate = () => {
    // Update time uniforms for shader effects only
    innerUniforms.uTime.value += 0.01
    middleUniforms.uTime.value += 0.01
    outerUniforms.uTime.value += 0.01

    animationId = requestAnimationFrame(animate)
}

const updateUniforms = () => {
    // Update inner ring uniforms
    innerUniforms.uRadius.value = props.config.rings.inner.radius
    innerUniforms.uWidth.value = props.config.rings.inner.width
    innerUniforms.uHeight.value = props.config.rings.height
    innerUniforms.uThickness.value = props.config.rings.thickness
    innerUniforms.uInnerRadius.value = props.config.rings.inner.radius - props.config.rings.inner.width / 2
    innerUniforms.uOuterRadius.value = props.config.rings.inner.radius + props.config.rings.inner.width / 2

    // Update middle ring uniforms
    middleUniforms.uRadius.value = props.config.rings.middle.radius
    middleUniforms.uWidth.value = props.config.rings.middle.width
    middleUniforms.uHeight.value = props.config.rings.height
    middleUniforms.uThickness.value = props.config.rings.thickness
    middleUniforms.uInnerRadius.value = props.config.rings.middle.radius - props.config.rings.middle.width / 2
    middleUniforms.uOuterRadius.value = props.config.rings.middle.radius + props.config.rings.middle.width / 2

    // Update outer ring uniforms
    outerUniforms.uRadius.value = props.config.rings.outer.radius
    outerUniforms.uWidth.value = props.config.rings.outer.width
    outerUniforms.uHeight.value = props.config.rings.height
    outerUniforms.uThickness.value = props.config.rings.thickness
    outerUniforms.uInnerRadius.value = props.config.rings.outer.radius - props.config.rings.outer.width / 2
    outerUniforms.uOuterRadius.value = props.config.rings.outer.radius + props.config.rings.outer.width / 2
}

onMounted(() => {
    setTimeout(() => {
        updateUniforms()
        animate()
    }, 100)
})

onUnmounted(() => {
    if (animationId) {
        cancelAnimationFrame(animationId)
    }
})

watch(() => props.config.rings, () => {
    updateUniforms()
}, { deep: true })
</script>

<template>
    <TresGroup :scale="[1, config.rings.thickness, 1]" :position="[0, config.rings.height, 0]">
        <!-- Inner Ring -->
        <TresMesh ref="innerRingMesh" :rotation="[-Math.PI / 2, 0, 0]">
            <TresTorusGeometry ref="innerRingGeometry" :args="[
                config.rings.inner.radius,
                config.rings.inner.width / 2,
                16,
                64
            ]" />
            <TresShaderMaterial ref="innerRingMaterial" :vertexShader="orbitalRingsVertexShader"
                :fragmentShader="orbitalRingsFragmentShader" :uniforms="innerUniforms" :transparent="true"
                :depthWrite="true" :side="2" />
        </TresMesh>

        <!-- Middle Ring -->
        <TresMesh ref="middleRingMesh" :rotation="[-Math.PI / 2, 0, 0]">
            <TresTorusGeometry ref="middleRingGeometry" :args="[
                config.rings.middle.radius,
                config.rings.middle.width / 2,
                16,
                64
            ]" />
            <TresShaderMaterial ref="middleRingMaterial" :vertexShader="orbitalRingsVertexShader"
                :fragmentShader="orbitalRingsFragmentShader" :uniforms="middleUniforms" :transparent="true"
                :depthWrite="true" :side="2" />
        </TresMesh>

        <!-- Outer Ring -->
        <TresMesh ref="outerRingMesh" :rotation="[-Math.PI / 2, 0, 0]">
            <TresTorusGeometry ref="outerRingGeometry" :args="[
                config.rings.outer.radius,
                config.rings.outer.width / 2,
                16,
                64
            ]" />
            <TresShaderMaterial ref="outerRingMaterial" :vertexShader="orbitalRingsVertexShader"
                :fragmentShader="orbitalRingsFragmentShader" :uniforms="outerUniforms" :transparent="true"
                :depthWrite="true" :side="2" />
        </TresMesh>
    </TresGroup>
</template>