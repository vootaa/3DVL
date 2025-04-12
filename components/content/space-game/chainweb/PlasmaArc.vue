<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Color, Vector3, CatmullRomCurve3 } from 'three'
import { useRenderLoop, useThree } from '@tresjs/core'
import vertexShader from './shaders/plasma-arc.vert?raw'
import fragmentShader from './shaders/plasma-arc.frag?raw'

// Constants
const DEFAULT_THICKNESS = 0.01
const DEFAULT_ARC_HEIGHT = 0.05
const DEFAULT_FLOW_SPEED = 1.0
const DISTANCE_THRESHOLD_LOD_HIGH = 100
const DISTANCE_THRESHOLD_LOD_MEDIUM = 50
const SEGMENTS_LOD_HIGH_INTER = 16
const SEGMENTS_LOD_MEDIUM_INTER = 32
const SEGMENTS_LOD_LOW_INTER = 64
const SEGMENTS_LOD_HIGH_SAME = 8
const SEGMENTS_LOD_MEDIUM_SAME = 16
const SEGMENTS_LOD_LOW_SAME = 32
const DISTANCE_THRESHOLD_VISIBILITY = 150
const RADIAL_SEGMENTS = 8
const RANDOM_OFFSET_FACTOR = 0.05
const CTRL_POINT_OFFSET_FACTOR = 0.03

const props = defineProps({
    startPosition: {
        type: Object as () => Vector3,
        default: () => new Vector3(-0.2, 0, 0)
    },
    endPosition: {
        type: Object as () => Vector3,
        default: () => new Vector3(0.2, 0, 0)
    },
    color: {
        type: [Number, String],
        default: 0x55aaff
    },
    thickness: {
        type: Number,
        default: DEFAULT_THICKNESS
    },
    arcType: {
        type: String,
        default: 'inter-layer' // 'inter-layer' or 'same-chain'
    },
    arcHeight: {
        type: Number,
        default: DEFAULT_ARC_HEIGHT
    },
    flowSpeed: {
        type: Number,
        default: DEFAULT_FLOW_SPEED
    }
})

// Convert color to Three.js color if it's a string
const arcColor = computed(() => {
    if (typeof props.color === 'string') {
        return new Color(props.color)
    }
    return new Color(props.color)
})

// Create path for the arc
const path = computed(() => {
    const start = props.startPosition
    const end = props.endPosition
    const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5)

    // Add some height variation based on arcType
    if (props.arcType === 'inter-layer') {
        // More jagged, lightning-like path for inter-layer connections
        const randOffset = new Vector3(
            (Math.random() - 0.5) * RANDOM_OFFSET_FACTOR,
            (Math.random() - 0.5) * RANDOM_OFFSET_FACTOR,
            (Math.random() - 0.5) * RANDOM_OFFSET_FACTOR
        )
        mid.add(randOffset)

        // Create two additional control points for more jagged appearance
        const ctrl1 = new Vector3().lerpVectors(start, mid, 0.25)
            .add(new Vector3(
                (Math.random() - 0.5) * CTRL_POINT_OFFSET_FACTOR,
                (Math.random() - 0.5) * CTRL_POINT_OFFSET_FACTOR,
                (Math.random() - 0.5) * CTRL_POINT_OFFSET_FACTOR
            ))

        const ctrl2 = new Vector3().lerpVectors(mid, end, 0.75)
            .add(new Vector3(
                (Math.random() - 0.5) * CTRL_POINT_OFFSET_FACTOR,
                (Math.random() - 0.5) * CTRL_POINT_OFFSET_FACTOR,
                (Math.random() - 0.5) * CTRL_POINT_OFFSET_FACTOR
            ))

        return new CatmullRomCurve3([start, ctrl1, mid, ctrl2, end])
    } else {
        // Smoother arc for same-chain connections
        const midPoint = mid.clone()

        // Add vertical offset based on distance
        const dist = start.distanceTo(end)
        midPoint.z += props.arcHeight * dist

        return new CatmullRomCurve3([start, midPoint, end])
    }
})

// Configure shader uniforms
const uniforms = ref({
    color: { value: arcColor.value },
    time: { value: 0 },
    arcType: { value: props.arcType === 'same-chain' ? 1.0 : 0.0 },
    flowSpeed: { value: props.flowSpeed }
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

// Performance optimization: Adaptive tube segments based on distance
const { camera } = useThree()
const tubeSegments = computed(() => {
    if (!camera.value) return SEGMENTS_LOD_LOW_INTER // Default to max segments

    // Calculate average distance from camera to both endpoints
    const avgDist = (
        camera.value.position.distanceTo(props.startPosition) +
        camera.value.position.distanceTo(props.endPosition)
    ) / 2

    // Scale segments based on distance and connection type
    if (props.arcType === 'inter-layer') {
        // Inter-layer connections need more segments for jagged appearance
        if (avgDist > DISTANCE_THRESHOLD_LOD_HIGH) return SEGMENTS_LOD_HIGH_INTER
        if (avgDist > DISTANCE_THRESHOLD_LOD_MEDIUM) return SEGMENTS_LOD_MEDIUM_INTER
        return SEGMENTS_LOD_LOW_INTER
    } else {
        // Same-chain connections can use fewer segments
        if (avgDist > DISTANCE_THRESHOLD_LOD_HIGH) return SEGMENTS_LOD_HIGH_SAME
        if (avgDist > DISTANCE_THRESHOLD_LOD_MEDIUM) return SEGMENTS_LOD_MEDIUM_SAME
        return SEGMENTS_LOD_LOW_SAME
    }
})

// Performance optimization: Only render when visible
const isVisible = ref(true)
onLoop(() => {
    if (!camera.value) return

    // Simple frustum culling
    const avgDist = (
        camera.value.position.distanceTo(props.startPosition) +
        camera.value.position.distanceTo(props.endPosition)
    ) / 2

    // Only render if reasonably close to camera
    isVisible.value = avgDist < DISTANCE_THRESHOLD_VISIBILITY
})
</script>

<template>
    <TresMesh v-if="isVisible">
        <TresTubeGeometry :path="path" :tubular-segments="tubeSegments" :radius="thickness"
            :radial-segments="RADIAL_SEGMENTS" :closed="false" />
        <TresShaderMaterial :uniforms="uniforms" :vertex-shader="vertexShader" :fragment-shader="fragmentShader"
            transparent depthWrite />
    </TresMesh>
</template>
