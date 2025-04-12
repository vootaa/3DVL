<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Color, Vector3, Vector2, Euler } from 'three'
import { useGameStore } from '../GameStore'
import PlasmaNode from './PlasmaNode.vue'
import PlasmaArc from './PlasmaArc.vue'
import ConcentricRings from './ConcentricRings.vue'
import { useRenderLoop, useThree } from '@tresjs/core'

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

const gameStore = useGameStore()
const { camera } = useThree()
const insideInnerRing = ref(false)
const emitOnce = ref(false)
const layers = ref<any[]>([])
const nodesPerLayer = 20
const numLayers = 8
const ringRadii = [0.15, 0.3, 0.48]

// Performance optimization: Only render when player is near
const isVisible = computed(() => {
    if (!camera.value || !props.active) return false

    const distance = camera.value.position.distanceTo(props.position)
    return distance < 120
})

// Performance optimization: Level of detail based on distance
const visibleLayers = computed(() => {
    if (!camera.value) return numLayers

    const distance = camera.value.position.distanceTo(props.position)

    // Reduce layers when far away
    if (distance > 80) return 3
    if (distance > 50) return 5
    return numLayers
})

// Prepare data structure for ChainWeb3D
onMounted(() => {
    // Initialize layers
    layers.value = Array(numLayers).fill(null).map((_, layerIndex) => {
        const zPosition = -0.5 * layerIndex
        const layerScale = 1 - (layerIndex * 0.05) // Each layer gets slightly smaller for perspective

        // Generate nodes for this layer
        const nodes = Array(nodesPerLayer).fill(null).map((_, nodeIndex) => {
            const ringIndex = Math.floor(nodeIndex / 7) // Distribute nodes across rings
            const radius = ringRadii[ringIndex % ringRadii.length] * layerScale
            const angleStep = (2 * Math.PI) / (nodesPerLayer / 3)
            const angle = (nodeIndex % (nodesPerLayer / 3)) * angleStep

            return {
                id: layerIndex * nodesPerLayer + nodeIndex,
                chainId: nodeIndex, // Same chainId across layers
                layerId: layerIndex,
                position: new Vector3(
                    radius * Math.cos(angle),
                    radius * Math.sin(angle),
                    zPosition
                ),
                color: new Color(0.2 + ringIndex * 0.2, 0.5, 0.8).getHex(),
                radius: 0.015 + Math.random() * 0.01
            }
        })

        return {
            id: layerIndex,
            zPosition,
            scale: layerScale,
            nodes,
            // Connections will be generated after all layers are created
            connections: [],
            sameChainConnections: []
        }
    })

    // Generate inter-layer connections
    for (let i = 0; i < numLayers - 1; i++) {
        const sourceLayer = layers.value[i]
        const targetLayer = layers.value[i + 1]

        // Generate cross-chain connections (60 per layer pair)
        sourceLayer.connections = generateInterLayerConnections(sourceLayer, targetLayer)

        // Generate same-chain connections (20 per layer pair - one per chain)
        sourceLayer.sameChainConnections = generateSameChainConnections(sourceLayer, targetLayer)
    }
})

// Generate connections between adjacent layers
function generateInterLayerConnections(sourceLayer: any, targetLayer: any) {
    const connections = []

    // For each node in source layer, create 3 connections to target layer
    for (let i = 0; i < sourceLayer.nodes.length; i++) {
        for (let j = 0; j < 3; j++) {
            // Connect to nodes at regular pattern in the next layer
            const targetNodeIndex = (i + j * 5) % targetLayer.nodes.length

            connections.push({
                fromNode: i,
                fromLayer: sourceLayer.id,
                toNode: targetNodeIndex,
                toLayer: targetLayer.id,
                type: 1, // Inter-layer
                color: new Color(0.6, 0.8, 1.0).getHex()
            })
        }
    }

    return connections
}

// Generate connections between same chains in adjacent layers
function generateSameChainConnections(sourceLayer: any, targetLayer: any) {
    const connections = []

    // Connect each node to its corresponding chain node in the next layer
    for (let i = 0; i < sourceLayer.nodes.length; i++) {
        const sourceNode = sourceLayer.nodes[i]

        // Find node with same chainId in target layer
        const targetNode = targetLayer.nodes.find(node => node.chainId === sourceNode.chainId)

        if (targetNode) {
            connections.push({
                fromNode: i,
                fromLayer: sourceLayer.id,
                toNode: targetLayer.nodes.indexOf(targetNode),
                toLayer: targetLayer.id,
                type: 2, // Same-chain
                color: new Color(0.8, 0.9, 0.5).getHex()
            })
        }
    }

    return connections
}

// Check if player is inside innermost ring to trigger acceleration
const checkPlayerInnerRing = () => {
    if (!props.active) return

    const playerPos = gameStore.mutation.position
    const portalPos = props.position

    // Create a 2D vector for XY plane distance check
    const playerXY = new Vector2(playerPos.x - portalPos.x, playerPos.y - portalPos.y)
    const distance = playerXY.length()

    // Innermost ring radius adjusted by scale
    const innerRingRadius = ringRadii[0] * props.scale

    // Z-distance check to ensure player is close enough to actually be "in" the ring
    const zDistance = Math.abs(playerPos.z - portalPos.z)

    if (distance < innerRingRadius && zDistance < 2 && !insideInnerRing.value) {
        insideInnerRing.value = true

        // Only emit once per entry
        if (!emitOnce.value) {
            emitOnce.value = true
            emit('accelerate')
        }
    } else if ((distance >= innerRingRadius || zDistance >= 2) && insideInnerRing.value) {
        insideInnerRing.value = false
        emitOnce.value = false
    }
}

const emit = defineEmits(['accelerate'])

// Rotation animation
const rotationY = ref(0)

// Update on each frame
useRenderLoop().onLoop(({ elapsed, delta }) => {
    if (props.active) {
        checkPlayerInnerRing()

        // Add gentle rotation
        rotationY.value += delta * 0.2
    }
})
</script>

<template>
    <TresObject3D v-if="isVisible" :position="position" :rotation="rotation" :scale="[scale, scale, scale]">
        <!-- Apply additional rotation animation -->
        <TresObject3D :rotation="[0, rotationY, 0]">
            <!-- Render visible layers only -->
            <template v-for="layer in layers.slice(0, visibleLayers)" :key="layer.id">
                <!-- Concentric Rings for each layer -->
                <ConcentricRings :position="[0, 0, layer.zPosition]" :scale="layer.scale" :radii="ringRadii"
                    :rotation-speed="0.05 * (1 + layer.id * 0.1)" />

                <!-- Plasma Nodes for each layer -->
                <PlasmaNode v-for="node in layer.nodes" :key="node.id" :position="node.position" :color="node.color"
                    :radius="node.radius" />

                <!-- Plasma Arcs for inter-layer connections (limit connections for performance) -->
                <template v-if="layer.id < numLayers - 1">
                    <!-- For performance, use a subset of connections when far away -->
                    <PlasmaArc
                        v-for="(connection, index) in layer.connections.slice(0, visibleLayers < numLayers ? 20 : 60)"
                        :key="`inter-${index}`" :start-position="layer.nodes[connection.fromNode].position"
                        :end-position="layers[connection.toLayer].nodes[connection.toNode].position"
                        :color="connection.color" :thickness="0.008" arc-type="inter-layer" />

                    <!-- Always render same-chain connections as they're important visually -->
                    <PlasmaArc v-for="(connection, index) in layer.sameChainConnections" :key="`chain-${index}`"
                        :start-position="layer.nodes[connection.fromNode].position"
                        :end-position="layers[connection.toLayer].nodes[connection.toNode].position"
                        :color="connection.color" :thickness="0.012" arc-type="same-chain" :arc-height="0.1"
                        :flow-speed="1.5" />
                </template>
            </template>
        </TresObject3D>
    </TresObject3D>
</template>
