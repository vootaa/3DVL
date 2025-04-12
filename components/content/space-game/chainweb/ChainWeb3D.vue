<script setup lang="ts">
import { ref, onMounted, computed, watch, inject } from 'vue'
import { Color, Vector3, Vector2, Euler, InstancedMesh, Object3D, BufferGeometry, BufferAttribute } from 'three'
import type { GameStore } from '../GameStore'
import ConcentricRings from './ConcentricRings.vue'
import { useRenderLoop, useThree } from '@tresjs/core'
import { createLayer, generateIntraLayerConnections, generateInterLayerConnections, createRingConfigurations } from './utils/ChainwebTopology'

// Constants
const DEFAULT_SCALE = 1
const NUM_LAYERS = 8
const LAYER_DEPTH_STEP = 0.2
const LAYER_SCALE_FACTOR_PER_LAYER = 0.05
const VISIBILITY_DISTANCE_THRESHOLD = 120
const LOD_DISTANCE_THRESHOLD_HIGH = 80
const LOD_DISTANCE_THRESHOLD_MEDIUM = 50
const LOD_LAYERS_HIGH = 3
const LOD_LAYERS_MEDIUM = 5
const INNER_RING_ENTRY_DISTANCE_FACTOR = 1.0 // Multiplier for inner ring radius check
const INNER_RING_Z_DISTANCE_THRESHOLD = 2
const ROTATION_SPEED_FACTOR = 0.2
const NODE_BASE_RADIUS = 0.5 // Base radius used in TresSphereGeometry for instancing
const NODE_SEGMENTS = 12
const LINE_WIDTH = 1
const LINE_OPACITY = 0.7
const CONNECTION_COUNT_LOD_THRESHOLD = 30 // Max connections per layer for LOD

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
const { camera } = useThree()
const insideInnerRing = ref(false)
const emitOnce = ref(false)
const layers = ref<any[]>([])
const ringRadiiConfig = createRingConfigurations()
const ringRadii = ringRadiiConfig.map(r => r.radius)
const innerRingRadius = ringRadii[0] // Assuming first is inner

// Instanced mesh references
const nodeInstancesRef = ref<InstancedMesh | null>(null)
const nodePositions = ref<Vector3[]>([])
const nodeColors = ref<Color[]>([])
const nodeScales = ref<number[]>([])
const tempObject = new Object3D()

// Line instances for connections
const linePositions = ref<Float32Array>(new Float32Array(0))
const lineColors = ref<Float32Array>(new Float32Array(0))
const lineGeometryRef = ref<BufferGeometry | null>(null) // Initialize as null

// Performance optimization: Only render when player is near
const isVisible = computed(() => {
    if (!camera.value || !props.active) return false

    const distance = camera.value.position.distanceTo(props.position)
    return distance < VISIBILITY_DISTANCE_THRESHOLD
})

// Performance optimization: Level of detail based on distance
const visibleLayers = computed(() => {
    if (!camera.value) return NUM_LAYERS

    const distance = camera.value.position.distanceTo(props.position)

    // Reduce layers when far away
    if (distance > LOD_DISTANCE_THRESHOLD_HIGH) return LOD_LAYERS_HIGH
    if (distance > LOD_DISTANCE_THRESHOLD_MEDIUM) return LOD_LAYERS_MEDIUM
    return NUM_LAYERS
})

// Generate instances instead of individual nodes
function prepareInstancedNodes() {
    nodePositions.value = []
    nodeColors.value = []
    nodeScales.value = []

    // Create instanced data for all nodes across visible layers
    layers.value.slice(0, visibleLayers.value).forEach(layer => {
        layer.nodes.forEach(node => {
            nodePositions.value.push(node.position)
            nodeColors.value.push(node.color) // Already Color objects from topology
            nodeScales.value.push(node.radius / NODE_BASE_RADIUS) // Adjust for the base sphere radius
        })
    })

    // Update instanced mesh
    if (nodeInstancesRef.value && nodePositions.value.length > 0) {
        // Ensure count matches data length
        nodeInstancesRef.value.count = nodePositions.value.length

        nodePositions.value.forEach((position, i) => {
            tempObject.position.copy(position)
            tempObject.scale.set(
                nodeScales.value[i],
                nodeScales.value[i],
                nodeScales.value[i]
            )
            tempObject.updateMatrix()
            nodeInstancesRef.value?.setMatrixAt(i, tempObject.matrix)
            // Check if instanceColor exists before setting
            if (nodeInstancesRef.value.instanceColor) {
                nodeInstancesRef.value.setColorAt(i, nodeColors.value[i])
            }
        })

        nodeInstancesRef.value.instanceMatrix.needsUpdate = true
        // Check if instanceColor exists before updating
        if (nodeInstancesRef.value.instanceColor) {
            nodeInstancesRef.value.instanceColor.needsUpdate = true
        }
    } else if (nodeInstancesRef.value) {
        // If no nodes are visible, set count to 0
        nodeInstancesRef.value.count = 0
        nodeInstancesRef.value.instanceMatrix.needsUpdate = true
        if (nodeInstancesRef.value.instanceColor) {
            nodeInstancesRef.value.instanceColor.needsUpdate = true
        }
    }
}

// Generate lines for connections
function prepareConnectionLines() {
    // Determine max connections based on LOD
    const visibleConnectionCount = visibleLayers.value < NUM_LAYERS ? CONNECTION_COUNT_LOD_THRESHOLD : Infinity
    let lineCount = 0

    // Count total visible connections respecting LOD limit
    layers.value.slice(0, visibleLayers.value).forEach(layer => {
        lineCount += Math.min(layer.intraLayerConnections.length, visibleConnectionCount)

        // Count inter-layer connections if not the last visible layer
        if (layer.id < visibleLayers.value - 1) {
            lineCount += Math.min(layer.interLayerConnections.length, visibleConnectionCount)
        }
    })

    // Prepare buffer for line positions and colors
    linePositions.value = new Float32Array(lineCount * 6)
    lineColors.value = new Float32Array(lineCount * 6)

    let idx = 0

    // Fill connection data respecting LOD limit
    layers.value.slice(0, visibleLayers.value).forEach(layer => {
        // Intra-layer connections (within same layer)
        layer.intraLayerConnections.slice(0, visibleConnectionCount).forEach(conn => {
            const startNode = layer.nodes.find(n => n.chainId === conn.fromNode)
            const endNode = layer.nodes.find(n => n.chainId === conn.toNode)

            if (startNode && endNode) {
                // Start vertex
                linePositions.value.set([startNode.position.x, startNode.position.y, startNode.position.z], idx * 6)
                // End vertex
                linePositions.value.set([endNode.position.x, endNode.position.y, endNode.position.z], idx * 6 + 3)
                // Color
                const color = conn.color // Already Color object
                lineColors.value.set([color.r, color.g, color.b], idx * 6)
                lineColors.value.set([color.r, color.g, color.b], idx * 6 + 3)
                idx++
            }
        })

        // Inter-layer connections (between layers)
        if (layer.id < visibleLayers.value - 1) {
            layer.interLayerConnections.slice(0, visibleConnectionCount).forEach(conn => {
                const startNode = layer.nodes.find(n => n.chainId === conn.fromNode)
                const nextLayer = layers.value[layer.id + 1]
                const endNode = nextLayer?.nodes.find(n => n.chainId === conn.toNode) // Add safe navigation

                if (startNode && endNode) {
                    // Start vertex
                    linePositions.value.set([startNode.position.x, startNode.position.y, startNode.position.z], idx * 6)
                    // End vertex
                    linePositions.value.set([endNode.position.x, endNode.position.y, endNode.position.z], idx * 6 + 3)
                    // Color
                    const color = conn.color // Already Color object
                    lineColors.value.set([color.r, color.g, color.b], idx * 6)
                    lineColors.value.set([color.r, color.g, color.b], idx * 6 + 3)
                    idx++
                }
            })
        }
    })

    // Update the line geometry's attributes if it exists
    if (lineGeometryRef.value) {
        lineGeometryRef.value.setAttribute('position', new BufferAttribute(linePositions.value, 3))
        lineGeometryRef.value.setAttribute('color', new BufferAttribute(lineColors.value, 3))
        lineGeometryRef.value.attributes.position.needsUpdate = true
        lineGeometryRef.value.attributes.color.needsUpdate = true
        // Optional: Compute bounding sphere for frustum culling
        lineGeometryRef.value.computeBoundingSphere()
    }
}

// Prepare data structure for ChainWeb3D
onMounted(() => {
    // Initialize layers using ChainwebTopology
    layers.value = Array(NUM_LAYERS).fill(null).map((_, layerIndex) => {
        const zPosition = -LAYER_DEPTH_STEP * layerIndex * props.scale // Apply scale here? Or let parent scale? Let parent scale.
        const layerScale = 1 - (layerIndex * LAYER_SCALE_FACTOR_PER_LAYER)

        // Create nodes for this layer using the topology utility
        const nodes = createLayer(layerIndex, zPosition, layerScale)

        return {
            id: layerIndex,
            zPosition,
            scale: layerScale,
            nodes,
            intraLayerConnections: [],
            interLayerConnections: []
        }
    })

    // Generate connections
    layers.value.forEach((layer, i) => {
        layer.intraLayerConnections = generateIntraLayerConnections(layer.nodes)
        if (i < NUM_LAYERS - 1) {
            const targetLayer = layers.value[i + 1]
            layer.interLayerConnections = generateInterLayerConnections(
                layer.nodes,
                targetLayer.nodes
            )
        }
    })

    // Initial setup of instanced rendering
    prepareInstancedNodes()
    prepareConnectionLines()
})

// Check if player is inside innermost ring to trigger acceleration
const checkPlayerInnerRing = () => {
    if (!props.active || !gameStore || !gameStore.mutation.position) return

    const playerPos = gameStore.mutation.position
    const portalCenterPos = props.position // Center of the first layer

    // Create a 2D vector for XY plane distance check relative to the portal center
    const playerXY = new Vector2(playerPos.x - portalCenterPos.x, playerPos.y - portalCenterPos.y)
    const distanceXY = playerXY.length()

    // Innermost ring radius adjusted by the overall component scale
    const currentInnerRingRadius = innerRingRadius * props.scale * INNER_RING_ENTRY_DISTANCE_FACTOR

    // Z-distance check relative to the portal center Z
    const zDistance = Math.abs(playerPos.z - portalCenterPos.z)

    if (distanceXY < currentInnerRingRadius && zDistance < INNER_RING_Z_DISTANCE_THRESHOLD && !insideInnerRing.value) {
        insideInnerRing.value = true

        // Only emit once per entry
        if (!emitOnce.value) {
            emitOnce.value = true
            emit('accelerate')
        }
    } else if ((distanceXY >= currentInnerRingRadius || zDistance >= INNER_RING_Z_DISTANCE_THRESHOLD) && insideInnerRing.value) {
        insideInnerRing.value = false
        emitOnce.value = false
    }
}

const emit = defineEmits(['accelerate'])

// Rotation animation
const rotationY = ref(0)

// Update instanced meshes when visibility or layer count changes
watch(visibleLayers, () => {
    prepareInstancedNodes()
    prepareConnectionLines()
})

// Update on each frame
useRenderLoop().onLoop(({ delta }) => {
    // Only update if active and visible
    if (props.active && isVisible.value) {
        checkPlayerInnerRing()

        // Add gentle rotation
        rotationY.value += delta * ROTATION_SPEED_FACTOR

        // Note: No need to call prepareInstancedNodes/prepareConnectionLines every frame
        // unless node positions/colors/connections are actively changing dynamically.
        // Updates are handled by the `watch(visibleLayers)` hook.
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
            </template>

            <!-- Instanced mesh for all nodes -->
            <TresInstancedMesh ref="nodeInstancesRef" :args="[null, null, 0]"> <!-- Initial count 0 -->
                <TresSphereGeometry :args="[NODE_BASE_RADIUS, NODE_SEGMENTS, NODE_SEGMENTS]" />
                <!-- Material with vertexColors enabled -->
                <TresMeshStandardMaterial :vertexColors="true" :metalness="0.8" :roughness="0.2" />
            </TresInstancedMesh>

            <!-- Lines for connections -->
            <TresLineSegments>
                <!-- Assign geometry ref -->
                <TresBufferGeometry ref="lineGeometryRef">
                    <!-- Attributes are set dynamically -->
                </TresBufferGeometry>
                <TresLineBasicMaterial :vertexColors="true" :opacity="LINE_OPACITY" :transparent="true"
                    :linewidth="LINE_WIDTH" />
            </TresLineSegments>
        </TresObject3D>
    </TresObject3D>
</template>
