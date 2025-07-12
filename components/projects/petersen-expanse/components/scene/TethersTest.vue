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
const tethersGroupRef = ref()
const linesGroupRef = ref()

// Component state
const isComponentMounted = ref(false)
const isLinesInitialized = ref(false)

// 节点数据
const nodeData = ref<Array<{
    id: number
    radius: number
    angle: number
    type: string
}>>([])

// 线段几何数据
const lineGeometry = ref<{
    positions: BufferAttribute
    colors: BufferAttribute
} | null>(null)

// 添加computed来测试响应式计算
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
        // 新增的调试信息
        nodes: nodeData.value.length,
        linesInitialized: isLinesInitialized.value,
        connections: isLinesInitialized.value ? 
            (tetherConnections?.forward?.length || 0) + (tetherConnections?.reverse?.length || 0) : 0
    }
})

// 初始化线段数据
function initializeLines() {
    if (isLinesInitialized.value) return

    try {
        Logger.log('TETHERS_TEST', 'Initializing lines...')

        // 验证数据
        if (!starClusterConfig?.stars || starClusterConfig.stars.length === 0) {
            throw new Error('No star data available')
        }

        if (!tetherConfig || !tetherConnections) {
            throw new Error('Tether configuration not available')
        }

        // 准备节点数据
        nodeData.value = starClusterConfig.stars.map(star => ({
            id: star.id,
            radius: star.r,
            angle: star.theta * Math.PI / 180,
            type: star.type
        }))

        // 创建线段数据
        const positions: number[] = []
        const colors: number[] = []

        // 添加线段的辅助函数
        const addLine = (
            fromId: number, 
            toId: number, 
            color: { r: number; g: number; b: number }
        ) => {
            if (fromId >= nodeData.value.length || toId >= nodeData.value.length) {
                Logger.warn('TETHERS_TEST', `Invalid connection: [${fromId}, ${toId}]`)
                return
            }

            const fromNode = nodeData.value[fromId]
            const toNode = nodeData.value[toId]

            // 计算节点位置（使用当前时间）
            const currentTime = props.globalTime || 0
            const rotationSpeed = orbitalConfig.rotationSpeed || 0

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

            // 添加线段（从 fromPos 到 toPos）
            positions.push(fromPos.x, fromPos.y, fromPos.z)
            positions.push(toPos.x, toPos.y, toPos.z)

            // 添加颜色（每个顶点一个颜色）
            colors.push(color.r, color.g, color.b)
            colors.push(color.r, color.g, color.b)
        }

        // 添加前向连接（30根线）
        if (tetherConnections.forward) {
            tetherConnections.forward.forEach(connection => {
                addLine(connection[0], connection[1], tetherConfig.colors.forward)
            })
        }

        // 添加反向连接（30根线）
        if (tetherConnections.reverse) {
            tetherConnections.reverse.forEach(connection => {
                addLine(connection[0], connection[1], tetherConfig.colors.reverse)
            })
        }

        // 创建BufferAttributes
        if (positions.length > 0) {
            lineGeometry.value = {
                positions: new BufferAttribute(new Float32Array(positions), 3),
                colors: new BufferAttribute(new Float32Array(colors), 3)
            }
        }

        isLinesInitialized.value = true
        
        Logger.log('TETHERS_TEST', `Initialized ${positions.length / 6} line segments (${nodeData.value.length} nodes)`)

    } catch (error) {
        Logger.error('TETHERS_TEST', 'Failed to initialize lines', error)
    }
}

// 更新线段位置（基于当前时间）
function updateLinePositions() {
    if (!isLinesInitialized.value || !lineGeometry.value || !props.enabled) return

    try {
        const positions: number[] = []
        const currentTime = props.globalTime || 0
        const rotationSpeed = orbitalConfig.rotationSpeed || 0

        // 重新计算所有线段位置
        const addLine = (fromId: number, toId: number) => {
            if (fromId >= nodeData.value.length || toId >= nodeData.value.length) return

            const fromNode = nodeData.value[fromId]
            const toNode = nodeData.value[toId]

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

            positions.push(fromPos.x, fromPos.y, fromPos.z)
            positions.push(toPos.x, toPos.y, toPos.z)
        }

        // 重新计算前向连接
        if (tetherConnections.forward) {
            tetherConnections.forward.forEach(connection => {
                addLine(connection[0], connection[1])
            })
        }

        // 重新计算反向连接
        if (tetherConnections.reverse) {
            tetherConnections.reverse.forEach(connection => {
                addLine(connection[0], connection[1])
            })
        }

        // 更新BufferAttribute
        if (positions.length > 0) {
            lineGeometry.value.positions.array = new Float32Array(positions)
            lineGeometry.value.positions.needsUpdate = true
        }

    } catch (error) {
        Logger.error('TETHERS_TEST', 'Failed to update line positions', error)
    }
}

// 使用Tres的渲染循环
let renderLoopCleanup: (() => void) | null = null

function startRenderLoop() {
    if (renderLoopCleanup) return

    const { onLoop, resume } = useRenderLoop()
    
    const stopLoop = onLoop(() => {
        if (!isComponentMounted.value || !props.enabled) return

        try {
            // 更新原来的测试几何体
            if (tethersGroupRef.value && props.galaxyCenter) {
                tethersGroupRef.value.position.copy(props.galaxyCenter)
                
                // 基于props改变颜色
                const mesh = tethersGroupRef.value.children[0]
                if (mesh && mesh.material) {
                    // 基于evolutionProgress改变颜色
                    const progress = props.evolutionProgress
                    const red = progress
                    const green = 1 - progress
                    mesh.material.color.setRGB(red, green, 0)
                }
                
                // 基于globalTime旋转
                tethersGroupRef.value.rotation.y = props.globalTime * 0.1
            }

            // 更新线段位置（基于全局时间）
            updateLinePositions()

            // 更新线段组位置
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
        // 如果演化已经完成，初始化线段
        if (props.evolutionProgress >= 1.0 && !isLinesInitialized.value) {
            initializeLines()
        }
    } else {
        stopRenderLoop()
    }
})

// Watch for other props to test reactivity
watch(() => props.evolutionProgress, (progress) => {
    console.log('TethersTest: Evolution progress changed to', progress)
    // 当演化完成时初始化线段
    if (progress >= 1.0 && !isLinesInitialized.value && props.enabled) {
        initializeLines()
    }
})

watch(() => props.globalTime, (time) => {
    console.log('TethersTest: Global time changed to', time)
})

onMounted(() => {
    isComponentMounted.value = true
    console.log('TethersTest: Component mounted with props:', debugInfo.value)
    
    if (props.enabled) {
        startRenderLoop()
        // 如果演化已经完成，立即初始化线段
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