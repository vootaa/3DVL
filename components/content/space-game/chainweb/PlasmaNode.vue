<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Color, Vector3 } from 'three'
import { useRenderLoop, useThree } from '@tresjs/core'
import vertexShader from './shaders/plasma-node.vert?raw'
import fragmentShader from './shaders/plasma-node.frag?raw'

// Constants
const DEFAULT_RADIUS = 0.03
const DEFAULT_SEGMENTS = 16
const DEFAULT_PULSE_SPEED = 1.5
const DEFAULT_PULSE_INTENSITY = 0.2
const DISTANCE_THRESHOLD_LOD = 50
const LOD_SEGMENTS_MIN = 8
const LOD_SEGMENTS_REDUCTION_FACTOR = 0.5

const props = defineProps({
    position: {
        type: Object as () => Vector3,
        default: () => new Vector3(0, 0, 0)
    },
    color: {
        type: [Number, String],
        default: 0x5588ff
    },
    radius: {
        type: Number,
        default: DEFAULT_RADIUS
    },
    segments: {
        type: Number,
        default: DEFAULT_SEGMENTS
    },
    pulseSpeed: {
        type: Number,
        default: DEFAULT_PULSE_SPEED
    },
    pulseIntensity: {
        type: Number,
        default: DEFAULT_PULSE_INTENSITY
    }
})

// Convert color to Three.js color if it's a string
const nodeColor = computed(() => {
    if (typeof props.color === 'string') {
        return new Color(props.color)
    }
    return new Color(props.color)
})

// Update shader uniforms
const uniforms = ref({
    color: { value: nodeColor.value },
    time: { value: 0 },
    radius: { value: props.radius },
    pulseSpeed: { value: props.pulseSpeed },
    pulseIntensity: { value: props.pulseIntensity }
})

// Update color when prop changes
watch(() => props.color, (newColor) => {
    uniforms.value.color.value = typeof newColor === 'string' ? new Color(newColor) : new Color(newColor)
})

// Update time uniform for animation
const { onLoop } = useRenderLoop()
onLoop(({ elapsed }) => {
    uniforms.value.time.value = elapsed * 0.001
})

// Performance optimization: Adaptive segments based on distance from camera
const { camera } = useThree()
const adaptiveSegments = computed(() => {
    if (!camera.value) return props.segments

    const distance = camera.value.position.distanceTo(props.position)

    // Reduce complexity for distant nodes
    if (distance > DISTANCE_THRESHOLD_LOD) {
        return Math.max(LOD_SEGMENTS_MIN, Math.floor(props.segments * LOD_SEGMENTS_REDUCTION_FACTOR))
    }
    return props.segments
})
</script>

<template>
    <TresMesh :position="position">
        <TresSphereGeometry :args="[radius, adaptiveSegments, adaptiveSegments]" />
        <TresShaderMaterial :uniforms="uniforms" :vertex-shader="vertexShader" :fragment-shader="fragmentShader" />
    </TresMesh>
</template>
