<script lang="ts">
import { defineProps } from 'vue'
import { Vector3 } from 'three'

// Constants needed for prop defaults
const DEFAULT_TUBE_WIDTH = 0.005
const DEFAULT_ROTATION_SPEED = 0.2
const DEFAULT_RADII = [0.15, 0.3, 0.48]
const DEFAULT_COLORS = [0x3366ff, 0x44aaff, 0x66ccff]

export default defineProps({
    position: {
        type: Object as () => Vector3,
        default: () => new Vector3(0, 0, 0)
    },
    scale: {
        type: Number,
        default: 1
    },
    radii: {
        type: Array as () => number[],
        default: () => [...DEFAULT_RADII] // Use spread to avoid mutation
    },
    tubeWidth: {
        type: Number,
        default: DEFAULT_TUBE_WIDTH
    },
    rotationSpeed: {
        type: Number,
        default: DEFAULT_ROTATION_SPEED
    },
    colors: {
        type: Array as () => (string | number)[],
        default: () => [...DEFAULT_COLORS] // Use spread to avoid mutation
    }
})
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Color } from 'three' // Vector3 is imported in the other script block
import { useRenderLoop, useTresContext } from '@tresjs/core'
import vertexShader from './shaders/concentric-rings.vert?raw'
import fragmentShader from './shaders/concentric-rings.frag?raw'

// Constants used within setup logic
const DISTANCE_THRESHOLD_LOD_HIGH = 100
const DISTANCE_THRESHOLD_LOD_MEDIUM = 50
const SEGMENTS_LOD_HIGH = 48
const SEGMENTS_LOD_MEDIUM = 64
const SEGMENTS_LOD_LOW = 96
const DISTANCE_THRESHOLD_VISIBILITY = 200
const RADIAL_SEGMENTS = 8

// Access props defined in the other script block
const props = defineProps<{
    position: Vector3
    scale: number
    radii: number[]
    tubeWidth: number
    rotationSpeed: number
    colors: (string | number)[]
}>()

// Convert colors to Three.js colors
const ringColors = computed(() => {
    return props.colors.map(color => {
        if (typeof color === 'string') {
            return new Color(color)
        }
        return new Color(color)
    })
})

// Configure shader uniforms
const uniforms = ref({
    time: { value: 0 },
    colors: { value: ringColors.value.map(c => ({ value: c })) },
    rotationSpeed: { value: props.rotationSpeed }
})

// Update time uniform for animation
const { onLoop } = useRenderLoop()
onLoop(({ elapsed }) => {
    uniforms.value.time.value = elapsed * 0.001
})

// Performance optimization: Adaptive tube segments based on distance
const { camera } = useTresContext()
const tubularSegments = computed(() => {
    if (!camera.value) return SEGMENTS_LOD_LOW

    const distance = camera.value.position.distanceTo(props.position)

    // Scale segments based on distance
    if (distance > DISTANCE_THRESHOLD_LOD_HIGH) return SEGMENTS_LOD_HIGH
    if (distance > DISTANCE_THRESHOLD_LOD_MEDIUM) return SEGMENTS_LOD_MEDIUM
    return SEGMENTS_LOD_LOW
})

// Performance optimization: Only render when visible
const isVisible = ref(true)
onLoop(() => {
    if (!camera.value) return

    const distance = camera.value.position.distanceTo(props.position)

    // Only render if reasonably close to camera
    isVisible.value = distance < DISTANCE_THRESHOLD_VISIBILITY
})
</script>

<template>
    <TresObject3D v-if="isVisible" :position="position" :scale="[scale, scale, scale]">
        <!-- Create a ring for each radius -->
        <template v-for="(radius, index) in radii" :key="index">
            <TresMesh>
                <TresTorusGeometry :args="[radius, tubeWidth, RADIAL_SEGMENTS, tubularSegments]"
                    :rotation="[Math.PI / 2, 0, 0]" />
                <TresShaderMaterial :uniforms="{
                    time: uniforms.time,
                    color: { value: ringColors[index % ringColors.length] },
                    radius: { value: radius },
                    rotationOffset: { value: index * Math.PI / props.radii.length },
                    rotationSpeed: uniforms.rotationSpeed
                }" :vertex-shader="vertexShader" :fragment-shader="fragmentShader" transparent depthWrite />
            </TresMesh>
        </template>
    </TresObject3D>
</template>
