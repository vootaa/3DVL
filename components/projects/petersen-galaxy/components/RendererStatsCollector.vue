<script setup lang="ts">
import { useTres, useLoop } from '@tresjs/core'
import { Logger } from '../../../utils/logger'

// Access to Three.js renderer for performance monitoring
const { renderer } = useTres()

// Expose renderer stats to global window for PerformanceMonitor
useLoop().onBeforeRender(() => {
  if (renderer.value?.info && typeof window !== 'undefined') {
    ;(window as any).__THREE_RENDERER_INFO__ = {
      render: {
        calls: renderer.value.info.render.calls,
        triangles: renderer.value.info.render.triangles,
        points: renderer.value.info.render.points,
        lines: renderer.value.info.render.lines,
        frame: renderer.value.info.render.frame,
      },
      memory: {
        geometries: renderer.value.info.memory.geometries,
        textures: renderer.value.info.memory.textures,
      },
      programs: renderer.value.info.programs?.length || 0,
    }
  }
})

// Log when the stats collector is initialized
Logger.log('RENDERER_STATS', 'Renderer stats collector initialized')
</script>

<template>
  <!-- This component is invisible and only collects renderer stats -->
</template>
