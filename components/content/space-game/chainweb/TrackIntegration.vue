<script setup lang="ts">
import { ref, onMounted, watch, computed, inject } from 'vue'
import { Vector3, MathUtils, Matrix4, Euler, InstancedMesh, Color, Object3D } from 'three'
import type { GameStore } from '../GameStore'
import PetersenGraphPortal from './PetersenGraphPortal.vue'
import ChainWeb3D from './ChainWeb3D.vue'
import * as audio from '../audio'

const props = defineProps({
    portalPosition: {
        type: Number,
        default: 0.05, // t parameter for the starting portal
    },
    chainWebPosition: {
        type: Number,
        default: 0.65, // t parameter for the ChainWeb3D (after rings)
    },
    numPortals: {
        type: Number,
        default: 1,
    },
    numChainWebs: {
        type: Number,
        default: 3,
    },
    // Node instancing parameters
    nodeInstanceCount: {
        type: Number,
        default: 100, // Number of node instances per ChainWeb
    },
    // Edge instancing parameters 
    edgeInstanceCount: {
        type: Number,
        default: 300, // Number of edge instances per ChainWeb
    }
})

const gameStore = inject('gameStore') as GameStore
const portals = ref<Array<{ position: Vector3, rotation: any, scale: number, active: boolean }>>([])
const chainWebs = ref<Array<{ position: Vector3, rotation: any, scale: number, active: boolean }>>([])

// Instanced node objects
const nodeInstances = ref<InstancedMesh | null>(null)
const nodePositions = ref<Vector3[]>([])
const nodeColors = ref<Color[]>([])

// Instanced edge objects
const edgePositions = ref<{ start: Vector3, end: Vector3 }[]>([])

// Track player position for performance optimizations
const playerT = computed(() => gameStore.mutation.t)

// Temporary object used for instancing position and rotation setup
const tempObject = new Object3D()

// Generate positions based on track t parameter (similar to randomRings in GameStore)
function generatePositionFromT(t: number) {
    const track = gameStore.mutation.track
    const pos = track.parameters.path.getPointAt(t)
    pos.multiplyScalar(gameStore.mutation.scale)

    // Calculate rotation to align with track
    const segments = track.tangents.length
    const pickt = t * segments
    const pick = Math.floor(pickt)
    const lookAt = track.parameters.path.getPointAt((t + 1 / track.parameters.path.getLength()) % 1)
        .multiplyScalar(gameStore.mutation.scale)

    // Use lookAt to determine rotation
    const direction = new Vector3().subVectors(lookAt, pos).normalize()
    const up = track.binormals[pick] || new Vector3(0, 1, 0)

    // Create rotation from direction and up vector
    const matrix = new Matrix4().lookAt(pos, lookAt, up)
    const rotation = new Euler().setFromRotationMatrix(matrix)

    return {
        position: pos,
        rotation,
        scale: 25 // Base scale
    }
}

// Generate node instance data
function generateNodeInstances(chainWebPosition: Vector3, scale: number) {
    const nodeCount = props.nodeInstanceCount
    const radius = scale * 0.4

    for (let i = 0; i < nodeCount; i++) {
        // Distribute nodes evenly on sphere surface
        const phi = Math.acos(-1 + (2 * i) / nodeCount)
        const theta = Math.sqrt(nodeCount * Math.PI) * phi

        const x = radius * Math.sin(phi) * Math.cos(theta)
        const y = radius * Math.sin(phi) * Math.sin(theta)
        const z = radius * Math.cos(phi)

        const position = new Vector3(
            chainWebPosition.x + x,
            chainWebPosition.y + y,
            chainWebPosition.z + z
        )

        nodePositions.value.push(position)

        // Assign colors to nodes (based on position or other attributes)
        const color = new Color(0.5 + Math.random() * 0.5, Math.random() * 0.5, 0.5 + Math.random() * 0.5)
        nodeColors.value.push(color)
    }
}

// Generate edge instance data
function generateEdgeInstances() {
    const edgeCount = props.edgeInstanceCount
    const nodes = nodePositions.value

    if (nodes.length < 2) return

    // Create connections - can use different connection strategies
    for (let i = 0; i < edgeCount; i++) {
        // Randomly create connections between nodes
        const startIndex = Math.floor(Math.random() * nodes.length)
        let endIndex

        // Ensure no self-connections
        do {
            endIndex = Math.floor(Math.random() * nodes.length)
        } while (endIndex === startIndex)

        edgePositions.value.push({
            start: nodes[startIndex],
            end: nodes[endIndex]
        })
    }
}

// Update instanced mesh positions and rotations
function updateInstancedMeshes() {
    // Update node instances
    if (nodeInstances.value && nodePositions.value.length > 0) {
        nodePositions.value.forEach((position, i) => {
            tempObject.position.copy(position)
            // Add random rotation effects
            tempObject.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            )
            tempObject.scale.set(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5)

            tempObject.updateMatrix()
            nodeInstances.value?.setMatrixAt(i, tempObject.matrix)
            nodeInstances.value?.setColorAt(i, nodeColors.value[i] || new Color(1, 1, 1))
        })

        nodeInstances.value.instanceMatrix.needsUpdate = true
        // @ts-ignore - instanceColor exists but might not be in the type definitions
        if (nodeInstances.value.instanceColor) nodeInstances.value.instanceColor.needsUpdate = true
    }

    // Line updates are handled in the template
}

onMounted(() => {
    // Create portals at the beginning of the track
    for (let i = 0; i < props.numPortals; i++) {
        const t = props.portalPosition + (i * 0.01) // Small spacing between multiple portals if needed
        const portalData = generatePositionFromT(t)
        portals.value.push({
            ...portalData,
            active: true
        })
    }

    // Create ChainWeb3D visualizations after rings
    for (let i = 0; i < props.numChainWebs; i++) {
        const t = props.chainWebPosition + (i * 0.05) // More spacing between ChainWeb visualizations
        const chainWebData = generatePositionFromT(t)
        const newScale = chainWebData.scale * (1 + i * 0.2) // Increase scale for each subsequent chainweb

        chainWebs.value.push({
            ...chainWebData,
            scale: newScale,
            active: true
        })

        // Generate nodes and edges for each ChainWeb
        generateNodeInstances(chainWebData.position, newScale)
    }

    // Generate edge connection data
    generateEdgeInstances()

    // Update instanced meshes after initialization
    updateInstancedMeshes()
})

// Optimization: Update active state based on player proximity
watch(playerT, (newT) => {
    // Only activate objects that are nearby the player (within ±0.15 on t parameter)
    portals.value.forEach((portal, index) => {
        const portalT = props.portalPosition + (index * 0.01)
        portal.active = Math.abs(newT - portalT) < 0.15 ||
            Math.abs(newT - portalT + 1) < 0.15 ||
            Math.abs(newT - portalT - 1) < 0.15 // Handle loop around
    })

    chainWebs.value.forEach((chainWeb, index) => {
        const chainWebT = props.chainWebPosition + (index * 0.05)
        chainWeb.active = Math.abs(newT - chainWebT) < 0.15 ||
            Math.abs(newT - chainWebT + 1) < 0.15 ||
            Math.abs(newT - chainWebT - 1) < 0.15 // Handle loop around
    })

    // Update instanced meshes when in view to create dynamic effect
    if (chainWebs.value.some(cw => cw.active)) {
        // Simple animation effect - subtle node movement
        nodePositions.value = nodePositions.value.map(pos => {
            return new Vector3(
                pos.x + (Math.random() - 0.5) * 0.05,
                pos.y + (Math.random() - 0.5) * 0.05,
                pos.z + (Math.random() - 0.5) * 0.05
            )
        })

        updateInstancedMeshes()
    }
})

// Handle acceleration effect to update GameStore
const handleAcceleration = () => {
    // Similar to warp effect in GameStore.ts
    gameStore.actions.playAudio(audio.warp)

    // Store original values
    const originalFov = gameStore.mutation.fov
    const originalLooptime = gameStore.mutation.looptime

    // Increase speed by reducing looptime and increasing FOV
    gameStore.mutation.looptime = originalLooptime * 0.8
    gameStore.mutation.fov = originalFov * 1.3

    // Return to normal after 2 seconds
    setTimeout(() => {
        gameStore.mutation.looptime = originalLooptime
        gameStore.mutation.fov = originalFov
    }, 2000)
}

// Handle portal transition effect
const handlePortalTransition = () => {
    // Visual transition effect
    gameStore.actions.playAudio(audio.warp, 0.7)

    const originalFov = gameStore.mutation.fov
    gameStore.mutation.fov = originalFov * 1.2

    // Return to normal after transition
    setTimeout(() => {
        gameStore.mutation.fov = originalFov
    }, 1500)
}
</script>

<template>
    <TresObject3D>
        <!-- Portals at game start -->
        <template v-for="(portal, index) in portals" :key="`portal-${index}`">
            <PetersenGraphPortal v-if="portal.active" :position="portal.position" :rotation="portal.rotation"
                :scale="portal.scale" @portal-entered="handlePortalTransition" />
        </template>

        <!-- ChainWeb3D components after rings -->
        <template v-for="(chainWeb, index) in chainWebs" :key="`chainweb-${index}`">
            <ChainWeb3D v-if="chainWeb.active" :position="chainWeb.position" :rotation="chainWeb.rotation"
                :scale="chainWeb.scale" @accelerate="handleAcceleration" />
        </template>

        <!-- Instanced node rendering -->
        <TresInstancedMesh ref="nodeInstances" :count="nodePositions.length" :args="[null, null, nodePositions.length]">
            <TresSphereGeometry :args="[0.5, 16, 16]" />
            <TresMeshStandardMaterial :args="[{ vertexColors: true }]" :metalness="0.8" :roughness="0.2" />
        </TresInstancedMesh>

        <!-- Instanced line rendering -->
        <template v-for="(edge, index) in edgePositions" :key="`edge-${index}`">
            <TresLineSegments v-if="index < 100"> <!-- Limit line segments for performance -->
                <TresBufferGeometry>
                    <TresFloat32BufferAttribute :attach="['attributes', 'position']" :args="[[
                        edge.start.x, edge.start.y, edge.start.z,
                        edge.end.x, edge.end.y, edge.end.z
                    ], 3]" />
                </TresBufferGeometry>
                <TresLineBasicMaterial :color="0x88ccff" :opacity="0.6" :transparent="true" :linewidth="1" />
            </TresLineSegments>
        </template>
    </TresObject3D>
</template>
