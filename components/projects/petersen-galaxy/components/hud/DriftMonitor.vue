<script setup lang="ts">
import { ref, inject, computed, onMounted, onUnmounted, watch } from 'vue'
import { Logger } from '../../../../utils/logger'
import { LoggingConfig } from '../../configs/logging-config'
import { formatWithUnit} from '../../configs/astronomical-units'
import { useGalaxyDriftData } from '../../services/galaxy-drift-data'

// Use the unified drift data service
const driftDataService = useGalaxyDriftData()

// Type definitions for injected data (for backward compatibility)
interface GalaxyDriftData {
  position: { value: { x: string; y: string; z: string } }
  velocity: { value: string }
  distance: { value: string }
  duration: { value: number }
}

interface GalaxyCenter {
  value: { x: number; y: number; z: number }
}

// Inject data and pass to service
const galaxyDriftData = inject<GalaxyDriftData>('galaxyDriftData', null as any)
const galaxyCenter = inject<GalaxyCenter>('galaxyCenter', null as any)

// Inject data into service for unified access
if (galaxyDriftData || galaxyCenter) {
  driftDataService.injectData(galaxyDriftData, galaxyCenter)
}

// Watch for data changes and update service
watch([galaxyDriftData, galaxyCenter], ([newDriftData, newGalaxyCenter]) => {
  if (newDriftData || newGalaxyCenter) {
    driftDataService.injectData(newDriftData, newGalaxyCenter)
    Logger.log('DRIFT_MONITOR', 'Data injected into service', {
      hasDriftData: !!newDriftData,
      hasGalaxyCenter: !!newGalaxyCenter,
      driftDataKeys: newDriftData ? Object.keys(newDriftData) : [],
      galaxyCenterKeys: newGalaxyCenter ? Object.keys(newGalaxyCenter) : []
    })
  }
}, { immediate: true, deep: true })

// Force update service status periodically
onMounted(() => {
  const forceUpdate = () => {
    driftDataService.forceStatusUpdate()
  }
  
  // Initial update
  forceUpdate()
  
  // Periodic updates
  const interval = setInterval(forceUpdate, 5000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})

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

// Formatted display values using fixed GU units
const formattedVelocity = computed(() => {
  const value = debugInfo.value.velocityMagnitude
  return formatWithUnit(value, 'GU', 'distance', 8) + '/s'
})

const formattedPositionChange = computed(() => {
  const value = debugInfo.value.positionChange
  return formatWithUnit(value, 'GU', 'distance', 8)
})

const formattedPosition = computed(() => {
  const pos = debugInfo.value.statistics.currentPosition
  return {
    x: formatWithUnit(pos.x, 'GU', 'distance', 3),
    y: formatWithUnit(pos.y, 'GU', 'distance', 3),
    z: formatWithUnit(pos.z, 'GU', 'distance', 3),
    unit: 'GU'
  }
})

const formattedTotalDistance = computed(() => {
  const value = debugInfo.value.statistics.totalDistance
  return formatWithUnit(value, 'GU', 'distance', 6)
})

const formattedAvgVelocity = computed(() => {
  const value = debugInfo.value.statistics.averageVelocity
  return formatWithUnit(value, 'GU', 'distance', 8) + '/s'
})

const formattedMaxVelocity = computed(() => {
  const value = debugInfo.value.statistics.maxVelocity
  return formatWithUnit(value, 'GU', 'distance', 8) + '/s'
})

// Toggle debug panel visibility
const toggleDebugPanel = () => {
  showDebugPanel.value = !showDebugPanel.value
  Logger.log('DRIFT_MONITOR', `Debug panel ${showDebugPanel.value ? 'opened' : 'closed'}`)
}

// Track previous position for velocity calculation
let lastPosition = ref<{ x: number; y: number; z: number } | null>(null)
let lastUpdateTime = Date.now()

// Update debug information
const updateDebugInfo = () => {
  try {
    // Get data from the unified service
    const driftStatus = driftDataService.getDriftStatus()
    const availability = driftDataService.getAvailabilityStatus()
    
    // Log availability status with throttling
    Logger.throttle('DRIFT_MONITOR_DEBUG', 'Checking data sources', {
      availability,
      driftStatus: driftStatus.hasData,
      formatted: driftStatus.formatted
    }, LoggingConfig.DRIFT_MONITOR_UPDATE)

    if (!driftStatus.hasData) {
      debugInfo.value = {
        ...debugInfo.value,
        isDrifting: false,
        velocityMagnitude: 0,
        positionChange: 0,
        diagnosis: 'NO_DATA',
        injectionStatus: availability.isAvailable ? 'PENDING' : 'FAILED',
        lastUpdate: new Date().toLocaleTimeString()
        // Keep existing statistics
      }
      return
    }

    const currentTime = Date.now()
    const deltaTime = (currentTime - lastUpdateTime) / 1000 // seconds

    // Get current position from service
    const center = driftDataService.getGalaxyCenter()
    const currentPosition = center ? {
      x: parseFloat(center.x.toFixed(8)),
      y: parseFloat(center.y.toFixed(8)),
      z: parseFloat(center.z.toFixed(8))
    } : { x: 0, y: 0, z: 0 }

    let currentVelocity = 0
    let positionChange = 0

    // Try to get velocity from service first
    const velocityString = driftDataService.getVelocity()
    if (velocityString !== 'N/A') {
      const velocityMatch = velocityString.match(/([\d.e-]+)/)
      if (velocityMatch) {
        // Velocity from GalaxyDriftController is in mGU/s, convert to GU/s for calculations
        currentVelocity = parseFloat(velocityMatch[1]) / 1000
      }
    }

    // Calculate velocity from position changes if not available
    if (currentVelocity === 0 && lastPosition.value && deltaTime > 0 && center) {
      const dx = center.x - lastPosition.value.x
      const dy = center.y - lastPosition.value.y
      const dz = center.z - lastPosition.value.z
      positionChange = Math.sqrt(dx * dx + dy * dy + dz * dz)
      currentVelocity = positionChange / deltaTime  // This is in GU/s
    } else if (lastPosition.value && center) {
      // Always calculate position change for statistics
      const dx = center.x - lastPosition.value.x
      const dy = center.y - lastPosition.value.y
      const dz = center.z - lastPosition.value.z
      positionChange = Math.sqrt(dx * dx + dy * dy + dz * dz)
    }

    // Update statistics
    const isDrifting = currentVelocity > 0.0001 // Lower threshold for better detection

    debugInfo.value = {
      isDrifting,
      velocityMagnitude: currentVelocity,
      positionChange,
      diagnosis: isDrifting ? 'ACTIVE_DRIFT' : (currentVelocity > 0 ? 'MINIMAL_DRIFT' : 'NO_MOVEMENT'),
      statistics: {
        averageVelocity: debugInfo.value.statistics.samplesCollected > 0 
          ? ((debugInfo.value.statistics.averageVelocity * debugInfo.value.statistics.samplesCollected) + currentVelocity) / (debugInfo.value.statistics.samplesCollected + 1)
          : currentVelocity,
        maxVelocity: Math.max(debugInfo.value.statistics.maxVelocity, currentVelocity),
        totalDistance: debugInfo.value.statistics.totalDistance + (positionChange || 0),
        duration: debugInfo.value.statistics.duration + deltaTime,
        samplesCollected: debugInfo.value.statistics.samplesCollected + 1,
        currentPosition
      },
      injectionStatus: 'SUCCESS',
      lastUpdate: new Date().toLocaleTimeString()
    }

    // Store for next calculation
    lastPosition.value = { ...currentPosition }
    lastUpdateTime = currentTime

    Logger.throttle('DRIFT_MONITOR_UPDATE', 'Monitor updated via service', {
      position: currentPosition,
      velocity: currentVelocity,
      positionChange,
      isDrifting,
      diagnosis: debugInfo.value.diagnosis,
      serviceStatus: availability,
      statistics: debugInfo.value.statistics
    }, LoggingConfig.DRIFT_MONITOR_UPDATE)

    // Update chart data
    updateChartData()

  } catch (error) {
    Logger.error('DRIFT_MONITOR', 'Error updating debug info', error)
    debugInfo.value.diagnosis = 'UPDATE_ERROR'
    debugInfo.value.injectionStatus = 'ERROR'
    
    // Fallback: try to get from window config
    if (typeof window !== 'undefined' && (window as any).__DRIFT_CONFIG__) {
      debugInfo.value.diagnosis = 'CONFIG_ONLY'
      debugInfo.value.injectionStatus = 'PARTIAL'
      Logger.throttle('DRIFT_MONITOR_FALLBACK', 'Using config fallback', {}, LoggingConfig.DRIFT_MONITOR_UPDATE)
    } else {
      debugInfo.value.diagnosis = 'INJECTION_FAILED'
      debugInfo.value.injectionStatus = 'FAILED'
    }
  }
}

// Computed values for display
const driftStatusColor = computed(() => {
  switch (debugInfo.value.diagnosis) {
    case 'ACTIVE_DRIFT': return '#00ccff'
    case 'NO_VELOCITY': return '#6699ff'
    case 'NO_MOVEMENT': return '#4477ff'
    case 'INJECTION_FAILED': return '#2255bb'
    default: return '#99bbff'
  }
})

const injectionStatusColor = computed(() => {
  return debugInfo.value.injectionStatus === 'SUCCESS' ? '#00ccff' : '#4477ff'
})

// Lightweight chart data for velocity and position change (last 50 points)
const velocityHistory = ref<number[]>([])
const positionChangeHistory = ref<number[]>([])
const maxHistoryLength = 50

// Update chart data
const updateChartData = () => {
  // Add current values to history
  velocityHistory.value.push(debugInfo.value.velocityMagnitude)
  positionChangeHistory.value.push(debugInfo.value.positionChange)
  
  // Keep only last N points
  if (velocityHistory.value.length > maxHistoryLength) {
    velocityHistory.value.shift()
  }
  if (positionChangeHistory.value.length > maxHistoryLength) {
    positionChangeHistory.value.shift()
  }
}

// Generate SVG path for chart
const generateChartPath = (data: number[], width: number = 200, height: number = 40) => {
  if (data.length < 2) return ''
  
  const maxValue = Math.max(...data, 0.0001) // Prevent division by zero
  const stepX = width / (data.length - 1)
  
  let path = `M 0 ${height - (data[0] / maxValue) * height}`
  
  for (let i = 1; i < data.length; i++) {
    const x = i * stepX
    const y = height - (data[i] / maxValue) * height
    path += ` L ${x} ${y}`
  }
  
  return path
}

// Chart paths for velocity and position change
const velocityChartPath = computed(() => 
  generateChartPath(velocityHistory.value, 180, 30)
)

const positionChangeChartPath = computed(() => 
  generateChartPath(positionChangeHistory.value, 180, 30)
)

onMounted(() => {
  // Update debug info every 2 seconds for more responsive display
  updateInterval = setInterval(updateDebugInfo, 2000)
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
    <button class="debug-toggle" @click="toggleDebugPanel" :class="{ active: showDebugPanel }">
      🔍 DRIFT TOOL
    </button>

    <!-- Debug Panel -->
    <div v-if="showDebugPanel" class="debug-panel">
      <div class="debug-header">
        <h3>🔍 Petersen Galaxy Drift Monitor</h3>
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
            <span class="value" :style="{ color: debugInfo.isDrifting ? '#00ccff' : '#4477ff' }">
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

        <!-- RAW Drift Data (moved above Current Metrics) -->
        <div class="debug-section" v-if="galaxyDriftData">
          <div class="section-title">RAW Drift Data</div>
          <div class="status-item">
            <span class="label">Position (mGU):</span>
            <span class="value position-value">
              ({{ galaxyDriftData.position.value.x }},
              {{ galaxyDriftData.position.value.y }},
              {{ galaxyDriftData.position.value.z }})
            </span>
          </div>
          <div class="status-item">
            <span class="label">Velocity (mGU/s):</span>
            <span class="value">{{ galaxyDriftData.velocity.value }}</span>
          </div>
          <div class="status-item">
            <span class="label">Distance (mGU):</span>
            <span class="value">{{ galaxyDriftData.distance.value }}</span>
          </div>
        </div>

        <!-- Current Metrics with Charts -->
        <div class="debug-section">
          <div class="section-title">Current Metrics</div>
          <div class="status-item">
            <span class="label">Velocity:</span>
            <div class="value-with-chart">
              <span class="value">{{ formattedVelocity }}</span>
              <div class="mini-chart" v-if="velocityHistory.length > 1">
                <svg width="180" height="30" viewBox="0 0 180 30">
                  <path
                    :d="velocityChartPath"
                    stroke="#00ccff"
                    stroke-width="1.5"
                    fill="none"
                    opacity="0.8"
                  />
                  <defs>
                    <linearGradient id="velocityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:#00ccff;stop-opacity:0.1" />
                      <stop offset="100%" style="stop-color:#00ccff;stop-opacity:0.8" />
                    </linearGradient>
                  </defs>
                  <path
                    :d="velocityChartPath + ' L 180 30 L 0 30 Z'"
                    fill="url(#velocityGradient)"
                    opacity="0.3"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div class="status-item">
            <span class="label">Position Change:</span>
            <div class="value-with-chart">
              <span class="value">{{ formattedPositionChange }}</span>
              <div class="mini-chart" v-if="positionChangeHistory.length > 1">
                <svg width="180" height="30" viewBox="0 0 180 30">
                  <path
                    :d="positionChangeChartPath"
                    stroke="#66ff66"
                    stroke-width="1.5"
                    fill="none"
                    opacity="0.8"
                  />
                  <defs>
                    <linearGradient id="positionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:#66ff66;stop-opacity:0.1" />
                      <stop offset="100%" style="stop-color:#66ff66;stop-opacity:0.8" />
                    </linearGradient>
                  </defs>
                  <path
                    :d="positionChangeChartPath + ' L 180 30 L 0 30 Z'"
                    fill="url(#positionGradient)"
                    opacity="0.3"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div class="status-item">
            <span class="label">Position:</span>
            <span class="value position-value">
              ({{ formattedPosition.x }}, {{ formattedPosition.y }}, {{ formattedPosition.z }})
            </span>
          </div>
        </div>

        <!-- Statistics -->
        <div class="debug-section">
          <div class="section-title">Statistics</div>
          <div class="status-item">
            <span class="label">Avg Velocity:</span>
            <span class="value">{{ formattedAvgVelocity }}</span>
          </div>
          <div class="status-item">
            <span class="label">Max Velocity:</span>
            <span class="value">{{ formattedMaxVelocity }}</span>
          </div>
          <div class="status-item">
            <span class="label">Total Distance:</span>
            <span class="value">{{ formattedTotalDistance }}</span>
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



        <!-- Unit Reference (simplified) -->
        <div class="debug-section">
          <div class="section-title">Unit Reference</div>
          <div class="unit-reference">
            <div class="unit-item">
              <span class="unit-symbol">GU</span>
              <span class="unit-name">Galaxy Unit (base scale)</span>
            </div>
            <div class="unit-item">
              <span class="unit-symbol">mGU</span>
              <span class="unit-name">Milli Galaxy Unit (10⁻³ GU)</span>
            </div>
            <div class="unit-item">
              <span class="unit-symbol">nGU</span>
              <span class="unit-name">Nano Galaxy Unit (10⁻⁹ GU)</span>
            </div>
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
  border: 1px solid #00ccff;
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
  max-height: 85vh;
  background: rgba(0, 8, 16, 0.97);
  border: 1px solid rgba(0, 204, 255, 0.6);
  border-radius: 10px;
  overflow-y: auto;
  animation: slideDown 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 204, 255, 0.15);
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

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.4);
  background: linear-gradient(135deg, rgba(0, 204, 255, 0.15), rgba(0, 150, 200, 0.1));
}

.debug-header h3 {
  margin: 0;
  color: #00ddff;
  font-size: 15px;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(0, 204, 255, 0.3);
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
  padding: 18px;
}

.debug-section {
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.25);
}

.debug-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  color: #00ccff;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(0, 204, 255, 0.4);
  border-left: 3px solid #00ccff;
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
  background: rgba(0, 204, 255, 0.05);
  border-radius: 4px;
  padding: 4px 8px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #88ccff;
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

.position-value {
  font-size: 11px;
  line-height: 1.3;
  color: #ccffcc;
  background: rgba(0, 255, 100, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(0, 255, 100, 0.2);
}

/* Chart display styles */
.value-with-chart {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.mini-chart {
  width: 180px;
  height: 30px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  border: 1px solid rgba(0, 204, 255, 0.2);
  overflow: hidden;
}

.mini-chart svg {
  display: block;
  width: 100%;
  height: 100%;
}



/* Unit reference styles */
.unit-reference {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
}

.unit-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 10px;
  opacity: 0.7;
  background: rgba(0, 204, 255, 0.05);
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.unit-item:hover {
  opacity: 1;
  background: rgba(0, 204, 255, 0.1);
  border-color: rgba(0, 204, 255, 0.2);
}

.unit-symbol {
  color: #66ddff;
  font-weight: 700;
  font-family: 'Kodo Mono', monospace;
  min-width: 45px;
  margin-right: 8px;
  text-align: left;
  font-size: 10px;
  text-shadow: 0 0 4px rgba(0, 204, 255, 0.3);
}

.unit-name {
  color: #99ddff;
  font-size: 10px;
  opacity: 0.9;
  flex-grow: 1;
  font-weight: 400;
}

.debug-footer {
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
  background: rgba(102, 153, 204, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
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
