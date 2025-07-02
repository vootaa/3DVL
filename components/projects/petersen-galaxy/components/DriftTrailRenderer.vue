<script setup lang="ts">
import { ref, inject, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { Vector3, AdditiveBlending, Float32BufferAttribute } from 'three'
import { Logger } from '../../../utils/logger'
import { useDriftState } from '../composables/useDriftState'

// Use global drift state
const { driftState, cleanup } = useDriftState()

// Inject drift controller and data (fallback)
const driftController = inject<any>('driftController', null)
const galaxyDriftData = inject<any>('galaxyDriftData', null)

// Trail state
const trailRef = ref()
const isTrailVisible = ref(false)
const maxTrailPoints = 100
const trailPoints = ref<Vector3[]>([])
const trailOpacities = ref<number[]>([])

// Clear trail data
const clearTrail = () => {
  trailPoints.value = []
  trailOpacities.value = []
}

// 辅助函数：获取轨迹颜色
const getTrailColor = (index: number, total: number) => {
  const age = index / Math.max(total - 1, 1)
  const hue = 180 + age * 60 // 从青色到蓝色
  const saturation = 100
  const lightness = 50 + age * 30 // 新点更亮
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// 辅助函数：获取位置数组用于连线
const getPositionsArray = () => {
  const positions = new Float32Array(trailPoints.value.length * 3)
  for (let i = 0; i < trailPoints.value.length; i++) {
    const point = trailPoints.value[i]
    positions[i * 3] = point.x
    positions[i * 3 + 1] = point.y
    positions[i * 3 + 2] = point.z
  }
  return positions
}

// 计算属性：获取当前位置
const getCurrentPosition = computed(() => {
  if (trailPoints.value.length === 0) return [0, 0, 0] as [number, number, number]
  const last = trailPoints.value[trailPoints.value.length - 1]
  return [last.x, last.y, last.z] as [number, number, number]
})

// Watch for trail state changes from multiple sources
watch(
  () => driftState.trailsEnabled || driftController?.trailsEnabled?.value,
  (enabled) => {
    isTrailVisible.value = !!enabled
    if (!enabled) {
      clearTrail()
    }
    Logger.log('DRIFT_TRAIL_RENDERER', `Trail visibility: ${enabled} (global: ${driftState.trailsEnabled}, controller: ${driftController?.trailsEnabled?.value})`)
  },
  { immediate: true }
)

// Also watch for global drift state availability
watch(
  () => driftState.isAvailable,
  (available) => {
    if (available && driftState.trailsEnabled) {
      isTrailVisible.value = true
      Logger.log('DRIFT_TRAIL_RENDERER', 'Drift became available, enabling trails')
    }
  },
  { immediate: true }
)

// Add point to trail
const addTrailPoint = (position: Vector3) => {
  // Add new point
  trailPoints.value.push(position.clone())
  trailOpacities.value.push(1.0)
  
  // Remove old points if too many
  if (trailPoints.value.length > maxTrailPoints) {
    trailPoints.value.shift()
    trailOpacities.value.shift()
  }
  
  // Fade older points
  for (let i = 0; i < trailOpacities.value.length; i++) {
    const age = i / (trailOpacities.value.length - 1)
    trailOpacities.value[i] = Math.pow(age, 0.5) // Square root fade for better visibility
  }
}

// Update trail geometry
const updateTrailGeometry = () => {
  if (!trailRef.value || trailPoints.value.length < 1) return
  
  try {
    const geometry = trailRef.value.geometry
    const positions = new Float32Array(trailPoints.value.length * 3)
    const alphas = new Float32Array(trailPoints.value.length)
    
    for (let i = 0; i < trailPoints.value.length; i++) {
      const point = trailPoints.value[i]
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
      alphas[i] = trailOpacities.value[i] || 1.0
    }
    
    // Update geometry attributes
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('alpha', new Float32BufferAttribute(alphas, 1))
    geometry.setDrawRange(0, trailPoints.value.length)
    
    // Mark geometry as needing update
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.alpha.needsUpdate = true
    
    // 减少日志频率，只在轨迹点数量是10的倍数时记录
    if (trailPoints.value.length % 10 === 0) {
      Logger.log('DRIFT_TRAIL_RENDERER', `Updated geometry with ${trailPoints.value.length} points`)
    }
  } catch (error) {
    Logger.error('DRIFT_TRAIL_RENDERER', 'Error updating trail geometry:', error)
  }
}

// Render loop
const { onLoop } = useRenderLoop()

onLoop(() => {
  if (!isTrailVisible.value) return
  
  let currentPos: Vector3 | null = null
  
  // Try multiple data sources for position
  // 1. Global drift state
  if (driftState.isAvailable && driftState.position) {
    currentPos = new Vector3(
      driftState.position.x,
      driftState.position.y,
      driftState.position.z
    )
  }
  // 2. Window global state
  else if (typeof window !== 'undefined') {
    const windowState = (window as any).__CURRENT_DRIFT_STATE__
    if (windowState && windowState.position) {
      currentPos = new Vector3(
        windowState.position.x,
        windowState.position.y,
        windowState.position.z
      )
    }
  }
  // 3. Injected galaxy drift data
  else if (galaxyDriftData?.position?.value) {
    const position = galaxyDriftData.position.value
    if (position.x !== undefined && position.y !== undefined && position.z !== undefined) {
      currentPos = new Vector3(
        parseFloat(position.x),
        parseFloat(position.y),
        parseFloat(position.z)
      )
    }
  }
  
  if (currentPos) {
    // Add point to trail if it's different enough from the last one
    const lastPoint = trailPoints.value[trailPoints.value.length - 1]
    const minDistance = 0.0001 // Reduced threshold for better trail capture
    
    if (!lastPoint || currentPos.distanceTo(lastPoint) > minDistance) {
      addTrailPoint(currentPos)
      
      // Debug log occasionally
      if (trailPoints.value.length % 25 === 0) { // 每25个点记录一次，而不是每10个
        Logger.log('DRIFT_TRAIL_RENDERER', `Trail points: ${trailPoints.value.length}, Current pos: (${currentPos.x.toFixed(6)}, ${currentPos.y.toFixed(6)}, ${currentPos.z.toFixed(6)})`)
      }
    }
  }
})

onUnmounted(() => {
  clearTrail()
  cleanup() // 清理全局状态管理器的定时器
  Logger.log('DRIFT_TRAIL_RENDERER', 'Trail renderer component unmounted')
})
</script>

<template>
  <!-- 粒子轨迹系统 -->
  <TresGroup v-if="isTrailVisible && trailPoints.length > 0">
    <!-- 使用简单的球体作为轨迹点，更容易看到 -->
    <TresMesh 
      v-for="(point, index) in trailPoints" 
      :key="index"
      :position="[point.x, point.y, point.z]"
    >
      <TresSphereGeometry :args="[0.003 * trailOpacities[index], 4, 4]" />
      <TresMeshBasicMaterial 
        :color="getTrailColor(index, trailPoints.length)"
        :transparent="true"
        :opacity="trailOpacities[index] * 0.8"
      />
    </TresMesh>
    
    <!-- 连接线 -->
    <TresLine v-if="trailPoints.length > 1">
      <TresBufferGeometry>
        <TresBufferAttribute
          :count="trailPoints.length"
          :array="getPositionsArray()"
          :item-size="3"
          attach="attributes-position"
        />
      </TresBufferGeometry>
      <TresLineBasicMaterial 
        color="#00ccff" 
        :transparent="true" 
        :opacity="0.3"
      />
    </TresLine>
  </TresGroup>
  
  <!-- 当前位置高亮标记 -->
  <TresMesh v-if="isTrailVisible && trailPoints.length > 0" :position="getCurrentPosition">
    <TresSphereGeometry :args="[0.008, 8, 8]" />
    <TresMeshBasicMaterial color="#ffff00" />
  </TresMesh>
</template>
