<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, inject } from 'vue'
import { Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import type { Ref } from 'vue'

// Camera control state tracking
const cameraDistance = ref(20)
const azimuthAngle = ref(0)
const elevationAngle = ref(0)

// Animation frame for updating camera info
let animationFrameId: number | null = null

// Get camera reference from parent component
const cameraRef = inject<Ref<PerspectiveCamera | null>>('camera')

// Get galaxy drift data from parent component
const galaxyDriftData = inject('galaxyDriftData', {
  position: ref({ x: '0.000', y: '0.000', z: '0.000' }),
  velocity: ref('0.0000'),
  distance: ref('0.00'),
  duration: ref(0)
})

// Grid center reference point
const gridCenter = new Vector3(0, 0, 0)

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
    console.error('Error accessing camera:', error)
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

// Computed values for display
const displayDistance = computed(() => {
  return cameraDistance.value.toFixed(1)
})

const displayAzimuth = computed(() => {
  return Math.round(azimuthAngle.value)
})

const displayElevation = computed(() => {
  return Math.round(elevationAngle.value)
})

onMounted(() => {
  // Start tracking immediately since TresJS camera should be available
  startTracking()
})

onUnmounted(() => {
  stopTracking()
})
</script>

<template>
  <div class="camera-info">
    <div class="info-header">CAMERA</div>
    <div class="info-content">
      <div class="info-row">
        <span class="info-label">
          <i class="info-icon distance-icon">↕</i> Distance
        </span>
        <span class="info-value distance-value">{{ displayDistance }} AU</span>
      </div>
      <div class="info-row">
        <span class="info-label">
          <i class="info-icon azimuth-icon">↻</i> Azimuth
        </span>
        <span class="info-value azimuth-value">{{ displayAzimuth }}°</span>
      </div>
      <div class="info-row">
        <span class="info-label">
          <i class="info-icon elevation-icon">⇅</i> Elevation
        </span>
        <span class="info-value elevation-value">{{ displayElevation }}°</span>
      </div>
    </div>
    
    <!-- Galaxy Drift Section -->
    <div class="info-header drift-header">GALAXY DRIFT</div>
    <div class="info-content">
      <div class="info-row">
        <span class="info-label">
          <i class="info-icon drift-icon">⚬</i> Position
        </span>
        <span class="info-value position-value">
          {{ galaxyDriftData.position.value.x }}, {{ galaxyDriftData.position.value.y }}, {{ galaxyDriftData.position.value.z }}
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">
          <i class="info-icon velocity-icon">→</i> Velocity
        </span>
        <span class="info-value velocity-value">{{ galaxyDriftData.velocity.value }} u/s</span>
      </div>
      <div class="info-row">
        <span class="info-label">
          <i class="info-icon distance-icon">⤷</i> Total Drift
        </span>
        <span class="info-value drift-distance-value">{{ galaxyDriftData.distance.value }} u</span>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.camera-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 12, 20, 0.85);
  border: 1px solid rgba(0, 204, 255, 0.4);
  border-radius: 8px;
  padding: 10px 15px;
  color: #00CCFF;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-weight: 500;
  font-variant-numeric: slashed-zero tabular-nums;
  text-transform: uppercase;
  line-height: 1em;
  transform: skew(0.5deg, -1.5deg) rotate(-1deg);
  transform-origin: center center;
  pointer-events: none;
  width: 220px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  transition: all 0.2s ease;
  z-index: 100;
  box-shadow: 0 0 15px rgba(0, 204, 255, 0.2);
}

.info-header {
  font-size: 0.9em;
  opacity: 0.8;
  margin-bottom: 6px;
  text-align: center;
  border-bottom: 1px solid rgba(0, 204, 255, 0.2);
  padding-bottom: 3px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9em;
  line-height: 1.1;
}

.info-label {
  display: flex;
  align-items: center;
  opacity: 0.9;
  font-size: 1em;
}

.info-value {
  font-size: 0.85em;
  font-weight: 600;
  text-align: right;
  min-width: 50px;
}

.info-icon {
  display: inline-block;
  margin-right: 5px;
  font-style: normal;
  font-size: 1.2em;
}

.distance-icon {
  transform: rotate(45deg);
}

.azimuth-icon {
  font-size: 1.3em;
}

.elevation-icon {
  font-weight: bold;
}

/* Color coding similar to space-game observation controls */
.distance-value {
  color: #a0e0ff;
}

.azimuth-value {
  color: #ffcc77;
}

.elevation-value {
  color: #77ffaa;
}

/* Galaxy drift section styles */
.drift-header {
  margin-top: 8px;
  color: #ff6b6b;
  border-bottom-color: rgba(255, 107, 107, 0.3);
}

.drift-icon {
  color: #ff6b6b;
}

.position-value {
  color: #ff9999;
  font-size: 0.7em;
  word-break: break-all;
}

.velocity-value {
  color: #ffaa77;
}

.drift-distance-value {
  color: #ffcc99;
}

/* Responsive design */
@media only screen and (max-width: 900px) {
  .camera-info {
    padding: 8px 12px;
    width: 160px;
    min-height: 55px;
    transform: skew(0.25deg, -1deg) rotate(-0.75deg);
  }

  .info-value {
    font-size: 0.8em;
  }

  .info-label {
    font-size: 0.9em;
  }
}
</style>
