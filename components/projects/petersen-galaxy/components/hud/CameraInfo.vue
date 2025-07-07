<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, inject } from 'vue'
import { Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import type { Ref } from 'vue'
import { Logger } from '../../../../utils/logger'
import { formatWithUnit, getBestUnit } from '../../configs/astronomical-units'

// Camera control state tracking
const cameraDistance = ref(20)
const azimuthAngle = ref(0)
const elevationAngle = ref(0)
const cameraFov = ref(75)
const cameraZoom = ref(1)

// Responsive state
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// Check screen size modes
const isCompactMode = computed(() => {
  return windowWidth.value < 768 || windowHeight.value < 600
})

const isUltraCompactMode = computed(() => {
  return windowWidth.value < 480 || windowHeight.value < 400
})

// Display mode computed property
const displayMode = computed(() => {
  if (isUltraCompactMode.value) return 'ultra'
  if (isCompactMode.value) return 'compact'
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

// Validate camera injection
if (!cameraRef) {
  Logger.error('CAMERA_INFO', 'Failed to inject camera reference from parent component')
} else {
  Logger.log('CAMERA_INFO', 'Successfully injected camera reference')
}

// Grid center reference point
const gridCenter = new Vector3(0, 0, 0)

// Update camera information using injected camera reference
const updateCameraInfo = () => {
  try {
    if (cameraRef?.value) {
      const camera = cameraRef.value
      const cameraPosition = camera.position
      
      // Calculate distance from camera to grid center
      const distance = cameraPosition.distanceTo(gridCenter)
      cameraDistance.value = distance

      // Calculate relative position to grid center
      const dx = cameraPosition.x - gridCenter.x
      const dy = cameraPosition.y - gridCenter.y
      const dz = cameraPosition.z - gridCenter.z
      
      // Calculate azimuth (horizontal angle) in degrees relative to grid
      azimuthAngle.value = (Math.atan2(dx, dz) * 180 / Math.PI)
      
      // Calculate elevation (vertical angle) in degrees relative to grid
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz)
      elevationAngle.value = (Math.atan2(dy, horizontalDistance) * 180 / Math.PI)
      
      // Get camera properties
      cameraFov.value = camera.fov
      cameraZoom.value = camera.zoom
      
      return
    }
  } catch (error) {
    Logger.error('CAMERA_INFO', 'Error accessing camera for position calculation', error)
  }
  
  // Fallback: use stable values if camera is not available
  cameraDistance.value = 17.3  // Fixed typical distance
  azimuthAngle.value = 45      // Fixed angle for demonstration
  elevationAngle.value = 25    // Fixed angle for demonstration
  cameraFov.value = 75         // Default FOV
  cameraZoom.value = 1         // Default zoom
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

// Computed values for display with astronomical units
const displayDistance = computed(() => {
  const unit = getBestUnit(cameraDistance.value, 'distance')
  const precision = displayMode.value === 'ultra' ? 1 : displayMode.value === 'compact' ? 1 : 2
  return formatWithUnit(cameraDistance.value, unit, 'distance', precision)
})

const displayAzimuth = computed(() => {
  const precision = displayMode.value === 'ultra' ? 0 : displayMode.value === 'compact' ? 0 : 1
  return azimuthAngle.value.toFixed(precision) + '°'
})

const displayElevation = computed(() => {
  const precision = displayMode.value === 'ultra' ? 0 : displayMode.value === 'compact' ? 0 : 1
  return elevationAngle.value.toFixed(precision) + '°'
})

const displayFov = computed(() => {
  return cameraFov.value.toFixed(0) + '°'
})

const displayZoom = computed(() => {
  const precision = displayMode.value === 'ultra' ? 1 : 2
  return cameraZoom.value.toFixed(precision) + 'x'
})

// Camera position for full mode
const displayPosition = computed(() => {
  if (!cameraRef?.value) return { x: '0.0', y: '0.0', z: '0.0' }
  
  const pos = cameraRef.value.position
  const precision = 1
  return {
    x: pos.x.toFixed(precision),
    y: pos.y.toFixed(precision),
    z: pos.z.toFixed(precision)
  }
})

// Compact display formats
const compactDistance = computed(() => {
  const unit = getBestUnit(cameraDistance.value, 'distance')
  return formatWithUnit(cameraDistance.value, unit, 'distance', 1).replace(' ', '')
})

onMounted(() => {
  // Add resize listener
  window.addEventListener('resize', handleResize)
  
  // Start tracking immediately since TresJS camera should be available
  startTracking()
})

onUnmounted(() => {
  stopTracking()
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="camera-info unified-panel" :class="{ 
    'compact': isCompactMode, 
    'ultra-compact': isUltraCompactMode 
  }">
    <!-- Ultra Compact Mode - Essential info only -->
    <template v-if="displayMode === 'ultra'">
      <div class="ultra-compact-content">
        <div class="ultra-compact-row">
          <span class="ultra-icon">📏</span>
          <span class="ultra-value">{{ compactDistance }}</span>
        </div>
        <div class="ultra-compact-row">
          <span class="ultra-icon">🧭</span>
          <span class="ultra-value">{{ displayAzimuth }}</span>
        </div>
        <div class="ultra-compact-row">
          <span class="ultra-icon">📐</span>
          <span class="ultra-value">{{ displayElevation }}</span>
        </div>
      </div>
    </template>

    <!-- Compact Mode - Key camera info -->
    <template v-else-if="displayMode === 'compact'">
      <div class="info-header compact">
        <h3>
          <i class="i-carbon-camera header-icon" aria-hidden="true" />
          <span>Camera</span>
        </h3>
      </div>
      
      <div class="info-content compact">
        <!-- Distance -->
        <div class="info-row">
          <span class="info-label">
            <i class="info-icon">📏</i> Distance
          </span>
          <span class="info-value">{{ displayDistance }}</span>
        </div>
        
        <!-- Angles -->
        <div class="info-row">
          <span class="info-label">
            <i class="info-icon">🧭</i> Azimuth
          </span>
          <span class="info-value">{{ displayAzimuth }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">
            <i class="info-icon">📐</i> Elevation
          </span>
          <span class="info-value">{{ displayElevation }}</span>
        </div>
        
        <!-- Camera properties -->
        <div class="info-row">
          <span class="info-label">
            <i class="info-icon">🔍</i> FOV
          </span>
          <span class="info-value">{{ displayFov }}</span>
        </div>
        
        <!-- Control hints -->
        <div class="control-hints compact">
          <div class="hint-item">Scroll: Zoom</div>
          <div class="hint-item">Drag: Orbit</div>
        </div>
      </div>
    </template>

    <!-- Full Mode - Complete camera information -->
    <template v-else>
      <div class="info-header">
        <h3>
          <i class="i-carbon-camera header-icon" aria-hidden="true" />
          <span>Camera Information</span>
        </h3>
      </div>
      
      <div class="info-content">
        <!-- Camera Status -->
        <div class="status-section">
          <div class="section-title">Camera Status</div>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">Type:</span>
              <span class="status-value">Perspective</span>
            </div>
            <div class="status-item">
              <span class="status-label">State:</span>
              <span class="status-value" :style="{ color: cameraRef ? '#00ccff' : '#ff6666' }">
                {{ cameraRef ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Position & Orientation -->
        <div class="position-section">
          <div class="section-title">Position & Orientation</div>
          
          <!-- Distance -->
          <div class="info-row major">
            <span class="info-label">
              <i class="info-icon">📏</i> Distance to Center
            </span>
            <span class="info-value highlighted">{{ displayDistance }}</span>
          </div>
          
          <!-- Position coordinates -->
          <div class="coordinates-grid">
            <div class="coord-item">
              <span class="coord-label">X:</span>
              <span class="coord-value">{{ displayPosition.x }}</span>
            </div>
            <div class="coord-item">
              <span class="coord-label">Y:</span>
              <span class="coord-value">{{ displayPosition.y }}</span>
            </div>
            <div class="coord-item">
              <span class="coord-label">Z:</span>
              <span class="coord-value">{{ displayPosition.z }}</span>
            </div>
          </div>
          
          <!-- Angles -->
          <div class="angles-grid">
            <div class="info-row">
              <span class="info-label">
                <i class="info-icon">🧭</i> Azimuth
              </span>
              <span class="info-value">{{ displayAzimuth }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <i class="info-icon">📐</i> Elevation
              </span>
              <span class="info-value">{{ displayElevation }}</span>
            </div>
          </div>
        </div>

        <!-- Camera Properties -->
        <div class="properties-section">
          <div class="section-title">Camera Properties</div>
          <div class="properties-grid">
            <div class="property-item">
              <span class="property-label">
                <i class="info-icon">🔍</i> Field of View
              </span>
              <span class="property-value">{{ displayFov }}</span>
            </div>
            <div class="property-item">
              <span class="property-label">
                <i class="info-icon">🔎</i> Zoom Level
              </span>
              <span class="property-value">{{ displayZoom }}</span>
            </div>
          </div>
        </div>

        <!-- Units Reference -->
        <div class="units-section">
          <div class="section-title">Units Reference</div>
          <div class="unit-info">
            <div class="unit-item">
              <span class="unit-abbr">GU</span>
              <span class="unit-desc">Galaxy Unit (≈ 1000 ly)</span>
            </div>
            <div class="unit-item">
              <span class="unit-abbr">°</span>
              <span class="unit-desc">Degrees (angular measurement)</span>
            </div>
          </div>
        </div>

        <!-- Control Instructions -->
        <div class="controls-section">
          <div class="section-title">Camera Controls</div>
          <div class="controls-list">
            <div class="control-item">
              <i class="i-carbon-cursor-1 control-icon" aria-hidden="true" />
              <span class="control-text">Drag to orbit around galaxy center</span>
            </div>
            <div class="control-item">
              <i class="i-carbon-zoom-in control-icon" aria-hidden="true" />
              <span class="control-text">Scroll wheel to zoom in/out</span>
            </div>
            <div class="control-item">
              <i class="i-carbon-rotate-360 control-icon" aria-hidden="true" />
              <span class="control-text">Shift+drag for pan movement</span>
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
  max-height: 80vh;
  overflow-y: auto;
}

.camera-info.compact {
  width: 200px;
  max-height: 70vh;
  bottom: 15px;
  left: 15px;
}

.camera-info.ultra-compact {
  width: auto;
  min-width: 70px;
  max-width: 100px;
  height: auto;
  padding: 6px;
  bottom: 10px;
  left: 10px;
  border-radius: 6px;
}

.camera-info:hover {
  border-color: rgba(0, 200, 255, 0.8);
  box-shadow: 
    0 10px 35px rgba(0, 204, 255, 0.25),
    inset 0 1px 0 rgba(0, 204, 255, 0.3);
}

/* Ultra Compact Mode */
.ultra-compact-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ultra-compact-row {
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

/* Header */
.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.4);
  background: linear-gradient(135deg, rgba(0, 204, 255, 0.15), rgba(0, 150, 200, 0.1));
}

.info-header.compact {
  padding: 10px 14px;
}

.info-header h3 {
  margin: 0;
  color: #66ddff;
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(0, 204, 255, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.compact .info-header h3 {
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
.info-content {
  padding: 18px;
  font-size: 11px;
}

.info-content.compact {
  padding: 12px;
  font-size: 10px;
}

/* Section Titles */
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

.compact .section-title {
  font-size: 9px;
  margin-bottom: 8px;
  padding-left: 6px;
}

/* Status Section */
.status-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.25);
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-label {
  color: #99ddff;
  font-size: 9px;
  font-weight: 600;
}

.status-value {
  color: #ffffff;
  font-weight: 500;
  font-size: 10px;
}

/* Position Section */
.position-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.25);
}

/* Info Rows */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding: 4px 0;
}

.info-row.major {
  background: rgba(0, 204, 255, 0.05);
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 10px;
  border: 1px solid rgba(0, 204, 255, 0.2);
}

.info-label {
  display: flex;
  align-items: center;
  color: #99ddff;
  font-weight: 500;
}

.info-icon {
  margin-right: 6px;
  font-size: 11px;
  filter: hue-rotate(200deg);
}

.compact .info-icon {
  font-size: 10px;
  margin-right: 4px;
}

.info-value {
  color: #00ff88;
  font-weight: 600;
  text-align: right;
  min-width: 60px;
}

.info-value.highlighted {
  color: #66ddff;
  font-size: 12px;
  text-shadow: 0 0 4px rgba(102, 221, 255, 0.3);
}

/* Coordinates Grid */
.coordinates-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 10px 0;
  padding: 8px;
  background: rgba(0, 204, 255, 0.03);
  border-radius: 4px;
  border: 1px solid rgba(0, 204, 255, 0.15);
}

.coord-item {
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
.angles-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}

/* Properties Section */
.properties-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.25);
}

.properties-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.property-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  background: rgba(0, 204, 255, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(0, 204, 255, 0.15);
}

.property-label {
  display: flex;
  align-items: center;
  color: #99ddff;
  font-size: 9px;
  font-weight: 600;
}

.property-value {
  color: #00ff88;
  font-weight: 600;
  font-size: 11px;
}

/* Units Section */
.units-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.25);
}

.unit-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.unit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
}

.unit-abbr {
  background: rgba(0, 204, 255, 0.2);
  color: #66ddff;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  min-width: 24px;
  text-align: center;
}

.unit-desc {
  color: #99ccff;
  font-size: 9px;
  opacity: 0.9;
}

/* Control Hints - Compact Mode */
.control-hints.compact {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 204, 255, 0.25);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hint-item {
  font-size: 8px;
  color: #88bbdd;
  opacity: 0.8;
  font-style: italic;
  text-align: center;
  padding: 2px 0;
}

/* Controls Section - Full Mode */
.controls-section {
  margin-bottom: 0;
}

.controls-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-item {
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

.control-text {
  color: #99ccff;
  flex-grow: 1;
}

/* Responsive adjustments */
@media only screen and (max-width: 480px) {
  .camera-info.ultra-compact {
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
  .camera-info.ultra-compact {
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