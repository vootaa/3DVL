<script setup lang="ts">
import { ref, inject, computed, onMounted, onUnmounted } from 'vue'
import { Logger } from '../../../utils/logger'
import { LoggingConfig } from '../configs/logging-config'
import DriftDebugger from '../utils/drift-debug'

// Type definitions for injected data
interface GalaxyDriftData {
  position: { value: { x: string; y: string; z: string } }
  velocity: { value: string }
  distance: { value: string }
  duration: { value: number }
}

interface GalaxyCenter {
  value: { x: number; y: number; z: number }
}

// Inject galaxy drift data with proper typing
const galaxyDriftData = inject<GalaxyDriftData>('galaxyDriftData', null as any)
const galaxyCenter = inject<GalaxyCenter>('galaxyCenter', null as any)

// Debug state
const debugInfo = ref({
  isDrifting: false,
  velocityMagnitude: 0,
  positionChange: 0,
  diagnosis: 'INITIALIZING',
  statistics: {
    averageVelocity: 0,
    maxVelocity: 0,
    totalDistance: 0,
    duration: 0,
    samplesCollected: 0,
    currentPosition: { x: 0, y: 0, z: 0 }
  },
  injectionStatus: 'CHECKING',
  lastUpdate: ''
})

const showDebugPanel = ref(false)
let updateInterval: NodeJS.Timeout | null = null

// Toggle debug panel visibility
const toggleDebugPanel = () => {
  showDebugPanel.value = !showDebugPanel.value
  Logger.log('DRIFT_MONITOR', `Debug panel ${showDebugPanel.value ? 'opened' : 'closed'}`)
}

// Update debug information
const updateDebugInfo = () => {
  if (!galaxyCenter?.value || !galaxyDriftData) {
    debugInfo.value.diagnosis = 'INJECTION_FAILED'
    debugInfo.value.injectionStatus = 'FAILED'
    return
  }

  try {
    // Create a mock drift state for analysis
    const mockDriftState = {
      currentPosition: galaxyCenter.value,
      velocity: { length: () => parseFloat(galaxyDriftData.velocity.value) },
      totalDistance: parseFloat(galaxyDriftData.distance.value) / 10000000000000, // Convert back from nGU
      driftTime: galaxyDriftData.duration.value
    }

    const driftDebugger = DriftDebugger.getInstance()
    const activity = driftDebugger.checkDriftActivity(mockDriftState as any)
    const stats = driftDebugger.getDriftStatistics(mockDriftState as any)

    debugInfo.value = {
      isDrifting: activity.isDrifting,
      velocityMagnitude: activity.velocityMagnitude,
      positionChange: activity.positionChange,
      diagnosis: activity.diagnosis,
      statistics: stats,
      injectionStatus: 'SUCCESS',
      lastUpdate: new Date().toLocaleTimeString()
    }

    // Use Logger.throttle for debug panel updates
    Logger.throttle('DRIFT_MONITOR_UPDATE', 'Debug panel updated', {
      isDrifting: activity.isDrifting,
      diagnosis: activity.diagnosis,
      injectionStatus: 'SUCCESS'
    }, LoggingConfig.DRIFT_MONITOR_UPDATE) // Use centralized config
  } catch (error) {
    Logger.error('DRIFT_MONITOR', 'Error updating debug info', error)
    debugInfo.value.diagnosis = 'UPDATE_ERROR'
    debugInfo.value.injectionStatus = 'ERROR'
  }
}

// Computed values for display
const driftStatusColor = computed(() => {
  switch (debugInfo.value.diagnosis) {
    case 'ACTIVE_DRIFT': return '#00ff00'
    case 'NO_VELOCITY': return '#ff6600'
    case 'NO_MOVEMENT': return '#ff0000'
    case 'INJECTION_FAILED': return '#990000'
    default: return '#ffff00'
  }
})

const injectionStatusColor = computed(() => {
  return debugInfo.value.injectionStatus === 'SUCCESS' ? '#00ff00' : '#ff0000'
})

onMounted(() => {
  // Update debug info every 10 seconds instead of 5 to reduce frequency
  updateInterval = setInterval(updateDebugInfo, 10000)
  updateDebugInfo() // Initial update
  
  Logger.log('DRIFT_MONITOR', 'Drift monitor component mounted')
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  
  Logger.log('DRIFT_MONITOR', 'Drift monitor component unmounted')
})
</script>

<template>
  <div class="drift-monitor">
    <!-- Toggle Button -->
    <button 
      class="debug-toggle" 
      @click="toggleDebugPanel"
      :class="{ active: showDebugPanel }"
    >
      🔍 DRIFT DEBUG
    </button>

    <!-- Debug Panel -->
    <div v-if="showDebugPanel" class="debug-panel">
      <div class="debug-header">
        <h3>🌌 Galaxy Drift Monitor</h3>
        <button class="close-btn" @click="showDebugPanel = false">×</button>
      </div>

      <div class="debug-content">
        <!-- Drift Status -->
        <div class="debug-section">
          <div class="section-title">Drift Status</div>
          <div class="status-item">
            <span class="label">Status:</span>
            <span class="value" :style="{ color: driftStatusColor }">
              {{ debugInfo.diagnosis }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">Is Drifting:</span>
            <span class="value" :style="{ color: debugInfo.isDrifting ? '#00ff00' : '#ff0000' }">
              {{ debugInfo.isDrifting ? 'YES' : 'NO' }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">Injection:</span>
            <span class="value" :style="{ color: injectionStatusColor }">
              {{ debugInfo.injectionStatus }}
            </span>
          </div>
        </div>

        <!-- Current Metrics -->
        <div class="debug-section">
          <div class="section-title">Current Metrics</div>
          <div class="status-item">
            <span class="label">Velocity:</span>
            <span class="value">{{ debugInfo.velocityMagnitude.toFixed(8) }}</span>
          </div>
          <div class="status-item">
            <span class="label">Position Change:</span>
            <span class="value">{{ debugInfo.positionChange.toFixed(8) }}</span>
          </div>
          <div class="status-item">
            <span class="label">Position:</span>
            <span class="value position-value">
              ({{ debugInfo.statistics.currentPosition.x.toFixed(3) }},
              {{ debugInfo.statistics.currentPosition.y.toFixed(3) }},
              {{ debugInfo.statistics.currentPosition.z.toFixed(3) }})
            </span>
          </div>
        </div>

        <!-- Statistics -->
        <div class="debug-section">
          <div class="section-title">Statistics</div>
          <div class="status-item">
            <span class="label">Avg Velocity:</span>
            <span class="value">{{ debugInfo.statistics.averageVelocity.toFixed(8) }}</span>
          </div>
          <div class="status-item">
            <span class="label">Max Velocity:</span>
            <span class="value">{{ debugInfo.statistics.maxVelocity.toFixed(8) }}</span>
          </div>
          <div class="status-item">
            <span class="label">Total Distance:</span>
            <span class="value">{{ debugInfo.statistics.totalDistance.toFixed(10) }}</span>
          </div>
          <div class="status-item">
            <span class="label">Duration:</span>
            <span class="value">{{ debugInfo.statistics.duration.toFixed(2) }}s</span>
          </div>
          <div class="status-item">
            <span class="label">Samples:</span>
            <span class="value">{{ debugInfo.statistics.samplesCollected }}</span>
          </div>
        </div>

        <!-- Raw Data (if available) -->
        <div class="debug-section" v-if="galaxyDriftData">
          <div class="section-title">Raw Drift Data</div>
          <div class="status-item">
            <span class="label">Position (mGU):</span>
            <span class="value position-value">
              ({{ galaxyDriftData.position.value.x }},
              {{ galaxyDriftData.position.value.y }},
              {{ galaxyDriftData.position.value.z }})
            </span>
          </div>
          <div class="status-item">
            <span class="label">Velocity (nGU/ms):</span>
            <span class="value">{{ galaxyDriftData.velocity.value }}</span>
          </div>
          <div class="status-item">
            <span class="label">Distance (nGU):</span>
            <span class="value">{{ galaxyDriftData.distance.value }}</span>
          </div>
        </div>

        <div class="debug-footer">
          <span class="timestamp">Last Update: {{ debugInfo.lastUpdate }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.drift-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  font-family: 'Kode Mono', monospace;
}

.debug-toggle {
  background: rgba(0, 12, 20, 0.9);
  border: 2px solid #00ccff;
  color: #00ccff;
  padding: 8px 16px;
  border-radius: 6px;
  font-family: inherit;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.debug-toggle:hover {
  background: rgba(0, 204, 255, 0.1);
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
}

.debug-toggle.active {
  background: rgba(0, 204, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 204, 255, 0.5);
}

.debug-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 400px;
  max-height: 80vh;
  background: rgba(0, 12, 20, 0.95);
  border: 2px solid #00ccff;
  border-radius: 8px;
  overflow-y: auto;
  animation: slideDown 0.3s ease;
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

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.3);
  background: rgba(0, 204, 255, 0.1);
}

.debug-header h3 {
  margin: 0;
  color: #00ccff;
  font-size: 14px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #00ccff;
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

.debug-content {
  padding: 16px;
}

.debug-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.2);
}

.debug-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  color: #ffaa00;
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 11px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #99ccff;
  font-weight: 500;
  flex-shrink: 0;
  margin-right: 12px;
}

.value {
  color: #ffffff;
  font-family: 'Courier New', monospace;
  text-align: right;
  flex-grow: 1;
  word-break: break-all;
}

.position-value {
  font-size: 10px;
  line-height: 1.2;
}

.debug-footer {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 204, 255, 0.2);
}

.timestamp {
  color: #666699;
  font-size: 10px;
  font-style: italic;
}

/* Scrollbar styling */
.debug-panel::-webkit-scrollbar {
  width: 6px;
}

.debug-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.debug-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 204, 255, 0.5);
  border-radius: 3px;
}

.debug-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 204, 255, 0.7);
}
</style>
