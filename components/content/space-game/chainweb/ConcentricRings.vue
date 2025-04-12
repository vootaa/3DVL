<script setup lang="ts">
import { useRenderLoop } from '@tresjs/core'
import { DoubleSide, MeshBasicMaterial, RingGeometry } from 'three'
import { ref, computed, shallowRef, type PropType } from 'vue'
import type { RingConfiguration } from './utils/ChainwebTopology'

const props = defineProps({
    rings: {
        type: Array as PropType<RingConfiguration[]>,
        required: true
    },
    rotation: {
        type: Array as PropType<number[]>,
        default: () => [0, 0, 0]
    },
    position: {
        type: Array as PropType<number[]>,
        default: () => [0, 0, 0]
    },
    scale: {
        type: Number,
        default: 1
    },
    pulse: {
        type: Boolean,
        default: false
    }
})

const groupRef = shallowRef()
const pulseScale = ref(1)

const { onLoop } = useRenderLoop()

onLoop(({ elapsed }) => {
    if (props.pulse && groupRef.value) {
        // Create a subtle pulsing effect
        pulseScale.value = 1 + 0.02 * Math.sin(elapsed * 2)

        // Apply pulse effect to the rings
        if (groupRef.value.scale) {
            const baseScale = props.scale
            groupRef.value.scale.set(
                baseScale * pulseScale.value,
                baseScale * pulseScale.value,
                baseScale
            )
        }

        // Slow rotation for additional effect
        if (groupRef.value.rotation) {
            groupRef.value.rotation.z = props.rotation[2] + elapsed * 0.1
        }
    }
})
</script>

<template>
    <TresGroup ref="groupRef" :position="position" :rotation="rotation" :scale="[scale, scale, scale]">
        <TresMesh v-for="(ring, i) in rings" :key="i">
            <TresRingGeometry :args="[
                ring.radius - ring.thickness,
                ring.radius + ring.thickness,
                64
            ]" />
            <TresMeshBasicMaterial :color="ring.color" :transparent="true" :opacity="0.8" :side="DoubleSide" />
        </TresMesh>
    </TresGroup>
</template>
