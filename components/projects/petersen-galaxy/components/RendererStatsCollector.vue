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
        triangles: info.render?.triangles || 0,
        points: info.render?.points || 0,
        lines: info.render?.lines || 0,
        frame: info.render?.frame || frameCount,
      },
      memory: {
        geometries: info.memory?.geometries || 0,
        textures: info.memory?.textures || 0,
      },
      programs: info.programs?.length || 0,
      timestamp: performance.now(),
      frameCount: frameCount,
      // Project type identifier
      projectType: 'point-cloud-galaxy'
    }
    
    ;(window as any).__THREE_RENDERER_INFO__ = stats
    
    // Debug logging - focus on point cloud and line data
    if (frameCount % 120 === 0) { // Output every 120 frames (~2 seconds)
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
  
  // Collect statistics before rendering
  onBeforeRender(collectStats)
})
</script>

<template>
  <!-- This component is invisible and only collects renderer stats -->
</template>
