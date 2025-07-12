<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { Vector3, BufferAttribute } from 'three'
import { useRenderLoop } from '@tresjs/core'

import { tetherConfig, tetherConnections } from '../../configs/tether-config'
import { starClusterConfig } from '../../configs/star-cluster-config'
import { orbitalConfig } from '../../configs/orbital-config'
import { Logger } from '../../../../utils/logger'

interface Props {
    enabled?: boolean
    globalTime?: number
    evolutionProgress?: number
    galaxyCenter?: Vector3
    cameraRef?: any
}

const props = withDefaults(defineProps<Props>(), {
    enabled: true,
    globalTime: 0,
    evolutionProgress: 0,
    galaxyCenter: () => new Vector3(0, 0, 0),
    cameraRef: null,
})

// Three.js object refs
const linesGroupRef = ref()

// Component state
const isComponentMounted = ref(false)
const isLinesInitialized = ref(false)

// Node data
const nodeData = ref<Array<{
    id: number
    radius: number
    angle: number
    type: string
}>>([])

// Line geometry data
const lineGeometry = ref<{
    positions: BufferAttribute
    colors: BufferAttribute
} | null>(null)

// Cache original connection data
const connectionData = ref<Array<{
    fromId: number
    toId: number
    archDirection: number
    color: { r: number; g: number; b: number }
}>>([])

const currentRotation = computed(() => {
    const rotationSpeed = orbitalConfig.rotationSpeed || 0
    return props.globalTime * rotationSpeed
})

// Calculate arch segment position
function calculateArchPosition(fromPos: Vector3, toPos: Vector3, t: number, archDirection: number): Vector3 {
    const basePos = fromPos.clone().lerp(toPos, t)
    const archHeight = (tetherConfig.archHeight || 2) * Math.sin(t * Math.PI) * archDirection
    basePos.y += archHeight
    return basePos
}

function initializeLines() {
    if (isLinesInitialized.value) return

    try {
        Logger.log('TETHERS_TEST', 'Initializing arch lines...')

        // Validate data
        if (!starClusterConfig?.stars || starClusterConfig.stars.length === 0) {
            throw new Error('No star data available')
        }

        if (!tetherConfig || !tetherConnections) {
            throw new Error('Tether configuration not available')
        }

        // Prepare node data
        nodeData.value = starClusterConfig.stars.map(star => ({
            id: star.id,
            radius: star.r,
            angle: star.theta * Math.PI / 180,
            type: star.type
        }))

        // Build connection data structure
        const connections: typeof connectionData.value = []

        // Add forward connections (upward arch)
        if (tetherConnections.forward) {
            tetherConnections.forward.forEach(connection => {
                connections.push({
                    fromId: connection[0],
                    toId: connection[1],
                    archDirection: 1,
                    color: tetherConfig.colors.forward
                })
            })
        }

        // Add reverse connections (downward arch)
        if (tetherConnections.reverse) {
            tetherConnections.reverse.forEach(connection => {
                connections.push({
                    fromId: connection[0],
                    toId: connection[1],
                    archDirection: -1,
                    color: tetherConfig.colors.reverse
                })
            })
        }

        connectionData.value = connections

        // Create static geometry (no rotation applied)
        createStaticGeometry()

        isLinesInitialized.value = true
        
        Logger.log('TETHERS_TEST', `Initialized ${connections.length} arch connections (${nodeData.value.length} nodes)`)

    } catch (error) {
        Logger.error('TETHERS_TEST', 'Failed to initialize arch lines', error)
    }
}

function createStaticGeometry() {
    if (connectionData.value.length === 0) return

    try {
        const archSegments = tetherConfig.archSegments || 20
        const positions: number[] = []
        const colors: number[] = []

        // Iterate all connections
        connectionData.value.forEach(conn => {
            if (conn.fromId >= nodeData.value.length || conn.toId >= nodeData.value.length) {
                return
            }

            const fromNode = nodeData.value[conn.fromId]
            const toNode = nodeData.value[conn.toId]

            const fromPos = new Vector3(
                fromNode.radius * Math.cos(fromNode.angle),
                0,
                fromNode.radius * Math.sin(fromNode.angle)
            )

            const toPos = new Vector3(
                toNode.radius * Math.cos(toNode.angle),
                0,
                toNode.radius * Math.sin(toNode.angle)
            )

            // Create arch segments
            for (let i = 0; i < archSegments; i++) {
                const t1 = i / archSegments
                const t2 = (i + 1) / archSegments

                const pos1 = calculateArchPosition(fromPos, toPos, t1, conn.archDirection)
                const pos2 = calculateArchPosition(fromPos, toPos, t2, conn.archDirection)

                // Add line segment
                positions.push(pos1.x, pos1.y, pos1.z)
                positions.push(pos2.x, pos2.y, pos2.z)

                // Add color
                colors.push(conn.color.r, conn.color.g, conn.color.b)
                colors.push(conn.color.r, conn.color.g, conn.color.b)
            }
        })

        // Create geometry once
        lineGeometry.value = {
            positions: new BufferAttribute(new Float32Array(positions), 3),
            colors: new BufferAttribute(new Float32Array(colors), 3)
        }

    } catch (error) {
        Logger.error('TETHERS_TEST', 'Failed to create static geometry', error)
    }
}

let renderLoopCleanup: (() => void) | null = null

function startRenderLoop() {
    if (renderLoopCleanup) return

    const { onLoop, resume } = useRenderLoop()
    
    const stopLoop = onLoop(() => {
        if (!isComponentMounted.value || !props.enabled || !isLinesInitialized.value) return

        try {
            if (linesGroupRef.value) {
                linesGroupRef.value.position.copy(props.galaxyCenter)
            }

        } catch (error) {
            console.error('Tethers render loop error:', error)
        }
    })

    renderLoopCleanup = () => stopLoop.off()
    resume()
}

function stopRenderLoop() {
    if (renderLoopCleanup) {
        renderLoopCleanup()
        renderLoopCleanup = null
    }
}

// Watch for enabled state
watch(() => props.enabled, (enabled) => {
    if (enabled && isComponentMounted.value) {
        startRenderLoop()
        if (props.evolutionProgress >= 1.0 && !isLinesInitialized.value) {
            initializeLines()
        }
    } else {
        stopRenderLoop()
    }
})

// Watch for evolution progress
watch(() => props.evolutionProgress, (progress) => {
    if (progress >= 1.0 && !isLinesInitialized.value && props.enabled) {
        initializeLines()
    }
})

onMounted(() => {
    isComponentMounted.value = true
    
    if (props.enabled) {
        startRenderLoop()
        if (props.evolutionProgress >= 1.0) {
            initializeLines()
        }
    }
})

onUnmounted(() => {
    isComponentMounted.value = false
    stopRenderLoop()
})
</script>

<template>
    <TresGroup 
        v-if="props.enabled && isLinesInitialized && lineGeometry" 
        ref="linesGroupRef" 
        :position="props.galaxyCenter"
        :rotation="[0, currentRotation, 0]"
    >
        <TresLineSegments>
            <TresBufferGeometry>
                <TresBufferAttribute 
                    :args="[lineGeometry.positions.array, 3]"
                    attach="attributes-position"
                />
                <TresBufferAttribute 
                    :args="[lineGeometry.colors.array, 3]"
                    attach="attributes-color"
                />
            </TresBufferGeometry>
            <TresLineBasicMaterial 
                :vertex-colors="true"
                :transparent="true"
                :opacity="0.8"
            />
        </TresLineSegments>
    </TresGroup>
</template>