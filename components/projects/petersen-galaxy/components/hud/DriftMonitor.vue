<script setup lang="ts">
// Static test data
import { computed, ref } from 'vue'

const debugInfo = ref({
  isDrifting: false,
  diagnosis: 'STATIC_TEST',
  injectionStatus: 'STATIC',
  statistics: {
    averageVelocity: 0.1234,
    maxVelocity: 0.2345,
    totalDistance: 1.2345,
    duration: 12.34,
    samplesCollected: 10,
    currentPosition: { x: 1.0, y: 2.0, z: 3.0 }
  },
  lastUpdate: '12:34:56'
})

// Fake RAW Drift Data
const galaxyDriftData = {
  position: { value: { x: 1.0, y: 2.0, z: 3.0 } },
  velocity: { value: 0.1234 },
  distance: { value: 1.2345 }
}

// Status colors
const driftStatusColor = computed(() =>
  debugInfo.value.diagnosis === 'STATIC_TEST' ? '#ffaa00' : '#00ccff'
)
const injectionStatusColor = computed(() =>
  debugInfo.value.injectionStatus === 'STATIC' ? '#ffaa00' : '#00ccff'
)

// Format data
const formattedVelocity = computed(() => galaxyDriftData.velocity.value.toFixed(4) + ' GU/s')
const formattedPositionChange = computed(() => '0.0123 GU')
const formattedPosition = computed(() => ({
  x: galaxyDriftData.position.value.x.toFixed(3),
  y: galaxyDriftData.position.value.y.toFixed(3),
  z: galaxyDriftData.position.value.z.toFixed(3)
}))
const formattedTotalDistance = computed(() => galaxyDriftData.distance.value.toFixed(4) + ' GU')
const formattedAvgVelocity = computed(() => debugInfo.value.statistics.averageVelocity.toFixed(4) + ' GU/s')
const formattedMaxVelocity = computed(() => debugInfo.value.statistics.maxVelocity.toFixed(4) + ' GU/s')

// Fake history data for chart
const velocityHistory = ref([0.1, 0.12, 0.13, 0.11, 0.1234])
const positionChangeHistory = ref([0.01, 0.011, 0.012, 0.0115, 0.0123])

function genChartPath(history: number[], max = 0.15, min = 0) {
  if (!history.length) return ''
  const w = 180, h = 30
  const step = w / (history.length - 1)
  return history.map((v, i) => {
    const y = h - ((v - min) / (max - min)) * h
    return `${i === 0 ? 'M' : 'L'} ${i * step} ${y.toFixed(2)}`
  }).join(' ')
}
const velocityChartPath = computed(() => genChartPath(velocityHistory.value))
const positionChangeChartPath = computed(() => genChartPath(positionChangeHistory.value, 0.013, 0.01))
</script>

<template>
  <div class="drift-panel unified-panel">
    <div class="debug-header">
      <h3>🔍 Petersen Galaxy Drift Monitor</h3>
      <slot name="close"></slot>
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
                <path :d="velocityChartPath" stroke="#00ccff" stroke-width="1.5" fill="none" opacity="0.8" />
                <defs>
                  <linearGradient id="velocityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#00ccff;stop-opacity:0.1" />
                    <stop offset="100%" style="stop-color:#00ccff;stop-opacity:0.8" />
                  </linearGradient>
                </defs>
                <path :d="velocityChartPath + ' L 180 30 L 0 30 Z'" fill="url(#velocityGradient)" opacity="0.3" />
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
                <path :d="positionChangeChartPath" stroke="#66ff66" stroke-width="1.5" fill="none" opacity="0.8" />
                <defs>
                  <linearGradient id="positionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#66ff66;stop-opacity:0.1" />
                    <stop offset="100%" style="stop-color:#66ff66;stop-opacity:0.8" />
                  </linearGradient>
                </defs>
                <path :d="positionChangeChartPath + ' L 180 30 L 0 30 Z'" fill="url(#positionGradient)" opacity="0.3" />
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

      <!-- Unit Reference -->
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
</template>

<style lang="css" scoped>
.drift-panel.unified-panel {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 700px;
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
  font-family: 'Kodo Mono', monospace;
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
.drift-panel::-webkit-scrollbar {
  width: 6px;
}

.drift-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.drift-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 204, 255, 0.5);
  border-radius: 3px;
}

.drift-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 204, 255, 0.7);
}
</style>