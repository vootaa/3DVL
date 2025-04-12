<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Color, Vector3, Euler } from 'three'
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
const isPlayerInPortal = ref(false)
const emitOnce = ref(false)

// Configuration for 2D Petersen Graph
const ringRadii = [0.15, 0.3, 0.48]
const numNodes = 20
const nodes = ref<any[]>([])
const connections = ref<any[]>([])

// Performance optimization: Only render when player is near
const isVisible = computed(() => {
    if (!camera.value || !props.active) return false

    const distance = camera.value.position.distanceTo(props.position)
    return distance < 100
})

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
            radius: 0.015 + Math.random() * 0.01
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
            <!-- Concentric Rings -->
            <ConcentricRings :radii="ringRadii" :rotation-speed="0.1" />

            <!-- Plasma Nodes -->
            <PlasmaNode v-for="node in nodes" :key="node.id" :position="node.position" :color="node.color"
                :radius="node.radius" />

            <!-- Plasma Arcs -->
            <PlasmaArc v-for="(connection, index) in connections" :key="index"
                :start-position="nodes[connection.fromNode].position" :end-position="nodes[connection.toNode].position"
                :color="connection.color" :thickness="0.008" arc-type="inter-layer" />
        </TresObject3D>
    </TresObject3D>
</template>
