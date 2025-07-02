<script setup lang="ts">
import { onMounted } from 'vue'
import { useTres, useLoop } from '@tresjs/core'
import { Logger } from '../../../utils/logger'

// Access to Three.js renderer for performance monitoring
const { renderer } = useTres()
let frameCount = 0

// Expose renderer stats to global window for PerformanceMonitor
const { onBeforeRender } = useLoop()

const collectStats = () => {
  if (!renderer.value || typeof window === 'undefined') return
  
  try {
    const info = renderer.value.info
    frameCount++
    
    const stats = {
      render: {
        calls: info.render?.calls || 0,
        triangles: info.render?.triangles || 0, // 保持为 0，这对点云项目是正确的
        points: info.render?.points || 0, // 这是重点数据 - 星系中的点
        lines: info.render?.lines || 0, // 可能的轨道线或连接线
        frame: info.render?.frame || frameCount,
      },
      memory: {
        geometries: info.memory?.geometries || 0,
        textures: info.memory?.textures || 0, // 保持为 0，使用程序化着色
      },
      programs: info.programs?.length || 0,
      timestamp: performance.now(),
      frameCount: frameCount,
      // 项目类型标识
      projectType: 'point-cloud-galaxy'
    }
    
    ;(window as any).__THREE_RENDERER_INFO__ = stats
    
    // 调试日志 - 专注于点云和线条数据
    if (frameCount % 120 === 0) { // 每120帧输出一次 (约2秒)
      Logger.log('PETERSEN_GALAXY_RENDER_STATS', 'Point cloud render stats updated', {
        drawCalls: stats.render.calls,
        points: stats.render.points,
        lines: stats.render.lines,
        geometries: stats.memory.geometries,
        programs: stats.programs,
        renderType: 'Point Cloud Galaxy (No triangles/textures used)',
        frame: frameCount
      })
    }
    
  } catch (error) {
    Logger.error('RENDERER_STATS_COLLECTOR', 'Error collecting stats', error)
  }
}

onMounted(() => {
  Logger.log('RENDERER_STATS_COLLECTOR', 'Point cloud renderer stats collector initialized')
  
  // 在渲染前收集统计信息
  onBeforeRender(collectStats)
})
</script>

<template>
  <!-- This component is invisible and only collects renderer stats -->
</template>
