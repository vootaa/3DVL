<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, inject } from 'vue'
import { Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import type { Ref } from 'vue'
import { Logger } from '../../../../utils/logger'
import { formatWithUnit, getBestUnit } from '../../configs/astronomical-units'

// Camera state tracking
const cameraDistance = ref(20)
const azimuthAngle = ref(0)
const elevationAngle = ref(0)

// Responsive state
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// Display mode
const displayMode = computed(() => {
  if (windowWidth.value < 480 || windowHeight.value < 400) return 'ultra'
  if (windowWidth.value < 768 || windowHeight.value < 600) return 'compact'
  return 'full'
})

// Handle window resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

// Animation frame for updating camera info
let animationFrameId: number | null = null

// Get camera reference from parent component
const cameraRef = inject<Ref<PerspectiveCamera | null>>('camera')

// Grid center reference point
const gridCenter = new Vector3(0, 0, 0)

// Update camera information
const updateCameraInfo = () => {
  try {
    if (cameraRef?.value) {
      const camera = cameraRef.value
      const cameraPosition = camera.position
      
      // Calculate distance from camera to grid center
      cameraDistance.value = cameraPosition.distanceTo(gridCenter)

      // Calculate angles relative to grid center
      const dx = cameraPosition.x - gridCenter.x
      const dy = cameraPosition.y - gridCenter.y
      const dz = cameraPosition.z - gridCenter.z
      
      azimuthAngle.value = (Math.atan2(dx, dz) * 180 / Math.PI)
      
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz)
      elevationAngle.value = (Math.atan2(dy, horizontalDistance) * 180 / Math.PI)
      
      return
    }
  } catch (error) {
    Logger.error('CAMERA_INFO', 'Error accessing camera for position calculation', error)
  }
  
  // Fallback values
  cameraDistance.value = 17.3
  azimuthAngle.value = 45
  elevationAngle.value = 25
}

const startTracking = () => {
  const animate = () => {
    updateCameraInfo()
    animationFrameId = requestAnimationFrame(animate)
  }
  animate()
}

const stopTracking = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// Computed display values
const displayDistance = computed(() => {
  const unit = getBestUnit(cameraDistance.value, 'distance')
  const precision = displayMode.value === 'ultra' ? 1 : displayMode.value === 'compact' ? 1 : 2
  return formatWithUnit(cameraDistance.value, unit, 'distance', precision)
})

const displayAzimuth = computed(() => {
  const precision = displayMode.value === 'ultra' ? 0 : 1
  return azimuthAngle.value.toFixed(precision) + '°'
})

const displayElevation = computed(() => {
  const precision = displayMode.value === 'ultra' ? 0 : 1
  return elevationAngle.value.toFixed(precision) + '°'
})

const displayPosition = computed(() => {
  if (!cameraRef?.value) return { x: '0.0', y: '0.0', z: '0.0' }
  
  const pos = cameraRef.value.position
  return {
    x: pos.x.toFixed(1),
    y: pos.y.toFixed(1),
    z: pos.z.toFixed(1)
  }
})

const compactDistance = computed(() => {
  const unit = getBestUnit(cameraDistance.value, 'distance')
  return formatWithUnit(cameraDistance.value, unit, 'distance', 1).replace(' ', '')
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
  startTracking()
})

onUnmounted(() => {
  stopTracking()
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="camera-info unified-panel" :class="displayMode">
    <!-- Ultra Compact Mode -->
    <template v-if="displayMode === 'ultra'">
      <div class="ultra-content">
        <div class="ultra-row">
          <span class="ultra-icon">📏</span>
          <span class="ultra-value">{{ compactDistance }}</span>
        </div>
        <div class="ultra-row">
          <span class="ultra-icon">🧭</span>
          <span class="ultra-value">{{ displayAzimuth }}</span>
        </div>
        <div class="ultra-row">
          <span class="ultra-icon">📐</span>
          <span class="ultra-value">{{ displayElevation }}</span>
        </div>
      </div>
    </template>

    <!-- Compact Mode -->
    <template v-else-if="displayMode === 'compact'">
      <div class="header">
        <h3>
          <i class="i-carbon-camera header-icon" />
          Camera
        </h3>
      </div>
      
      <div class="content">
        <div class="info-row">
          <span class="label">
            <i class="icon">📏</i> Distance
          </span>
          <span class="value">{{ displayDistance }}</span>
        </div>
        
        <div class="info-row">
          <span class="label">
            <i class="icon">🧭</i> Azimuth
          </span>
          <span class="value">{{ displayAzimuth }}</span>
        </div>
        
        <div class="info-row">
          <span class="label">
            <i class="icon">📐</i> Elevation
          </span>
          <span class="value">{{ displayElevation }}</span>
        </div>
      </div>
    </template>

    <!-- Full Mode -->
    <template v-else>
      <div class="header">
        <h3>
          <i class="i-carbon-camera header-icon" />
          Camera Information
        </h3>
      </div>
      
      <div class="content">
        <div class="section">
          <div class="section-title">Position & Orientation</div>
          
          <!-- Distance -->
          <div class="major-info">
            <span class="label">
              <i class="icon">📏</i> Distance to Center
            </span>
            <span class="value highlighted">{{ displayDistance }}</span>
          </div>
          
          <!-- Position coordinates -->
          <div class="coordinates">
            <div class="coord">
              <span class="coord-label">X:</span>
              <span class="coord-value">{{ displayPosition.x }}</span>
            </div>
            <div class="coord">
              <span class="coord-label">Y:</span>
              <span class="coord-value">{{ displayPosition.y }}</span>
            </div>
            <div class="coord">
              <span class="coord-label">Z:</span>
              <span class="coord-value">{{ displayPosition.z }}</span>
            </div>
          </div>
          
          <!-- Angles -->
          <div class="angles">
            <div class="info-row">
              <span class="label">
                <i class="icon">🧭</i> Azimuth
              </span>
              <span class="value">{{ displayAzimuth }}</span>
            </div>
            <div class="info-row">
              <span class="label">
                <i class="icon">📐</i> Elevation
              </span>
              <span class="value">{{ displayElevation }}</span>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="section">
          <div class="section-title">Camera Controls</div>
          <div class="controls">
            <div class="control">
              <i class="i-carbon-cursor-1 control-icon" />
              <span>Drag to orbit around galaxy center</span>
            </div>
            <div class="control">
              <i class="i-carbon-zoom-in control-icon" />
              <span>Scroll wheel to zoom in/out</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="css" scoped>
.camera-info.unified-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 8, 16, 0.97);
  border: 1px solid rgba(0, 204, 255, 0.6);
  border-radius: 10px;
  color: #00ccff;
  font-family: 'Kodo Mono', monospace;
  font-weight: 500;
  backdrop-filter: blur(8px);
  box-shadow: 
    0 8px 32px rgba(0, 204, 255, 0.15),
    inset 0 1px 0 rgba(0, 204, 255, 0.2);
  z-index: 100;
  transition: all 0.3s ease;
  width: 280px;
  overflow-y: auto;
}

.camera-info:hover {
  border-color: rgba(0, 200, 255, 0.8);
  box-shadow: 
    0 10px 35px rgba(0, 204, 255, 0.25),
    inset 0 1px 0 rgba(0, 204, 255, 0.3);
}

/* Ultra Compact Mode */
.camera-info.ultra {
  width: auto;
  min-width: 70px;
  max-width: 100px;
  height: auto;
  padding: 6px;
  bottom: 10px;
  left: 10px;
  border-radius: 6px;
}

.ultra-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ultra-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 50px;
}

.ultra-icon {
  font-size: 9px;
  filter: hue-rotate(200deg);
  flex-shrink: 0;
}

.ultra-value {
  color: #00ff88;
  font-weight: 600;
  font-size: 9px;
  text-align: right;
  white-space: nowrap;
}

/* Compact Mode */
.camera-info.compact {
  width: 200px;
  bottom: 15px;
  left: 15px;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.4);
  background: linear-gradient(135deg, rgba(0, 204, 255, 0.15), rgba(0, 150, 200, 0.1));
}

.compact .header {
  padding: 10px 14px;
}

.header h3 {
  margin: 0;
  color: #66ddff;
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(0, 204, 255, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.compact .header h3 {
  font-size: 12px;
  gap: 6px;
}

.header-icon {
  font-size: 14px;
  color: #00ccff;
  filter: drop-shadow(0 0 4px rgba(0, 204, 255, 0.5));
}

.compact .header-icon {
  font-size: 12px;
}

/* Content */
.content {
  padding: 18px;
  font-size: 11px;
}

.compact .content {
  padding: 12px;
  font-size: 10px;
}

/* Sections */
.section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.25);
}

.section:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.section-title {
  color: #00ccff;
  font-weight: 700;
  font-size: 11px;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 0 6px rgba(0, 204, 255, 0.4);
  border-left: 3px solid #00ccff;
  padding-left: 8px;
}

/* Info Rows */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding: 4px 0;
}

.major-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 204, 255, 0.05);
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 10px;
  border: 1px solid rgba(0, 204, 255, 0.2);
}

.label {
  display: flex;
  align-items: center;
  color: #99ddff;
  font-weight: 500;
}

.icon {
  margin-right: 6px;
  font-size: 11px;
  filter: hue-rotate(200deg);
}

.compact .icon {
  font-size: 10px;
  margin-right: 4px;
}

.value {
  color: #00ff88;
  font-weight: 600;
  text-align: right;
  min-width: 60px;
}

.value.highlighted {
  color: #66ddff;
  font-size: 12px;
  text-shadow: 0 0 4px rgba(102, 221, 255, 0.3);
}

/* Coordinates Grid */
.coordinates {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 10px 0;
  padding: 8px;
  background: rgba(0, 204, 255, 0.03);
  border-radius: 4px;
  border: 1px solid rgba(0, 204, 255, 0.15);
}

.coord {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.coord-label {
  color: #99ddff;
  font-size: 9px;
  font-weight: 600;
}

.coord-value {
  color: #66ddff;
  font-weight: 500;
  font-size: 10px;
}

/* Angles Grid */
.angles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}

/* Controls */
.controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control {
  display: flex;
  align-items: center;
  font-size: 10px;
  padding: 6px 8px;
  background: rgba(0, 204, 255, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(0, 204, 255, 0.1);
}

.control-icon {
  margin-right: 8px;
  font-size: 11px;
  color: #66ddff;
  flex-shrink: 0;
}

/* Responsive adjustments */
@media only screen and (max-width: 480px) {
  .camera-info.ultra {
    min-width: 60px;
    max-width: 80px;
    padding: 4px;
  }

  .ultra-icon {
    font-size: 8px;
  }

  .ultra-value {
    font-size: 8px;
  }
}

@media only screen and (max-width: 360px) {
  .camera-info.ultra {
    min-width: 50px;
    max-width: 70px;
  }

  .ultra-icon {
    font-size: 7px;
  }

  .ultra-value {
    font-size: 7px;
  }
}

/* Scrollbar styling */
.camera-info::-webkit-scrollbar {
  width: 4px;
}

.camera-info::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.camera-info::-webkit-scrollbar-thumb {
  background: rgba(0, 204, 255, 0.5);
  border-radius: 2px;
}

.camera-info::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 204, 255, 0.7);
}
</style>