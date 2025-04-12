<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Color, Vector3, Euler } from 'three'
import { gameStore } from '../GameStore'
import PlasmaNode from './PlasmaNode.vue'
import PlasmaArc from './PlasmaArc.vue'
import ConcentricRings from './ConcentricRings.vue'
import { useRenderLoop } from '@tresjs/core'
import {
    createLayer,
    generateIntraLayerConnections,
    createRingConfigurations,
    ChainNode,
    Connection
} from './utils/ChainwebTopology'

const props = defineProps({
    position: {
        type: Object as () => Vector3,
        default: () => new Vector3(0, 0, 0)
    },
    rotation: {
        type: Object as () => Euler,
        default: () => new Euler(0, 0, 0)
    },
    scale: {
        type: Number,
        default: 1
    },
    active: {
        type: Boolean,
        default: true
    }
})

const isPlayerInPortal = ref(false)
const emitOnce = ref(false)

// Get rings configuration from topology utility
const ringConfig = createRingConfigurations()
const ringRadii = ringConfig.map(ring => ring.radius)

// Using 20 nodes as defined in ChainwebTopology
const nodes = ref<ChainNode[]>([])
const connections = ref<Connection[]>([])

// Performance optimization: Only render when player is near
const isVisible = computed(() => {
    if (!camera.value || !props.active) return false

    const distance = camera.value.position.distanceTo(props.position)
    return distance < 100
})

// Create node data structure using the topology utility
onMounted(() => {
    // Create a single layer (layerId=0) of nodes at z=0 with scale=1
    nodes.value = createLayer(0, 0, 1)

    // Generate connections within this layer
    connections.value = generateIntraLayerConnections(nodes.value)
})

// Check if player is close to the portal to trigger effects
const checkPlayerProximity = () => {
    if (!props.active) return

    const playerPos = gameStore.mutation.position
    const portalPos = props.position
    const distance = playerPos.distanceTo(portalPos)

    // Trigger portal effect when player is close
    if (distance < 10 && !isPlayerInPortal.value) {
        isPlayerInPortal.value = true

        // Only emit once per entry
        if (!emitOnce.value) {
            emitOnce.value = true
            emit('portalEntered')
        }
    } else if (distance >= 10 && isPlayerInPortal.value) {
        isPlayerInPortal.value = false
        emitOnce.value = false
    }
}

const emit = defineEmits(['portalEntered'])

// Rotation animation
const rotationY = ref(0)

// Update on each frame
useRenderLoop().onLoop(({ elapsed }) => {
    if (props.active) {
        checkPlayerProximity()
        rotationY.value = Math.sin(elapsed * 0.0005) * 0.2
    }
})
</script>

<template>
    <TresObject3D v-if="isVisible" :position="position" :rotation="rotation" :scale="[scale, scale, scale]">
        <!-- Apply additional gentle rotation -->
        <TresObject3D :rotation="[0, rotationY, 0]">
            <!-- Concentric Rings - use ring configurations from topology -->
            <ConcentricRings :radii="ringRadii" :rotation-speed="0.1" />

            <!-- Plasma Nodes using the topology-based node structure -->
            <PlasmaNode v-for="node in nodes" :key="node.id" :position="node.position" :color="node.color.getHex()"
                :radius="node.radius" />

            <!-- Plasma Arcs using the topology-based connection structure -->
            <PlasmaArc v-for="(connection, index) in connections" :key="index"
                :start-position="nodes[connection.fromNode].position" :end-position="nodes[connection.toNode].position"
                :color="connection.color.getHex()" :thickness="0.008"
                :arc-type="connection.type === 0 ? 'intra-layer' : 'inter-layer'" />
        </TresObject3D>
    </TresObject3D>
</template>
