<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Vector3 } from 'three'
import { useRenderLoop } from '@tresjs/core'

interface Props {
    enabled?: boolean
    galaxyCenter?: Vector3
}

const props = withDefaults(defineProps<Props>(), {
    enabled: true,
    galaxyCenter: () => new Vector3(0, 0, 0)
})

// Three.js object refs
const dotBoxGroupRef = ref()

// Component state
const isComponentMounted = ref(false)

// 使用Tres的渲染循环
let renderLoopCleanup: (() => void) | null = null

function startRenderLoop() {
    if (renderLoopCleanup) return

    const { onLoop, resume } = useRenderLoop()

    const stopLoop = onLoop(() => {
        if (!isComponentMounted.value || !props.enabled) return

        try {
            if (dotBoxGroupRef.value) {
                dotBoxGroupRef.value.rotation.y += 0.01
                dotBoxGroupRef.value.position.copy(props.galaxyCenter)
            }
        } catch (error) {
            console.error('GridDotBox render loop error:', error)
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
    } else {
        stopRenderLoop()
    }
})

onMounted(() => {
    isComponentMounted.value = true
    if (props.enabled) {
        startRenderLoop()
    }
})

onUnmounted(() => {
    isComponentMounted.value = false
    stopRenderLoop()
})
</script>

<template>
    <TresGroup v-if="props.enabled" ref="dotBoxGroupRef" :position="props.galaxyCenter">
        <TresMesh>
            <TresSphereGeometry :args="[0.2, 8, 6]" />
            <TresMeshBasicMaterial color="#ff0000" />
        </TresMesh>

        <TresMesh :position="[0, 0.5, 0]">
            <TresBoxGeometry :args="[0.3, 0.3, 0.3]" />
            <TresMeshBasicMaterial color="#ffffff" :wireframe="true" />
        </TresMesh>
    </TresGroup>
</template>