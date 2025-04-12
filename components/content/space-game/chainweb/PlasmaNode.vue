<script setup lang="ts">
import { useRenderLoop } from '@tresjs/core'
import { Color, ShaderMaterial, DoubleSide } from 'three'
import { shallowRef, type PropType } from 'vue'
import nodeVertexShader from './shaders/plasma-node.vert'
import nodeFragmentShader from './shaders/plasma-node.frag'
import type { ChainNode } from './utils/ChainwebTopology'

const props = defineProps({
    node: {
        type: Object as PropType<ChainNode>,
        required: true
    },
    scale: {
        type: Number,
        default: 1
    }
})

const sphereRef = shallowRef()
const nodeMaterial = shallowRef(
    new ShaderMaterial({
        vertexShader: nodeVertexShader,
        fragmentShader: nodeFragmentShader,
        uniforms: {
            time: { value: 0.0 },
            color: { value: new Color(props.node.color) },
            nodeSize: { value: props.node.radius },
            chainId: { value: props.node.chainId }
        },
        transparent: true,
        side: DoubleSide,
        depthWrite: false
    })
)

// Start at a random time to prevent all nodes looking identical
const startTime = Math.random() * 1000

const { onLoop } = useRenderLoop()

onLoop(({ elapsed }) => {
    if (nodeMaterial.value?.uniforms) {
        nodeMaterial.value.uniforms.time.value = startTime + elapsed
    }
})
</script>

<template>
    <TresMesh :position="[
        node.position.x * scale,
        node.position.y * scale,
        node.position.z * scale
    ]" ref="sphereRef">
        <TresSphereGeometry :args="[node.radius * scale, 32, 32]" />
        <TresShaderMaterial :args="[nodeMaterial]" />
    </TresMesh>
</template>
