<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Logger } from '../../../../utils/logger'
import { LoggingConfig } from '../../configs/logging-config'

// Responsive state
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// Check if should use compact mode based on screen size
const isCompactMode = computed(() => {
  return windowWidth.value < 768 || windowHeight.value < 600
})

// Check for ultra-compact mode (very small screens)
const isUltraCompactMode = computed(() => {
  return windowWidth.value < 480 || windowHeight.value < 400
})

// Handle window resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

// Performance metrics
const performanceData = ref({
  fps: 0,
  frameTime: 0,
  memory: {
    used: 0,
    total: 0,
    limit: 0
  },
  renderCalls: 0,
  triangles: 0,
  points: 0,
  lines: 0,
  textures: 0,
  geometries: 0,
  lastUpdate: ''
})

let updateInterval: NodeJS.Timeout | null = null
let frameCount = 0
let lastFrameTime = performance.now()
let fpsUpdateTime = performance.now()

// Frame time smoothing
const frameTimeHistory: number[] = []
const FRAME_TIME_HISTORY_SIZE = 30
let frameTimeSum = 0

// Performance status colors
const performanceStatusColor = computed(() => {
  const fps = performanceData.value.fps
  if (fps >= 55) return '#00ccff' // Excellent
  if (fps >= 45) return '#66ddff' // Good
  if (fps >= 30) return '#99bbff' // Fair
  if (fps >= 20) return '#6699ff' // Poor
  return '#4477ff' // Critical
})

const memoryStatusColor = computed(() => {
  const usage = performanceData.value.memory.used / performanceData.value.memory.total
  if (usage < 0.5) return '#00ccff' // Good
  if (usage < 0.7) return '#66ddff' // Warning
  if (usage < 0.9) return '#99bbff' // High
  return '#4477ff' // Critical
})

// Formatted display values
const formattedMemory = computed(() => {
  const used = (performanceData.value.memory.used / 1024 / 1024).toFixed(1)
  const total = (performanceData.value.memory.total / 1024 / 1024).toFixed(1)
  return `${used} / ${total} MB`
})

const formattedTriangles = computed(() => {
  const triangles = performanceData.value.triangles
  if (triangles === 0) return 'N/A (Point Cloud)'
  if (triangles > 1000000) return `${(triangles / 1000000).toFixed(2)}M`
  if (triangles > 1000) return `${(triangles / 1000).toFixed(1)}K`
  return triangles.toString()
})

const formattedTextures = computed(() => {
  const textures = performanceData.value.textures
  if (textures === 0) return 'N/A (Procedural)'
  return textures.toString()
})

const formattedPoints = computed(() => {
  const points = performanceData.value.points || 0
  if (points === 0) return '0'
  if (points > 1000000) return `${(points / 1000000).toFixed(2)}M`
  if (points > 1000) return `${(points / 1000).toFixed(1)}K`
  return points.toString()
})

const formattedLines = computed(() => {
  const lines = performanceData.value.lines || 0
  if (lines === 0) return '0'
  if (lines > 1000000) return `${(lines / 1000000).toFixed(2)}M`
  if (lines > 1000) return `${(lines / 1000).toFixed(1)}K`
  return lines.toString()
})

// Formatted frame time with stability
const formattedFrameTime = computed(() => {
  const frameTime = performanceData.value.frameTime
  if (frameTime < 0.1) return '0.0ms'
  return frameTime.toFixed(1) + 'ms'
})

// Performance categories
const performanceStatus = computed(() => {
  const fps = performanceData.value.fps
  if (fps >= 55) return 'EXCELLENT'
  if (fps >= 45) return 'GOOD'
  if (fps >= 30) return 'FAIR'
  if (fps >= 20) return 'POOR'
  return 'CRITICAL'
})

// Compact display modes
const displayMode = computed(() => {
  if (isUltraCompactMode.value) return 'ultra'
  if (isCompactMode.value) return 'compact'
  return 'full'
})

// Update FPS calculation
const updateFPS = () => {
  const now = performance.now()
  frameCount++

  // Calculate current frame time
  const currentFrameTime = now - lastFrameTime
  lastFrameTime = now

  // Add to frame time history for smoothing
  frameTimeHistory.push(currentFrameTime)
  frameTimeSum += currentFrameTime

  // Keep history size limited
  if (frameTimeHistory.length > FRAME_TIME_HISTORY_SIZE) {
    const removed = frameTimeHistory.shift()!
    frameTimeSum -= removed
  }

  // Update smoothed frame time (only update every few frames to reduce flicker)
  if (frameCount % 10 === 0) { // Update every 10 frames, approximately every 167ms
    const smoothedFrameTime = frameTimeSum / frameTimeHistory.length
    performanceData.value.frameTime = smoothedFrameTime
  }

  // Update FPS every second
  if (now - fpsUpdateTime >= 1000) {
    performanceData.value.fps = Math.round((frameCount * 1000) / (now - fpsUpdateTime))
    frameCount = 0
    fpsUpdateTime = now
  }

  requestAnimationFrame(updateFPS)
}

// Update performance metrics
const updatePerformanceData = () => {
  try {
    // Memory information (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory
      performanceData.value.memory = {
        used: memory.usedJSHeapSize || 0,
        total: memory.totalJSHeapSize || 0,
        limit: memory.jsHeapSizeLimit || 0
      }
    }

    // Try to get renderer info from Three.js if available
    if (typeof window !== 'undefined' && (window as any).__THREE_RENDERER_INFO__) {
      const rendererInfo = (window as any).__THREE_RENDERER_INFO__
      performanceData.value.renderCalls = rendererInfo.render?.calls || 0
      performanceData.value.triangles = rendererInfo.render?.triangles || 0
      performanceData.value.points = rendererInfo.render?.points || 0
      performanceData.value.lines = rendererInfo.render?.lines || 0
      performanceData.value.textures = rendererInfo.memory?.textures || 0
      performanceData.value.geometries = rendererInfo.memory?.geometries || 0
    }

    performanceData.value.lastUpdate = new Date().toLocaleTimeString()

    Logger.throttle('PERFORMANCE_MONITOR_UPDATE', 'Performance metrics updated', {
      fps: performanceData.value.fps,
      frameTime: performanceData.value.frameTime.toFixed(2),
      memory: formattedMemory.value,
      status: performanceStatus.value
    }, LoggingConfig.DRIFT_MONITOR_UPDATE)

  } catch (error) {
    Logger.error('PERFORMANCE_MONITOR', 'Error updating performance data', error)
  }
}

onMounted(() => {
  // Start FPS monitoring
  updateFPS()

  // Update performance data every 3 seconds (reduced frequency to minimize flicker)
  updateInterval = setInterval(updatePerformanceData, 3000)
  updatePerformanceData() // Initial update

  Logger.log('PERFORMANCE_MONITOR', 'Performance monitor component mounted')
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }

  Logger.log('PERFORMANCE_MONITOR', 'Performance monitor component unmounted')
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="performance-panel unified-panel" :class="{
    'compact': isCompactMode,
    'ultra-compact': isUltraCompactMode
  }">
    <div class="performance-header">
      <h3>
        <i class="i-carbon-flash header-icon" aria-hidden="true" />
        <span v-if="displayMode === 'full'">Performance Monitor</span>
        <span v-else-if="displayMode === 'compact'">Performance</span>
        <span v-else>Perf</span>
      </h3>
      <slot name="close"></slot>
    </div>
    <div class="performance-content">
      <!-- Ultra Compact Mode - Only essential metrics -->
      <template v-if="displayMode === 'ultra'">
        <div class="ultra-compact-grid">
          <div class="metric-card fps">
            <div class="metric-label">FPS</div>
            <div class="metric-value" :style="{ color: performanceStatusColor }">
              {{ performanceData.fps }}
            </div>
          </div>
          <div class="metric-card memory">
            <div class="metric-label">MEM</div>
            <div class="metric-value" :style="{ color: memoryStatusColor }">
              {{ ((performanceData.memory.used / performanceData.memory.total) * 100).toFixed(0) }}%
            </div>
          </div>
          <div class="metric-card frame-time">
            <div class="metric-label">MS</div>
            <div class="metric-value">
              {{ formattedFrameTime.replace('ms', '') }}
            </div>
          </div>
        </div>
      </template>

      <!-- Compact Mode - Core metrics only -->
      <template v-else-if="displayMode === 'compact'">
        <div class="performance-section">
          <div class="status-item highlight">
            <span class="label">FPS:</span>
            <span class="value" :style="{ color: performanceStatusColor }">
              {{ performanceData.fps.toFixed(0) }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">Frame Time:</span>
            <span class="value">{{ formattedFrameTime }}</span>
          </div>
          <div class="status-item">
            <span class="label">Status:</span>
            <span class="value" :style="{ color: performanceStatusColor }">
              {{ performanceStatus }}
            </span>
          </div>
        </div>

        <div class="performance-section">
          <div class="section-title">Memory</div>
          <div class="status-item">
            <span class="label">Usage:</span>
            <span class="value" :style="{ color: memoryStatusColor }">
              {{ ((performanceData.memory.used / performanceData.memory.total) * 100).toFixed(1) }}%
            </span>
          </div>
        </div>
      </template>

      <!-- Full Mode - All metrics -->
      <template v-else>
        <!-- Core metrics -->
        <div class="performance-section">
          <div class="section-title">Performance Metrics</div>
          <div class="status-item highlight">
            <span class="label">FPS:</span>
            <span class="value" :style="{ color: performanceStatusColor }">
              {{ performanceData.fps.toFixed(0) }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">Frame Time:</span>
            <span class="value">{{ formattedFrameTime }}</span>
          </div>
          <div class="status-item">
            <span class="label">Status:</span>
            <span class="value" :style="{ color: performanceStatusColor }">
              {{ performanceStatus }}
            </span>
          </div>
        </div>

        <!-- Memory Usage -->
        <div class="performance-section">
          <div class="section-title">Memory Usage</div>
          <div class="status-item">
            <span class="label">Memory:</span>
            <span class="value" :style="{ color: memoryStatusColor }">
              {{ formattedMemory }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">Usage:</span>
            <span class="value" :style="{ color: memoryStatusColor }">
              {{ ((performanceData.memory.used / performanceData.memory.total) * 100).toFixed(1) }}%
            </span>
          </div>
        </div>

        <!-- Render Statistics -->
        <div class="performance-section">
          <div class="section-title">Render Statistics</div>
          <div class="status-item secondary">
            <span class="label">Render Calls:</span>
            <span class="value">{{ performanceData.renderCalls }}</span>
          </div>

          <div class="status-item highlight" v-if="performanceData.points > 0">
            <span class="label">Points:</span>
            <span class="value">{{ formattedPoints }}</span>
          </div>

          <div class="status-item" v-if="performanceData.lines > 0">
            <span class="label">Lines:</span>
            <span class="value">{{ formattedLines }}</span>
          </div>

          <div class="status-item">
            <span class="label">Geometries:</span>
            <span class="value">{{ performanceData.geometries }}</span>
          </div>

          <div class="status-item secondary">
            <span class="label">Triangles:</span>
            <span class="value">{{ formattedTriangles }}</span>
          </div>
          <div class="status-item secondary">
            <span class="label">Textures:</span>
            <span class="value">{{ formattedTextures }}</span>
          </div>
        </div>

        <!-- Performance Tips -->
        <div class="performance-tips">
          <div class="section-title">Performance Tips</div>
          <div class="tip-item" :class="{ active: performanceData.fps < 30 }">
            <i class="i-carbon-idea tip-icon" aria-hidden="true" />
            <span class="tip-text">Reduce particle count if FPS drops below 30</span>
          </div>
          <div class="tip-item" :class="{ active: (performanceData.memory.used / performanceData.memory.total) > 0.8 }">
            <i class="i-carbon-data-table tip-icon" aria-hidden="true" />
            <span class="tip-text">High memory usage: Monitor for memory leaks</span>
          </div>
          <div class="tip-item" :class="{ active: performanceData.renderCalls > 100 }">
            <i class="i-carbon-paint-brush tip-icon" aria-hidden="true" />
            <span class="tip-text">Many draw calls: Consider geometry merging</span>
          </div>
        </div>

        <div class="performance-footer">
          <span class="timestamp">Last Update: {{ performanceData.lastUpdate }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="css" scoped>
.performance-panel.unified-panel {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 600px;
  max-height: 80vh;
  background: rgba(0, 8, 16, 0.97);
  border: 1px solid rgba(0, 204, 255, 0.6);
  border-radius: 10px;
  overflow-y: auto;
  animation: slideDown 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 204, 255, 0.15);
  backdrop-filter: blur(8px);
  z-index: 1001;
}

.performance-panel.compact {
  max-width: 320px;
  height: 240px;
  max-height: 70vh;
}

.performance-panel.ultra-compact {
  max-width: 240px;
  height: 150px;
  max-height: 50vh;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.performance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.4);
  background: linear-gradient(135deg, rgba(0, 204, 255, 0.15), rgba(0, 150, 200, 0.1));
}

.compact .performance-header {
  padding: 10px 14px;
}

.ultra-compact .performance-header {
  padding: 8px 12px;
}

.performance-header h3 {
  margin: 0;
  color: #66ddff;
  font-size: 15px;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(0, 204, 255, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.compact .performance-header h3 {
  font-size: 13px;
  gap: 6px;
}

.ultra-compact .performance-header h3 {
  font-size: 11px;
  gap: 4px;
}

.header-icon {
  font-size: 16px;
  color: #00ccff;
  filter: drop-shadow(0 0 4px rgba(0, 204, 255, 0.5));
}

.compact .header-icon {
  font-size: 14px;
}

.ultra-compact .header-icon {
  font-size: 12px;
}

.performance-content {
  padding: 18px;
}

.compact .performance-content {
  padding: 12px;
}

.ultra-compact .performance-content {
  padding: 8px;
}

/* Ultra Compact Grid Layout */
.ultra-compact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  width: 100%;
}

.metric-card {
  background: rgba(0, 204, 255, 0.08);
  border: 1px solid rgba(0, 204, 255, 0.2);
  border-radius: 6px;
  padding: 8px 4px;
  text-align: center;
  transition: all 0.3s ease;
}

.metric-card:hover {
  background: rgba(0, 204, 255, 0.15);
  border-color: rgba(0, 204, 255, 0.4);
}

.metric-label {
  font-size: 9px;
  color: #99ddff;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.metric-value {
  font-size: 11px;
  color: #ffffff;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-weight: 700;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.2);
}

/* Performance Section Styles */
.performance-section {
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.25);
}

.compact .performance-section {
  margin-bottom: 12px;
  padding-bottom: 10px;
}

.performance-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  color: #00ccff;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(0, 204, 255, 0.4);
  border-left: 3px solid #00ccff;
  padding-left: 8px;
}

.compact .section-title {
  font-size: 11px;
  margin-bottom: 8px;
  padding-left: 6px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  padding: 2px 0;
  transition: all 0.2s ease;
}

.compact .status-item {
  margin-bottom: 6px;
  font-size: 11px;
}

.status-item:hover {
  background: rgba(0, 204, 255, 0.05);
  border-radius: 4px;
  padding: 4px 8px;
}

.status-item.highlight {
  background: rgba(0, 255, 255, 0.1);
  border-left: 3px solid #00ccff;
  padding: 6px 12px;
  margin: 4px 0;
  border-radius: 4px;
  animation: highlightPulse 3s infinite;
}

@keyframes highlightPulse {

  0%,
  100% {
    background: rgba(0, 255, 255, 0.1);
    border-color: #00ccff;
  }

  50% {
    background: rgba(0, 255, 255, 0.15);
    border-color: #66ddff;
  }
}

.status-item.secondary {
  opacity: 0.6;
  font-size: 11px;
  padding: 2px 0;
}

.status-item.secondary .label {
  color: #99ccff;
  font-size: 10px;
}

.status-item.secondary .value {
  color: #99bbff;
  font-style: italic;
  font-size: 10px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #99ccff;
  font-weight: 600;
  flex-shrink: 0;
  margin-right: 16px;
  font-size: 12px;
}

.compact .label {
  font-size: 11px;
  margin-right: 12px;
}

.value {
  color: #ffffff;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  text-align: right;
  flex-grow: 1;
  word-break: break-all;
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.1);
}

.compact .value {
  font-size: 11px;
}

/* Performance Tips */
.performance-tips {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tip-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 11px;
  opacity: 0.5;
  background: rgba(0, 204, 255, 0.05);
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.tip-item.active {
  opacity: 1;
  background: rgba(0, 204, 255, 0.15);
  border-color: rgba(0, 204, 255, 0.3);
  animation: tipPulse 2s infinite;
}

@keyframes tipPulse {

  0%,
  100% {
    box-shadow: 0 0 0 rgba(0, 204, 255, 0.3);
  }

  50% {
    box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
  }
}

.tip-icon {
  margin-right: 8px;
  font-size: 12px;
  color: #66ddff;
}

.tip-text {
  color: #99ddff;
  font-size: 11px;
}

.performance-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 204, 255, 0.3);
  text-align: center;
}

.timestamp {
  color: #6699cc;
  font-size: 11px;
  font-style: italic;
  opacity: 0.8;
  background: rgba(204, 153, 102, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

/* Very small screens */
@media only screen and (max-width: 480px) {
  .performance-panel.compact {
    max-width: 280px;
    height: 250px;
  }

  .performance-panel.ultra-compact {
    max-width: 200px;
    height: 120px;
  }

  .ultra-compact-grid {
    gap: 4px;
  }

  .metric-card {
    padding: 6px 2px;
  }

  .metric-label {
    font-size: 8px;
  }

  .metric-value {
    font-size: 10px;
  }
}

/* Landscape phones */
@media only screen and (max-height: 480px) and (orientation: landscape) {
  .performance-panel.compact {
    height: 220px;
    max-height: 90vh;
  }

  .performance-panel.ultra-compact {
    height: 110px;
    max-height: 80vh;
  }
}

/* Scrollbar styling */
.performance-panel::-webkit-scrollbar {
  width: 6px;
}

.performance-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.performance-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 204, 255, 0.5);
  border-radius: 3px;
}

.performance-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 204, 255, 0.7);
}
</style>