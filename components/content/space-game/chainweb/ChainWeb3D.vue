<script setup lang="ts">
import { ref, onMounted, computed, watch, inject } from 'vue'
import { Color, Vector3, Vector2, Euler, InstancedMesh, Object3D, BufferGeometry, BufferAttribute } from 'three'
import type { GameStore } from '../GameStore'
import PlasmaNode from './PlasmaNode.vue'
import PlasmaArc from './PlasmaArc.vue'
import ConcentricRings from './ConcentricRings.vue'
import { useRenderLoop, useThree } from '@tresjs/core'
import { createLayer, generateIntraLayerConnections, generateInterLayerConnections, createRingConfigurations } from './utils/ChainwebTopology'

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

const gameStore = inject('gameStore') as GameStore
const { camera } = useThree()
const insideInnerRing = ref(false)
const emitOnce = ref(false)
const layers = ref<any[]>([])
const numLayers = 8
const ringRadii = [0.15, 0.3, 0.48] // Matching the constants from ChainwebTopology

// Instanced mesh references
const nodeInstancesRef = ref<InstancedMesh | null>(null)
const nodePositions = ref<Vector3[]>([])
const nodeColors = ref<Color[]>([])
const nodeScales = ref<number[]>([])
const tempObject = new Object3D()

// Line instances for connections
const linePositions = ref<Float32Array>(new Float32Array(0))
const lineColors = ref<Float32Array>(new Float32Array(0))
const lineGeometryRef = ref(null)

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

// Generate instances instead of individual nodes
function prepareInstancedNodes() {
    nodePositions.value = []
    nodeColors.value = []
    nodeScales.value = []

    // Create instanced data for all nodes across all layers
    layers.value.slice(0, visibleLayers.value).forEach(layer => {
        layer.nodes.forEach(node => {
            nodePositions.value.push(node.position)
            nodeColors.value.push(new Color(node.color))
            nodeScales.value.push(node.radius / 0.5) // Adjust for the base sphere radius of 0.5
        })
    })

    // Update instanced mesh
    if (nodeInstancesRef.value && nodePositions.value.length > 0) {
        nodePositions.value.forEach((position, i) => {
            tempObject.position.copy(position)
            tempObject.scale.set(
                nodeScales.value[i],
                nodeScales.value[i],
                nodeScales.value[i]
            )
            tempObject.updateMatrix()
            nodeInstancesRef.value?.setMatrixAt(i, tempObject.matrix)
            nodeInstancesRef.value?.setColorAt(i, nodeColors.value[i])
        })

        nodeInstancesRef.value.instanceMatrix.needsUpdate = true
        // @ts-ignore - TypeScript doesn't always recognize this property
        if (nodeInstancesRef.value.instanceColor) nodeInstancesRef.value.instanceColor.needsUpdate = true
    }
}

// Generate lines for connections
function prepareConnectionLines() {
    const visibleConnectionCount = visibleLayers.value < numLayers ? 30 : 60
    let lineCount = 0

    // Count total visible connections
    layers.value.slice(0, visibleLayers.value).forEach(layer => {
        lineCount += Math.min(layer.intraLayerConnections.length, visibleConnectionCount)

        // Count inter-layer connections if not the last layer
        if (layer.id < visibleLayers.value - 1) {
            lineCount += Math.min(layer.interLayerConnections.length, visibleConnectionCount)
        }
    })

    // Prepare buffer for line positions (6 floats per line: 2 vertices * 3 coordinates)
    linePositions.value = new Float32Array(lineCount * 6)
    lineColors.value = new Float32Array(lineCount * 6)

    let idx = 0

    // Fill connection data
    layers.value.slice(0, visibleLayers.value).forEach(layer => {
        // Intra-layer connections (within same layer)
        layer.intraLayerConnections.slice(0, visibleConnectionCount).forEach(conn => {
            const startNode = layer.nodes.find(n => n.chainId === conn.fromNode)
            const endNode = layer.nodes.find(n => n.chainId === conn.toNode)

            if (startNode && endNode) {
                // Start vertex
                linePositions.value[idx * 6] = startNode.position.x
                linePositions.value[idx * 6 + 1] = startNode.position.y
                linePositions.value[idx * 6 + 2] = startNode.position.z

                // End vertex
                linePositions.value[idx * 6 + 3] = endNode.position.x
                linePositions.value[idx * 6 + 4] = endNode.position.y
                linePositions.value[idx * 6 + 5] = endNode.position.z

                // Color from connection
                const color = new Color(conn.color)
                lineColors.value[idx * 6] = color.r
                lineColors.value[idx * 6 + 1] = color.g
                lineColors.value[idx * 6 + 2] = color.b
                lineColors.value[idx * 6 + 3] = color.r
                lineColors.value[idx * 6 + 4] = color.g
                lineColors.value[idx * 6 + 5] = color.b

                idx++
            }
        })

        // Inter-layer connections (between layers)
        if (layer.id < visibleLayers.value - 1) {
            layer.interLayerConnections.slice(0, visibleConnectionCount).forEach(conn => {
                const startNode = layer.nodes.find(n => n.chainId === conn.fromNode)
                const nextLayer = layers.value[layer.id + 1]
                const endNode = nextLayer.nodes.find(n => n.chainId === conn.toNode)

                if (startNode && endNode) {
                    // Start vertex
                    linePositions.value[idx * 6] = startNode.position.x
                    linePositions.value[idx * 6 + 1] = startNode.position.y
                    linePositions.value[idx * 6 + 2] = startNode.position.z

                    // End vertex
                    linePositions.value[idx * 6 + 3] = endNode.position.x
                    linePositions.value[idx * 6 + 4] = endNode.position.y
                    linePositions.value[idx * 6 + 5] = endNode.position.z

                    // Color from connection
                    const color = new Color(conn.color)
                    lineColors.value[idx * 6] = color.r
                    lineColors.value[idx * 6 + 1] = color.g
                    lineColors.value[idx * 6 + 2] = color.b
                    lineColors.value[idx * 6 + 3] = color.r
                    lineColors.value[idx * 6 + 4] = color.g
                    lineColors.value[idx * 6 + 5] = color.b

                    idx++
                }
            })
        }
    })

    // Update the line geometry's attributes if it exists
    if (lineGeometryRef.value) {
        const geometry = lineGeometryRef.value as BufferGeometry
        geometry.setAttribute('position', new BufferAttribute(linePositions.value, 3))
        geometry.setAttribute('color', new BufferAttribute(lineColors.value, 3))
        geometry.attributes.position.needsUpdate = true
        geometry.attributes.color.needsUpdate = true
    }
}

// Prepare data structure for ChainWeb3D
onMounted(() => {
    // Initialize layers using ChainwebTopology
    layers.value = Array(numLayers).fill(null).map((_, layerIndex) => {
        const zPosition = -0.2 * layerIndex
        const layerScale = 1 - (layerIndex * 0.05) // Each layer gets slightly smaller for perspective

        // Create nodes for this layer using the topology utility
        const nodes = createLayer(layerIndex, zPosition, layerScale)

        return {
            id: layerIndex,
            zPosition,
            scale: layerScale,
            nodes,
            intraLayerConnections: [], // Will fill later
            interLayerConnections: []  // Will fill later
        }
    })

    // Generate intra-layer connections (within each layer)
    layers.value.forEach(layer => {
        layer.intraLayerConnections = generateIntraLayerConnections(layer.nodes)
    })

    // Generate inter-layer connections (between adjacent layers)
    for (let i = 0; i < numLayers - 1; i++) {
        const sourceLayer = layers.value[i]
        const targetLayer = layers.value[i + 1]

        sourceLayer.interLayerConnections = generateInterLayerConnections(
            sourceLayer.nodes,
            targetLayer.nodes
        )
    }

    // Initial setup of instanced rendering
    prepareInstancedNodes()
    prepareConnectionLines()
})

// Check if player is inside innermost ring to trigger acceleration
const checkPlayerInnerRing = () => {
    if (!props.active || !gameStore) return

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

// Update instanced meshes when visibility changes
watch(visibleLayers, () => {
    prepareInstancedNodes()
    prepareConnectionLines()
})

// Update on each frame
useRenderLoop().onLoop(({ elapsed, delta }) => {
    if (props.active) {
        checkPlayerInnerRing()

        // Add gentle rotation
        rotationY.value += delta * 0.2

        // Periodically update positions for animation effect
        if (elapsed % 10 < 0.1) {
            prepareInstancedNodes()
            prepareConnectionLines()
        }
    }
})
</script>

<template>
    <TresObject3D v-if="isVisible" :position="position" :rotation="rotation" :scale="[scale, scale, scale]">
        <!-- Apply additional rotation animation -->
        <TresObject3D :rotation="[0, rotationY, 0]">
            <!-- Render visible layers only -->
            <template v-for="layer in layers.slice(0, visibleLayers)" :key="layer.id">
                <!-- Concentric Rings for each layer, using the ring configurations from topology -->
                <ConcentricRings :position="[0, 0, layer.zPosition]" :scale="layer.scale" :radii="ringRadii"
                    :rotation-speed="0.05 * (1 + layer.id * 0.1)" />
            </template>

            <!-- Instanced mesh for all nodes -->
            <TresInstancedMesh ref="nodeInstancesRef" :count="nodePositions.length"
                :args="[null, null, nodePositions.length]">
                <TresSphereGeometry :args="[0.5, 12, 12]" />
                <TresMeshStandardMaterial :args="[{ vertexColors: true }]" :metalness="0.8" :roughness="0.2" />
            </TresInstancedMesh>

            <!-- Lines for connections -->
            <TresLineSegments>
                <TresBufferGeometry ref="lineGeometryRef">
                    <TresFloat32BufferAttribute :attach="['attributes', 'position']" :args="[linePositions, 3]" />
                    <TresFloat32BufferAttribute :attach="['attributes', 'color']" :args="[lineColors, 3]" />
                </TresBufferGeometry>
                <TresLineBasicMaterial :vertexColors="true" :opacity="0.7" :transparent="true" :linewidth="1" />
            </TresLineSegments>
        </TresObject3D>
    </TresObject3D>
</template>
