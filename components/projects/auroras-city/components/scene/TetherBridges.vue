<script setup lang="ts">
import { computed } from 'vue'
import { Vector3, Euler } from 'three'
import type { SceneConfig } from '../../config/scene-config'
import { petersenNodes, petersenConnections, polarToCartesian } from '../../config/scene-config'

interface Props {
    config: SceneConfig
}

const props = defineProps<Props>()

interface Bridge {
    position: Vector3
    rotation: Euler
    length: number
}

const bridges = computed(() => {
    const result: Bridge[] = []

    petersenConnections.forward.forEach(([fromId, toId]) => {
        const fromNode = petersenNodes.find(n => n.id === fromId)
        const toNode = petersenNodes.find(n => n.id === toId)

        if (fromNode && toNode) {
            const fromPos = polarToCartesian(fromNode.r, fromNode.theta, props.config.bridges.height)
            const toPos = polarToCartesian(toNode.r, toNode.theta, props.config.bridges.height)

            // Calculate bridge position (midpoint)
            const position = new Vector3()
                .addVectors(fromPos, toPos)
                .multiplyScalar(0.5)

            // Calculate bridge rotation
            const direction = new Vector3().subVectors(toPos, fromPos)
            const length = direction.length()
            const rotation = new Euler(0, Math.atan2(direction.x, direction.z), 0)

            result.push({ position, rotation, length })
        }
    })

    return result
})
</script>

<template>
    <TresGroup>
        <TresMesh v-for="(bridge, index) in bridges" :key="index" :position="bridge.position"
            :rotation="bridge.rotation">
            <TresBoxGeometry :args="[bridge.length, config.bridges.thickness, config.bridges.width]" />
            <TresMeshLambertMaterial color="#696969" />
        </TresMesh>
    </TresGroup>
</template>