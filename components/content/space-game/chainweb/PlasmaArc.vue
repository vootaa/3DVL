<script setup lang="ts">
import { useRenderLoop } from '@tresjs/core'
import { Color, Vector3, CylinderGeometry, TubeGeometry, ShaderMaterial, DoubleSide, CatmullRomCurve3 } from 'three'
import { ref, onMounted, shallowRef, computed, watch, type PropType } from 'vue'
import arcVertexShader from './shaders/plasma-arc.vert'
import arcFragmentShader from './shaders/plasma-arc.frag'
import type { Connection } from './utils/ChainwebTopology'

const props = defineProps({
    connection: {
        type: Object as PropType<Connection>,
        required: true
    },
    fromPosition: {
        type: Object as PropType<Vector3>,
        required: true
    },
    toPosition: {
        type: Object as PropType<Vector3>,
        required: true
    },
    scale: {
        type: Number,
        default: 1
    }
})

const arcMaterial = shallowRef(
    new ShaderMaterial({
        vertexShader: arcVertexShader,
        fragmentShader: arcFragmentShader,
        uniforms: {
            time: { value: 0.0 },
            color: { value: new Color(props.connection.color) },
            connType: { value: props.connection.connType },
            seed: { value: Math.random() * 10 }
        },
        transparent: true,
        side: DoubleSide,
        depthWrite: false
    })
)

const curve = computed(() => {
    const from = props.fromPosition.clone()
    const to = props.toPosition.clone()

    // For same-chain connections, use a different curve
    if (props.connection.connType === 5) {
        // Create a more tube-like path for same-chain connections
        const mid = from.clone().add(to).multiplyScalar(0.5)

        // Offset the midpoint to create a curve
        const dir = to.clone().sub(from).normalize()
        const perp = new Vector3(-dir.y, dir.x, 0).multiplyScalar(0.05)
        mid.add(perp)

        // Slightly curve in z-direction to give 3D appearance
        mid.z += 0.02

        return new CatmullRomCurve3([from, mid, to])
    } else {
        // For electric arcs, create a curve with a control point
        const mid = from.clone().add(to).multiplyScalar(0.5)

        // Add slight randomization to the midpoint
        const dir = to.clone().sub(from).normalize()
        const perp = new Vector3(-dir.y, dir.x, 0)
        const offset = perp.multiplyScalar((Math.random() - 0.5) * 0.05)
        mid.add(offset)

        return new CatmullRomCurve3([from, mid, to])
    }
})

const arcGeometry = computed(() => {
    // For same-chain connections, use a thinner tube
    const radius = props.connection.connType === 5 ? 0.002 : 0.005
    return new TubeGeometry(
        curve.value,
        64,  // tubularSegments
        radius * props.scale,  // radius
        8,   // radialSegments
        false // closed
    )
})

const { onLoop } = useRenderLoop()

onLoop(({ elapsed }) => {
    if (arcMaterial.value?.uniforms) {
        arcMaterial.value.uniforms.time.value = elapsed
    }
})
</script>

<template>
    <TresMesh>
        <TresBufferGeometry :args="[arcGeometry]" />
        <TresShaderMaterial :args="[arcMaterial]" />
    </TresMesh>
</template>
