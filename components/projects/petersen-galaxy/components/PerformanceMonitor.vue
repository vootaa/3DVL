<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Logger } from '../../../utils/logger'
import { LoggingConfig } from '../configs/logging-config'

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

const showPerformancePanel = ref(false)
let updateInterval: NodeJS.Timeout | null = null
let frameCount = 0
let lastFrameTime = performance.now()
let fpsUpdateTime = performance.now()

// Performance status colors
const performanceStatusColor = computed(() => {
  const fps = performanceData.value.fps
  if (fps >= 55) return '#00ff00' // Excellent
  if (fps >= 45) return '#88ff00' // Good
  if (fps >= 30) return '#ffaa00' // Fair
  if (fps >= 20) return '#ff6600' // Poor
  return '#ff0000' // Critical
})

const memoryStatusColor = computed(() => {
  const usage = performanceData.value.memory.used / performanceData.value.memory.total
  if (usage < 0.5) return '#00ff00' // Good
  if (usage < 0.7) return '#ffaa00' // Warning
  if (usage < 0.9) return '#ff6600' // High
  return '#ff0000' // Critical
})

// Formatted display values
const formattedMemory = computed(() => {
  const used = (performanceData.value.memory.used / 1024 / 1024).toFixed(1)
  const total = (performanceData.value.memory.total / 1024 / 1024).toFixed(1)
  return `${used} / ${total} MB`
})

const formattedTriangles = computed(() => {
  const triangles = performanceData.value.triangles
  if (triangles > 1000000) return `${(triangles / 1000000).toFixed(2)}M`
  if (triangles > 1000) return `${(triangles / 1000).toFixed(1)}K`
  return triangles.toString()
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

// Toggle performance panel
const togglePerformancePanel = () => {
  showPerformancePanel.value = !showPerformancePanel.value
  Logger.log('PERFORMANCE_MONITOR', `Performance panel ${showPerformancePanel.value ? 'opened' : 'closed'}`)
}

// Update FPS calculation
const updateFPS = () => {
  const now = performance.now()
  frameCount++
  
  // Update FPS every second
  if (now - fpsUpdateTime >= 1000) {
    performanceData.value.fps = Math.round((frameCount * 1000) / (now - fpsUpdateTime))
    frameCount = 0
    fpsUpdateTime = now
  }
  
  // Frame time calculation
  performanceData.value.frameTime = now - lastFrameTime
  lastFrameTime = now
  
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
  
  // Update performance data every 2 seconds
  updateInterval = setInterval(updatePerformanceData, 2000)
  updatePerformanceData() // Initial update
  
  Logger.log('PERFORMANCE_MONITOR', 'Performance monitor component mounted')
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  
  Logger.log('PERFORMANCE_MONITOR', 'Performance monitor component unmounted')
})
</script>

<template>
  <div class="performance-monitor">
    <!-- Toggle Button -->
    <button 
      class="performance-toggle" 
      @click="togglePerformancePanel"
      :class="{ active: showPerformancePanel }"
    >
      ⚡ PERFORMANCE
    </button>

    <!-- Performance Panel -->
    <div v-if="showPerformancePanel" class="performance-panel">
      <div class="performance-header">
        <h3>⚡ Performance Monitor</h3>
        <button class="close-btn" @click="showPerformancePanel = false">×</button>
      </div>

      <div class="performance-content">
        <!-- FPS & Frame Time -->
        <div class="performance-section">
          <div class="section-title">Rendering Performance</div>
          <div class="status-item">
            <span class="label">FPS:</span>
            <span class="value" :style="{ color: performanceStatusColor }">
              {{ performanceData.fps }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">Frame Time:</span>
            <span class="value">{{ performanceData.frameTime.toFixed(2) }}ms</span>
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
            <span class="label">JS Heap:</span>
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

        <!-- Rendering Statistics -->
        <div class="performance-section">
          <div class="section-title">Render Statistics</div>
          <div class="status-item">
            <span class="label">Draw Calls:</span>
            <span class="value">{{ performanceData.renderCalls }}</span>
          </div>
          <div class="status-item">
            <span class="label">Triangles:</span>
            <span class="value">{{ formattedTriangles }}</span>
          </div>
          <div class="status-item">
            <span class="label">Textures:</span>
            <span class="value">{{ performanceData.textures }}</span>
          </div>
          <div class="status-item">
            <span class="label">Geometries:</span>
            <span class="value">{{ performanceData.geometries }}</span>
          </div>
        </div>

        <!-- Performance Tips -->
        <div class="performance-section">
          <div class="section-title">Performance Tips</div>
          <div class="performance-tips">
            <div class="tip-item" :class="{ active: performanceData.fps < 30 }">
              <span class="tip-icon">⚠️</span>
              <span class="tip-text">FPS below 30: Consider reducing visual effects</span>
            </div>
            <div class="tip-item" :class="{ active: (performanceData.memory.used / performanceData.memory.total) > 0.8 }">
              <span class="tip-icon">💾</span>
              <span class="tip-text">High memory usage: Monitor for memory leaks</span>
            </div>
            <div class="tip-item" :class="{ active: performanceData.renderCalls > 100 }">
              <span class="tip-icon">🎨</span>
              <span class="tip-text">Many draw calls: Consider geometry merging</span>
            </div>
          </div>
        </div>

        <div class="performance-footer">
          <span class="timestamp">Last Update: {{ performanceData.lastUpdate }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.performance-monitor {
  position: fixed;
  top: 80px; /* Below the drift monitor */
  right: 20px;
  z-index: 999;
  font-family: 'Kode Mono', monospace;
}

.performance-toggle {
  background: rgba(0, 12, 20, 0.9);
  border: 2px solid #ffaa00;
  color: #ffaa00;
  padding: 8px 16px;
  border-radius: 6px;
  font-family: inherit;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.performance-toggle:hover {
  background: rgba(255, 170, 0, 0.1);
  box-shadow: 0 0 10px rgba(255, 170, 0, 0.3);
}

.performance-toggle.active {
  background: rgba(255, 170, 0, 0.2);
  box-shadow: 0 0 15px rgba(255, 170, 0, 0.5);
}

.performance-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 360px;
  max-height: 70vh;
  background: rgba(0, 8, 16, 0.97);
  border: 2px solid rgba(255, 170, 0, 0.6);
  border-radius: 10px;
  overflow-y: auto;
  animation: slideDown 0.3s ease;
  box-shadow: 0 8px 32px rgba(255, 170, 0, 0.15);
  backdrop-filter: blur(8px);
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
  border-bottom: 1px solid rgba(255, 170, 0, 0.4);
  background: linear-gradient(135deg, rgba(255, 170, 0, 0.15), rgba(255, 140, 0, 0.1));
}

.performance-header h3 {
  margin: 0;
  color: #ffdd00;
  font-size: 15px;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(255, 170, 0, 0.3);
}

.close-btn {
  background: none;
  border: none;
  color: #ffaa00;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.performance-content {
  padding: 18px;
}

.performance-section {
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 170, 0, 0.25);
}

.performance-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  color: #ffaa00;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(255, 170, 0, 0.4);
  border-left: 3px solid #ffaa00;
  padding-left: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  padding: 4px 0;
  transition: all 0.2s ease;
}

.status-item:hover {
  background: rgba(255, 170, 0, 0.05);
  border-radius: 4px;
  padding: 4px 8px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #ffcc88;
  font-weight: 600;
  flex-shrink: 0;
  margin-right: 16px;
  font-size: 12px;
}

.value {
  color: #ffffff;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', monospace;
  text-align: right;
  flex-grow: 1;
  word-break: break-all;
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.1);
}

/* Performance Tips */
.performance-tips {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tip-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 11px;
  opacity: 0.5;
  background: rgba(255, 170, 0, 0.05);
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.tip-item.active {
  opacity: 1;
  background: rgba(255, 170, 0, 0.15);
  border-color: rgba(255, 170, 0, 0.3);
  animation: tipPulse 2s infinite;
}

@keyframes tipPulse {
  0%, 100% { 
    box-shadow: 0 0 0 rgba(255, 170, 0, 0.3); 
  }
  50% { 
    box-shadow: 0 0 10px rgba(255, 170, 0, 0.3); 
  }
}

.tip-icon {
  margin-right: 8px;
  font-size: 12px;
}

.tip-text {
  color: #ffdd88;
  font-size: 11px;
}

.performance-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 170, 0, 0.3);
  text-align: center;
}

.timestamp {
  color: #cc9966;
  font-size: 11px;
  font-style: italic;
  opacity: 0.8;
  background: rgba(204, 153, 102, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

/* Scrollbar styling */
.performance-panel::-webkit-scrollbar {
  width: 6px;
}

.performance-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.performance-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 170, 0, 0.5);
  border-radius: 3px;
}

.performance-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 170, 0, 0.7);
}
</style>
