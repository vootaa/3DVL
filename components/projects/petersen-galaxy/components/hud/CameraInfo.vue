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

// Responsive state
const isCompactMode = ref(false)
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

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

// Check if should use compact mode based on screen size
const checkCompactMode = () => {
  // Use compact mode if width < 768px or height < 600px
  const shouldBeCompact = windowWidth.value < 768 || windowHeight.value < 600
  isCompactMode.value = shouldBeCompact
}

// Handle window resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
  checkCompactMode()
}

// Update camera information using injected camera reference
const updateCameraInfo = () => {
  try {
    if (cameraRef?.value) {
      const cameraPosition = cameraRef.value.position
      
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
      
      return
    }
  } catch (error) {
    Logger.error('CAMERA_INFO', 'Error accessing camera for position calculation', error)
  }
  
  // Fallback: use stable values if camera is not available
  cameraDistance.value = 17.3  // Fixed typical distance
  azimuthAngle.value = 45      // Fixed angle for demonstration
  elevationAngle.value = 25    // Fixed angle for demonstration
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
  return formatWithUnit(cameraDistance.value, unit, 'distance', isCompactMode.value ? 1 : 2)
})

const displayAzimuth = computed(() => {
  return azimuthAngle.value.toFixed(isCompactMode.value ? 0 : 1) + '°'
})

const displayElevation = computed(() => {
  return elevationAngle.value.toFixed(isCompactMode.value ? 0 : 1) + '°'
})

// Compact display for distance (shorter format)
const compactDistance = computed(() => {
  const unit = getBestUnit(cameraDistance.value, 'distance')
  return formatWithUnit(cameraDistance.value, unit, 'distance', 1).replace(' ', '')
})

onMounted(() => {
  // Check initial compact mode
  checkCompactMode()
  
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
  <div class="camera-info" :class="{ 'compact': isCompactMode }">
    <!-- Full mode layout -->
    <template v-if="!isCompactMode">
      <div class="info-header">Camera Control Info</div>
      
      <div class="info-content">
        <!-- Zoom control hint - top -->
        <div class="control-hint top-hint">Scroll to zoom</div>
        
        <!-- Distance row -->
        <div class="control-row">
          <span class="control-label">
            <i class="control-icon">📏</i> Distance
          </span>
          <span class="control-value">{{ displayDistance }}</span>
        </div>
        
        <!-- Unit hint - separate line -->
        <div class="unit-hint">GU = Galaxy Unit</div>
        
        <!-- Angles - two separate rows -->
        <div class="angle-row">
          <span class="angle-label">
            <i class="control-icon">🧭</i> Azimuth
          </span>
          <span class="angle-value">{{ displayAzimuth }}</span>
        </div>
        <div class="angle-row">
          <span class="angle-label">
            <i class="control-icon">📐</i> Elevation
          </span>
          <span class="angle-value">{{ displayElevation }}</span>
        </div>
        
        <!-- Orbit control hint - bottom -->
        <div class="control-hint bottom-hint">Drag to orbit</div>
      </div>
    </template>

    <!-- Compact mode layout -->
    <template v-else>
      <div class="compact-content">
        <div class="compact-row">
          <span class="compact-icon">📏</span>
          <span class="compact-value">{{ compactDistance }}</span>
        </div>
        <div class="compact-row">
          <span class="compact-icon">🧭</span>
          <span class="compact-value">{{ displayAzimuth }}</span>
        </div>
        <div class="compact-row">
          <span class="compact-icon">📐</span>
          <span class="compact-value">{{ displayElevation }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="css" scoped>
.camera-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 10, 25, 0.92));
  border: 1px solid rgba(0, 180, 255, 0.6);
  border-radius: 8px;
  padding: 12px;
  color: #00ccff;
  font-family: 'Kodo Mono', monospace;
  font-weight: 500;
  font-size: 12px;
  width: 200px;
  backdrop-filter: blur(8px);
  box-shadow: 
    0 4px 20px rgba(0, 180, 255, 0.15),
    inset 0 1px 0 rgba(0, 180, 255, 0.2);
  z-index: 100;
  transition: all 0.3s ease;
}

.camera-info:hover {
  border-color: rgba(0, 200, 255, 0.8);
  box-shadow: 
    0 6px 25px rgba(0, 180, 255, 0.25),
    inset 0 1px 0 rgba(0, 180, 255, 0.3);
}

/* Compact mode styles */
.camera-info.compact {
  width: auto;
  min-width: 80px;
  padding: 8px;
  bottom: 15px;
  left: 15px;
}

.compact-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.compact-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 60px;
}

.compact-icon {
  font-size: 10px;
  filter: hue-rotate(200deg);
  flex-shrink: 0;
}

.compact-value {
  color: #00ff88;
  font-weight: 600;
  font-size: 10px;
  text-align: right;
  white-space: nowrap;
}

/* Full mode styles */
.info-header {
  font-size: 11px;
  font-weight: 600;
  color: #66ddff;
  text-align: center;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group {
  position: relative;
}

.control-row, .angle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.control-label, .angle-label {
  display: flex;
  align-items: center;
  color: #99ddff;
  font-size: 11px;
  font-weight: 500;
}

.control-icon {
  margin-right: 6px;
  font-size: 12px;
  filter: hue-rotate(200deg);
}

.control-value {
  color: #00ff88;
  font-weight: 600;
  font-size: 12px;
  text-align: right;
  min-width: 60px;
}

.angle-value {
  color: #66ddff;
  font-weight: 600;
  font-size: 11px;
  text-align: right;
  min-width: 50px;
}

.control-hint {
  font-size: 9px;
  color: #88bbdd;
  opacity: 0.8;
  font-style: italic;
  text-align: center;
  margin: 2px 0;
  padding: 2px 0;
}

.top-hint {
  border-bottom: 1px solid rgba(0, 180, 255, 0.15);
  margin-bottom: 6px;
}

.unit-hint {
  font-size: 8px;
  color: #66aacc;
  opacity: 0.7;
  text-align: center;
  margin: 2px 0 6px 0;
  border-bottom: 1px solid rgba(0, 180, 255, 0.15);
  padding-bottom: 4px;
}

/* Responsive breakpoints */
@media only screen and (max-width: 900px) and (min-width: 768px) and (min-height: 600px) {
  .camera-info:not(.compact) {
    width: 180px;
    padding: 10px;
    font-size: 11px;
  }
  
  .info-header {
    font-size: 10px;
  }
  
  .control-hint {
    font-size: 8px;
  }
}

/* Very small screens - force compact mode with additional constraints */
@media only screen and (max-width: 480px) {
  .camera-info {
    bottom: 10px;
    left: 10px;
    padding: 6px;
  }
  
  .compact-value {
    font-size: 9px;
  }
  
  .compact-icon {
    font-size: 9px;
  }
}

/* Landscape phones */
@media only screen and (max-height: 480px) and (orientation: landscape) {
  .camera-info {
    bottom: 8px;
    left: 8px;
  }
}
</style>
