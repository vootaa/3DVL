<script setup lang="ts">
import { ref, onMounted, computed, inject, watch } from 'vue'
import { Vector3, Euler, Color, InstancedMesh, Object3D, BufferGeometry, BufferAttribute } from 'three'
import type { GameStore } from '../GameStore'
import ConcentricRings from './ConcentricRings.vue'
import { useRenderLoop, useTresContext } from '@tresjs/core'
import {
    createLayer,
    generateIntraLayerConnections,
    createRingConfigurations,
    type ChainNode,
    type Connection
} from './utils/ChainwebTopology'

// Constants
const DEFAULT_SCALE = 1
const VISIBILITY_DISTANCE_THRESHOLD = 100
const PORTAL_ENTRY_DISTANCE = 10
const ROTATION_SPEED_FACTOR = 0.0005
const ROTATION_AMPLITUDE = 0.2
const NODE_BASE_RADIUS = 0.5 // Base radius used in TresSphereGeometry for instancing
const NODE_SEGMENTS = 12
const LINE_WIDTH = 1
const LINE_OPACITY = 0.7

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
        default: DEFAULT_SCALE
    },
    active: {
        type: Boolean,
        default: true
    }
})

const gameStore = inject('gameStore') as GameStore
const { camera } = useTresContext()
const isPlayerInPortal = ref(false)
const emitOnce = ref(false)

// Get rings configuration from topology utility
const ringConfig = createRingConfigurations()
const ringRadii = ringConfig.map(ring => ring.radius)

// Data for nodes and connections
const nodes = ref<ChainNode[]>([])
const connections = ref<Connection[]>([])

// Instanced mesh references
const nodeInstancesRef = ref<InstancedMesh | null>(null)
const nodePositions = ref<Vector3[]>([])
const nodeColors = ref<Color[]>([])
const nodeScales = ref<number[]>([])
const tempObject = new Object3D()

// Line instances for connections
const linePositions = ref<Float32Array>(new Float32Array(0))
const lineColors = ref<Float32Array>(new Float32Array(0))
const lineGeometryRef = ref<BufferGeometry | null>(null)

// Performance optimization: Only render when player is near
const isVisible = computed(() => {
    if (!camera.value || !props.active) return false

    const distance = camera.value.position.distanceTo(props.position)
    return distance < VISIBILITY_DISTANCE_THRESHOLD
})

// Generate instances for nodes
function prepareInstancedNodes() {
    nodePositions.value = nodes.value.map(node => node.position)
    nodeColors.value = nodes.value.map(node => node.color)
    // Adjust scale based on node radius and the base geometry radius
    nodeScales.value = nodes.value.map(node => node.radius / NODE_BASE_RADIUS)

    // Update instanced mesh
    if (nodeInstancesRef.value && nodePositions.value.length > 0) {
        nodePositions.value.forEach((position, i) => {
            tempObject.position.copy(position)
            tempObject.scale.set(nodeScales.value[i], nodeScales.value[i], nodeScales.value[i])
            tempObject.updateMatrix()
            nodeInstancesRef.value?.setMatrixAt(i, tempObject.matrix)
            nodeInstancesRef.value?.setColorAt(i, nodeColors.value[i])
        })

        nodeInstancesRef.value.instanceMatrix.needsUpdate = true
        if (nodeInstancesRef.value.instanceColor) {
            nodeInstancesRef.value.instanceColor.needsUpdate = true
        }
    }
}

// Generate lines for connections
function prepareConnectionLines() {
    const lineCount = connections.value.length
    linePositions.value = new Float32Array(lineCount * 6) // 2 vertices * 3 coords
    lineColors.value = new Float32Array(lineCount * 6) // 2 vertices * 3 colors

    let idx = 0
    connections.value.forEach(conn => {
        const startNode = nodes.value.find(n => n.chainId === conn.fromNode)
        const endNode = nodes.value.find(n => n.chainId === conn.toNode)

        if (startNode && endNode) {
            // Start vertex
            linePositions.value[idx * 6] = startNode.position.x
            linePositions.value[idx * 6 + 1] = startNode.position.y
            linePositions.value[idx * 6 + 2] = startNode.position.z
            // End vertex
            linePositions.value[idx * 6 + 3] = endNode.position.x
            linePositions.value[idx * 6 + 4] = endNode.position.y
            linePositions.value[idx * 6 + 5] = endNode.position.z

            // Color
            const color = conn.color
            lineColors.value[idx * 6] = color.r
            lineColors.value[idx * 6 + 1] = color.g
            lineColors.value[idx * 6 + 2] = color.b
            lineColors.value[idx * 6 + 3] = color.r
            lineColors.value[idx * 6 + 4] = color.g
            lineColors.value[idx * 6 + 5] = color.b

            idx++
        }
    })

    // Update the line geometry's attributes
    if (lineGeometryRef.value) {
        lineGeometryRef.value.setAttribute('position', new BufferAttribute(linePositions.value, 3))
        lineGeometryRef.value.setAttribute('color', new BufferAttribute(lineColors.value, 3))
        lineGeometryRef.value.attributes.position.needsUpdate = true
        lineGeometryRef.value.attributes.color.needsUpdate = true
    }
}

// Create node and connection data structure using the topology utility
onMounted(() => {
    // Create a single layer (layerId=0) of nodes at z=0 with scale=1
    nodes.value = createLayer(0, 0, 1)
    // Generate connections within this layer
    connections.value = generateIntraLayerConnections(nodes.value)

    // Prepare instanced data
    prepareInstancedNodes()
    prepareConnectionLines()
})

// Re-prepare instances if nodes/connections change (e.g., for dynamic updates later)
watch([nodes, connections], () => {
    prepareInstancedNodes()
    prepareConnectionLines()
})

// Check if player is close to the portal to trigger effects
const checkPlayerProximity = () => {
    if (!props.active || !gameStore || !gameStore.mutation.position) return

    const playerPos = gameStore.mutation.position
    const portalPos = props.position
    const distance = playerPos.distanceTo(portalPos)

    // Trigger portal effect when player is close
    if (distance < PORTAL_ENTRY_DISTANCE && !isPlayerInPortal.value) {
        isPlayerInPortal.value = true

        // Only emit once per entry
        if (!emitOnce.value) {
            emitOnce.value = true
            emit('portalEntered')
        }
    } else if (distance >= PORTAL_ENTRY_DISTANCE && isPlayerInPortal.value) {
        isPlayerInPortal.value = false
        emitOnce.value = false
    }
}

const emit = defineEmits(['portalEntered'])

// Rotation animation
const rotationY = ref(0)

// Update on each frame
useRenderLoop().onLoop(({ elapsed }) => {
    if (props.active && isVisible.value) { // Only update if active and visible
        checkPlayerProximity()
        rotationY.value = Math.sin(elapsed * ROTATION_SPEED_FACTOR) * ROTATION_AMPLITUDE
    }
})
</script>

<template>
    <TresObject3D v-if="isVisible" :position="position" :rotation="rotation" :scale="[scale, scale, scale]">
        <!-- Apply additional gentle rotation -->
        <TresObject3D :rotation="[0, rotationY, 0]">
            <!-- Concentric Rings - use ring configurations from topology -->
            <ConcentricRings :radii="ringRadii" :rotation-speed="0.1" />

            <!-- Instanced Plasma Nodes -->
            <TresInstancedMesh ref="nodeInstancesRef" :count="nodePositions.length"
                :args="[null, null, nodePositions.length]">
                <TresSphereGeometry :args="[NODE_BASE_RADIUS, NODE_SEGMENTS, NODE_SEGMENTS]" />
                <!-- Using MeshStandardMaterial for potential lighting effects, adjust as needed -->
                <TresMeshStandardMaterial :vertexColors="true" :metalness="0.5" :roughness="0.5" />
            </TresInstancedMesh>

            <!-- Line Segments for Connections -->
            <TresLineSegments>
                <TresBufferGeometry ref="lineGeometryRef">
                    <!-- Attributes will be set in prepareConnectionLines -->
                </TresBufferGeometry>
                <TresLineBasicMaterial :vertexColors="true" :opacity="LINE_OPACITY" :transparent="true"
                    :linewidth="LINE_WIDTH" />
            </TresLineSegments>

        </TresObject3D>
    </TresObject3D>
</template>
