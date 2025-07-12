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

// Cache original connection data to avoid recalculating every frame
const connectionData = ref<Array<{
    fromId: number
    toId: number
    archDirection: number
    color: { r: number; g: number; b: number }
}>>([])

// Add computed for reactive debug info
const debugInfo = computed(() => {
    return {
        enabled: props.enabled,
        globalTime: props.globalTime,
        evolutionProgress: props.evolutionProgress,
        galaxyCenter: {
            x: props.galaxyCenter?.x || 0,
            y: props.galaxyCenter?.y || 0,
            z: props.galaxyCenter?.z || 0
        },
        nodes: nodeData.value.length,
        linesInitialized: isLinesInitialized.value,
        connections: connectionData.value.length,
        rotationSpeed: orbitalConfig.rotationSpeed
    }
})

// Calculate arch segment position (segmented arch)
function calculateArchPosition(fromPos: Vector3, toPos: Vector3, t: number, archDirection: number): Vector3 {
    const basePos = fromPos.clone().lerp(toPos, t)
    const archHeight = (tetherConfig.archHeight || 2) * Math.sin(t * Math.PI) * archDirection
    basePos.y += archHeight
    return basePos
}

// Initialize line data - only create static structure, no position calculation
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

        // Build connection data structure (no position calculation)
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

        // Create initial geometry (using current time)
        updateGeometry()

        isLinesInitialized.value = true
        
        Logger.log('TETHERS_TEST', `Initialized ${connections.length} arch connections (${nodeData.value.length} nodes)`)

    } catch (error) {
        Logger.error('TETHERS_TEST', 'Failed to initialize arch lines', error)
    }
}

// Update geometry - recalculate all positions based on current time
function updateGeometry() {
    if (!isComponentMounted.value || connectionData.value.length === 0) return

    try {
        const currentTime = props.globalTime || 0
        const rotationSpeed = orbitalConfig.rotationSpeed || 0
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

            // Calculate current rotated node positions
            const fromAngle = fromNode.angle + currentTime * rotationSpeed
            const toAngle = toNode.angle + currentTime * rotationSpeed

            const fromPos = new Vector3(
                fromNode.radius * Math.cos(fromAngle),
                0,
                fromNode.radius * Math.sin(fromAngle)
            )

            const toPos = new Vector3(
                toNode.radius * Math.cos(toAngle),
                0,
                toNode.radius * Math.sin(toAngle)
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

        // Update or create BufferAttributes
        if (lineGeometry.value) {
            // Update existing geometry
            if (lineGeometry.value.positions.array.length === positions.length) {
                // Same length, update array content directly
                lineGeometry.value.positions.array.set(positions)
                lineGeometry.value.positions.needsUpdate = true
            } else {
                // Different length, recreate
                lineGeometry.value.positions = new BufferAttribute(new Float32Array(positions), 3)
                lineGeometry.value.colors = new BufferAttribute(new Float32Array(colors), 3)
            }
        } else {
            // Create new geometry
            lineGeometry.value = {
                positions: new BufferAttribute(new Float32Array(positions), 3),
                colors: new BufferAttribute(new Float32Array(colors), 3)
            }
        }

    } catch (error) {
        Logger.error('TETHERS_TEST', 'Failed to update geometry', error)
    }
}

// Use Tres render loop - lower update frequency
let renderLoopCleanup: (() => void) | null = null
let lastUpdateTime = 0
const updateInterval = 1000 / 30 // 30 FPS, lower update frequency

function startRenderLoop() {
    if (renderLoopCleanup) return

    const { onLoop, resume } = useRenderLoop()
    
    const stopLoop = onLoop(() => {
        if (!isComponentMounted.value || !props.enabled || !isLinesInitialized.value) return

        try {
            const currentTime = performance.now()
            
            // Limit update frequency
            if (currentTime - lastUpdateTime >= updateInterval) {
                updateGeometry()
                lastUpdateTime = currentTime
            }

            // Update line group position (update every frame, lower performance)
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

// Watch globalTime changes, but don't update positions here (avoid duplicate updates)
watch(() => props.globalTime, (_time) => {
    // Position updates handled in renderLoop
})

onMounted(() => {
    isComponentMounted.value = true
    console.log('TethersTest: Component mounted')
    
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
    console.log('TethersTest: Component unmounted')
})
</script>

<template>
    <!-- Arch line rendering -->
    <TresGroup 
        v-if="props.enabled && isLinesInitialized && lineGeometry" 
        ref="linesGroupRef" 
        :position="props.galaxyCenter"
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