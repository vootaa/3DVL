<script setup lang="ts">
import { computed } from 'vue'
import { Vector3 } from 'three'
import type { SceneConfig, PetersenNode } from '../../config/scene-config'
import { petersenNodes, polarToCartesian } from '../../config/scene-config'

interface Props {
    config: SceneConfig
}

defineProps<Props>()

const outerNodes = computed(() => petersenNodes.filter(node => node.orbit === 'outer'))
const middleNodes = computed(() => petersenNodes.filter(node => node.orbit === 'middle'))
const innerNodes = computed(() => petersenNodes.filter(node => node.orbit === 'inner'))

const getNodePosition = (node: PetersenNode, height: number): Vector3 => {
    return polarToCartesian(node.r, node.theta, height)
}
</script>

<template>
    <TresGroup>
        <!-- Outer temples (cylinders) -->
        <TresMesh v-for="node in outerNodes" :key="node.id"
            :position="getNodePosition(node, config.temples.outer.height / 2)">
            <TresCylinderGeometry :args="[
                config.temples.outer.radius,
                config.temples.outer.radius,
                config.temples.outer.height
            ]" />
            <TresMeshLambertMaterial color="#8b4513" />
        </TresMesh>

        <!-- Middle temples (cubes) -->
        <TresMesh v-for="node in middleNodes" :key="node.id"
            :position="getNodePosition(node, config.temples.middle.height / 2)">
            <TresBoxGeometry :args="[
                config.temples.middle.size,
                config.temples.middle.height,
                config.temples.middle.size
            ]" />
            <TresMeshLambertMaterial color="#cd853f" />
        </TresMesh>

        <!-- Inner temples (cubes) -->
        <TresMesh v-for="node in innerNodes" :key="node.id"
            :position="getNodePosition(node, config.temples.inner.height / 2)">
            <TresBoxGeometry :args="[
                config.temples.inner.size,
                config.temples.inner.height,
                config.temples.inner.size
            ]" />
            <TresMeshLambertMaterial color="#daa520" />
        </TresMesh>
    </TresGroup>
</template>