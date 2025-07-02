<script setup lang="ts">
import { ref, inject, computed, onMounted, onUnmounted } from 'vue'
import { Logger } from '../../../utils/logger'
import { LoggingConfig } from '../configs/logging-config'
import { formatWithUnit, getBestUnit } from '../configs/astronomical-units'

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

// Unit preferences with dropdown options
const preferredDistanceUnit = ref('GU')
const preferredVelocityUnit = ref('GU')

// Available unit options for dropdowns
const distanceUnitOptions = computed(() => [
  { value: 'nGU', label: 'nGU (Nano Galaxy Unit)' },
  { value: 'mGU', label: 'mGU (Milli Galaxy Unit)' },
  { value: 'GU', label: 'GU (Galaxy Unit)' },
  { value: 'AU', label: 'AU (Astronomical Unit)' },
  { value: 'ly', label: 'ly (Light Year)' },
  { value: 'pc', label: 'pc (Parsec)' }
])

const velocityUnitOptions = computed(() => [
  { value: 'GU', label: 'GU/s (Galaxy Units per second)' },
  { value: 'mGU', label: 'mGU/s (Milli Galaxy Units per second)' },
  { value: 'nGU', label: 'nGU/s (Nano Galaxy Units per second)' },
  { value: 'AU', label: 'AU/s (Astronomical Units per second)' },
  { value: 'km', label: 'km/s (Kilometers per second)' }
])

// Formatted display values with user-selected units
const formattedVelocity = computed(() => {
  const unit = preferredVelocityUnit.value
  const value = debugInfo.value.velocityMagnitude
  return formatWithUnit(value, unit, 'distance', 8) + '/s'
})

const formattedPositionChange = computed(() => {
  const unit = preferredDistanceUnit.value
  const value = debugInfo.value.positionChange
  return formatWithUnit(value, unit, 'distance', 8)
})

const formattedPosition = computed(() => {
  const pos = debugInfo.value.statistics.currentPosition
  const unit = preferredDistanceUnit.value
  return {
    x: formatWithUnit(pos.x, unit, 'distance', 3),
    y: formatWithUnit(pos.y, unit, 'distance', 3),
    z: formatWithUnit(pos.z, unit, 'distance', 3),
    unit: unit
  }
})

const formattedTotalDistance = computed(() => {
  const unit = preferredDistanceUnit.value
  const value = debugInfo.value.statistics.totalDistance
  return formatWithUnit(value, unit, 'distance', 6)
})

const formattedAvgVelocity = computed(() => {
  const unit = preferredVelocityUnit.value
  const value = debugInfo.value.statistics.averageVelocity
  return formatWithUnit(value, unit, 'distance', 8) + '/s'
})

const formattedMaxVelocity = computed(() => {
  const unit = preferredVelocityUnit.value
  const value = debugInfo.value.statistics.maxVelocity
  return formatWithUnit(value, unit, 'distance', 8) + '/s'
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
    // Debug: log what's available
    Logger.log('DRIFT_MONITOR_DEBUG', 'Checking data sources', {
      hasWindowState: typeof window !== 'undefined' && !!(window as any).__CURRENT_DRIFT_STATE__,
      hasGalaxyCenter: !!galaxyCenter?.value,
      windowState: typeof window !== 'undefined' ? (window as any).__CURRENT_DRIFT_STATE__ : null,
      galaxyCenter: galaxyCenter?.value
    })

    // Primary method: Use window.__CURRENT_DRIFT_STATE__ for real-time data
    if (typeof window !== 'undefined' && (window as any).__CURRENT_DRIFT_STATE__) {
      const currentDriftState = (window as any).__CURRENT_DRIFT_STATE__
      const currentTime = Date.now()
      const deltaTime = (currentTime - lastUpdateTime) / 1000 // seconds

      const currentPosition = {
        x: parseFloat(currentDriftState.position.x.toFixed(8)),
        y: parseFloat(currentDriftState.position.y.toFixed(8)),
        z: parseFloat(currentDriftState.position.z.toFixed(8))
      }

      let currentVelocity = currentDriftState.velocity || 0
      let positionChange = 0

      // Calculate position change from last update
      if (lastPosition.value && deltaTime > 0) {
        const dx = currentPosition.x - lastPosition.value.x
        const dy = currentPosition.y - lastPosition.value.y
        const dz = currentPosition.z - lastPosition.value.z
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
          averageVelocity: currentVelocity,
          maxVelocity: Math.max(debugInfo.value.statistics.maxVelocity, currentVelocity),
          totalDistance: currentDriftState.totalDistance || 0,
          duration: currentDriftState.driftTime || 0,
          samplesCollected: debugInfo.value.statistics.samplesCollected + 1,
          currentPosition
        },
        injectionStatus: 'SUCCESS',
        lastUpdate: new Date().toLocaleTimeString()
      }

      // Store for next calculation
      lastPosition.value = { ...currentPosition }
      lastUpdateTime = currentTime

      Logger.throttle('DRIFT_MONITOR_UPDATE', 'Monitor updated from window state', {
        position: currentPosition,
        velocity: currentVelocity,
        isDrifting,
        diagnosis: debugInfo.value.diagnosis
      }, LoggingConfig.DRIFT_MONITOR_UPDATE)

      return
    }

    // Secondary method: Use direct injection if available
    if (galaxyCenter?.value) {
      const center = galaxyCenter.value
      const currentTime = Date.now()
      const deltaTime = (currentTime - lastUpdateTime) / 1000 // seconds

      const currentPosition = {
        x: parseFloat(center.x.toFixed(8)),
        y: parseFloat(center.y.toFixed(8)),
        z: parseFloat(center.z.toFixed(8))
      }

      let currentVelocity = 0
      let positionChange = 0

      // Calculate velocity from position changes
      if (lastPosition.value && deltaTime > 0) {
        const dx = center.x - lastPosition.value.x
        const dy = center.y - lastPosition.value.y
        const dz = center.z - lastPosition.value.z
        positionChange = Math.sqrt(dx * dx + dy * dy + dz * dz)
        currentVelocity = positionChange / deltaTime
      }

      // Update statistics
      const isDrifting = currentVelocity > 0.0001 // Lower threshold for better detection

      debugInfo.value = {
        isDrifting,
        velocityMagnitude: currentVelocity,
        positionChange,
        diagnosis: isDrifting ? 'ACTIVE_DRIFT' : (currentVelocity > 0 ? 'MINIMAL_DRIFT' : 'NO_MOVEMENT'),
        statistics: {
          averageVelocity: currentVelocity,
          maxVelocity: Math.max(debugInfo.value.statistics.maxVelocity, currentVelocity),
          totalDistance: debugInfo.value.statistics.totalDistance + positionChange,
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

      Logger.throttle('DRIFT_MONITOR_UPDATE', 'Monitor updated from injection', {
        position: currentPosition,
        velocity: currentVelocity,
        isDrifting,
        diagnosis: debugInfo.value.diagnosis
      }, LoggingConfig.DRIFT_MONITOR_UPDATE)

      return
    }

    // Fallback: try to get from window config
    if (typeof window !== 'undefined' && (window as any).__DRIFT_CONFIG__) {
      debugInfo.value.diagnosis = 'CONFIG_ONLY'
      debugInfo.value.injectionStatus = 'PARTIAL'
      Logger.throttle('DRIFT_MONITOR_FALLBACK', 'Using config fallback', {}, LoggingConfig.DRIFT_MONITOR_UPDATE)
    } else {
      debugInfo.value.diagnosis = 'INJECTION_FAILED'
      debugInfo.value.injectionStatus = 'FAILED'
    }

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

// Function to change unit preferences
const changeDistanceUnit = (newUnit: string) => {
  preferredDistanceUnit.value = newUnit
  Logger.throttle('DriftMonitor', `Distance unit changed to ${newUnit}`, LoggingConfig.DRIFT_MONITOR_UPDATE)
}

const changeVelocityUnit = (newUnit: string) => {
  preferredVelocityUnit.value = newUnit
  Logger.throttle('DriftMonitor', `Velocity unit changed to ${newUnit}`, LoggingConfig.DRIFT_MONITOR_UPDATE)
}

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
            <span class="value">{{ formattedVelocity }}</span>
          </div>
          <div class="status-item">
            <span class="label">Position Change:</span>
            <span class="value">{{ formattedPositionChange }}</span>
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

        <!-- Unit Settings -->
        <div class="debug-section">
          <div class="section-title">Display Units</div>
          <div class="unit-settings">
            <div class="unit-setting">
              <label for="distance-unit">Distance:</label>
              <select id="distance-unit" v-model="preferredDistanceUnit"
                @change="changeDistanceUnit(preferredDistanceUnit)" class="unit-selector">
                <option v-for="option in distanceUnitOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <div class="unit-setting">
              <label for="velocity-unit">Velocity:</label>
              <select id="velocity-unit" v-model="preferredVelocityUnit"
                @change="changeVelocityUnit(preferredVelocityUnit)" class="unit-selector">
                <option v-for="option in velocityUnitOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Astronomical Unit Reference -->
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
            <div class="unit-item">
              <span class="unit-symbol">AU</span>
              <span class="unit-name">Astronomical Unit (~150M km)</span>
            </div>
            <div class="unit-item">
              <span class="unit-symbol">ly</span>
              <span class="unit-name">Light Year (~9.46 trillion km)</span>
            </div>
            <div class="unit-item">
              <span class="unit-symbol">pc</span>
              <span class="unit-name">Parsec (~3.26 light years)</span>
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
  border: 1px solid #00ccff; /* 统一边框大小 */
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
  /* Darker background */
  border: 2px solid rgba(0, 204, 255, 0.6);
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

/* Unit settings styles */
.unit-settings {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.unit-setting {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
}

.unit-setting label {
  color: #88ccff;
  font-weight: 600;
  min-width: 60px;
  font-size: 11px;
}

.unit-selector {
  background: rgba(0, 12, 20, 0.8);
  border: 1px solid rgba(0, 204, 255, 0.4);
  border-radius: 4px;
  color: #ffffff;
  padding: 4px 8px;
  font-size: 10px;
  font-family: inherit;
  flex-grow: 1;
  transition: all 0.2s ease;
}

.unit-selector:hover {
  border-color: rgba(0, 204, 255, 0.6);
  background: rgba(0, 12, 20, 0.9);
}

.unit-selector:focus {
  outline: none;
  border-color: #00ccff;
  box-shadow: 0 0 8px rgba(0, 204, 255, 0.3);
}

.unit-selector option {
  background: rgba(0, 12, 20, 0.95);
  color: #ffffff;
  padding: 4px;
}

/* Unit reference styles - 采用与 Performance Tips 一致的样式 */
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
  background: rgba(255, 170, 0, 0.05);
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.unit-item:hover {
  opacity: 1;
  background: rgba(255, 170, 0, 0.1);
  border-color: rgba(255, 170, 0, 0.2);
}

.unit-symbol {
  color: #ffcc44;
  font-weight: 700;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', monospace;
  min-width: 45px;
  margin-right: 8px;
  text-align: left;
  font-size: 10px;
  text-shadow: 0 0 4px rgba(255, 204, 68, 0.3);
}

.unit-name {
  color: #ffdd88;
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

/* Unit switcher styles */
.unit-switcher {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
  padding: 10px;
  border-radius: 6px;
  background: rgba(0, 204, 255, 0.05);
  border: 1px solid rgba(0, 204, 255, 0.2);
}

.switcher-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.switcher-item:hover {
  background: rgba(0, 204, 255, 0.1);
}

.switcher-item .label {
  color: #88ccff;
  font-weight: 600;
  margin-right: 12px;
}

.switcher-item select {
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  border: 1px solid rgba(0, 204, 255, 0.5);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.switcher-item select:hover {
  border-color: #00ccff;
}
</style>
