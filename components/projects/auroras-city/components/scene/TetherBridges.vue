<script setup lang="ts">
import { computed } from 'vue'
import { Vector3, Euler } from 'three'
import type { SceneConfig } from '../../config/scene-config'
import { petersenNodes, petersenConnections, polarToCartesian } from '../../config/scene-config'

interface Props {
    config: SceneConfig
}

const props = defineProps<Props>()

const bridges = computed(() => {
    const result: Bridge[] = []

    petersenConnections.forward.forEach(([fromId, toId]) => {
        const fromNode = petersenNodes.find(n => n.id === fromId)
        const toNode = petersenNodes.find(n => n.id === toId)

        if (fromNode && toNode) {
            // Use y=0 to match the ring height (XZ plane)
            const fromPos = polarToCartesian(fromNode.r, fromNode.theta, 0)
            const toPos = polarToCartesian(toNode.r, toNode.theta, 0)

            // Calculate bridge position (midpoint) - keep y=0
            const position = new Vector3()
                .addVectors(fromPos, toPos)
                .multiplyScalar(0.5)

            // Calculate bridge rotation in XZ plane
            const direction = new Vector3().subVectors(toPos, fromPos)
            const length = direction.length()

            // Rotation around Y axis for XZ plane alignment
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