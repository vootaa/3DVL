<script setup lang="ts">
import { TresCanvas, useRenderLoop } from '@tresjs/core'
import { computed, onMounted, ref, watch } from 'vue'
import { Color, Vector3 } from 'three'
import { useGameStore } from '../GameStore'
import PlasmaNode from './PlasmaNode.vue'
import PlasmaArc from './PlasmaArc.vue'
import ConcentricRings from './ConcentricRings.vue'

const props = defineProps({
    position: {
        type: Object as () => Vector3,
        default: () => new Vector3(0, 0, 0)
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
const isPlayerInPortal = ref(false)

// Configuration for 2D Petersen Graph
const ringRadii = [0.15, 0.3, 0.48]
const numNodes = 20
const nodes = ref<any[]>([])
const connections = ref<any[]>([])

// Create node data structure
onMounted(() => {
    // Initialize nodes - 20 nodes distributed across 3 concentric rings
    nodes.value = Array(numNodes).fill(null).map((_, index) => {
        const ringIndex = Math.floor(index / 7) // Distribute nodes across rings
        const radius = ringRadii[ringIndex % ringRadii.length]
        const angleStep = (2 * Math.PI) / (numNodes / 3)
        const angle = (index % (numNodes / 3)) * angleStep

        return {
            id: index,
            chainId: index,
            position: new Vector3(
                radius * Math.cos(angle),
                radius * Math.sin(angle),
                0
            ),
            color: new Color(0.2 + ringIndex * 0.2, 0.5, 0.8).getHex(),
            radius: 0.02 + Math.random() * 0.01
        }
    })

    // Generate Petersen Graph connections (30 connections)
    connections.value = generatePetersenConnections(nodes.value)
})

// Function to determine portal connections based on Petersen graph properties
function generatePetersenConnections(nodes: any[]) {
    const connections = []

    // Petersen graph connection pattern
    for (let i = 0; i < nodes.length; i++) {
        // Connect to nodes at regular intervals in the next ring
        const nextNodeIndex = (i + 3) % nodes.length
        connections.push({
            fromNode: i,
            toNode: nextNodeIndex,
            color: new Color(0.6, 0.8, 1.0).getHex()
        })

        // Add another connection to create 30 total
        if (i % 2 === 0) {
            const anotherNodeIndex = (i + 7) % nodes.length
            connections.push({
                fromNode: i,
                toNode: anotherNodeIndex,
                color: new Color(0.7, 0.9, 1.0).getHex()
            })
        }
    }

    return connections
}

// Check if player is close to the portal to trigger effects
const checkPlayerProximity = () => {
    const playerPos = gameStore.mutation.position
    const portalPos = props.position
    const distance = playerPos.distanceTo(portalPos)

    // Trigger portal effect when player is close
    if (distance < 10 && !isPlayerInPortal.value) {
        isPlayerInPortal.value = true
        // Emit event to trigger transition effect
        emit('portalEntered')
    } else if (distance >= 10 && isPlayerInPortal.value) {
        isPlayerInPortal.value = false
    }
}

const emit = defineEmits(['portalEntered'])

// Update on each frame
useRenderLoop().onLoop(() => {
    if (props.active) {
        checkPlayerProximity()
    }
})
</script>

<template>
    <TresObject3D :position="position" :scale="[scale, scale, scale]">
        <!-- Concentric Rings -->
        <ConcentricRings :radii="ringRadii" />

        <!-- Plasma Nodes -->
        <PlasmaNode v-for="node in nodes" :key="node.id" :position="node.position" :color="node.color"
            :radius="node.radius" />

        <!-- Plasma Arcs -->
        <PlasmaArc v-for="(connection, index) in connections" :key="index"
            :start-position="nodes[connection.fromNode].position" :end-position="nodes[connection.toNode].position"
            :color="connection.color" />
    </TresObject3D>
</template>
