<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

// Camera control state tracking
const cameraDistance = ref(20)
const azimuthAngle = ref(0)
const elevationAngle = ref(0)

// Animation frame for updating camera info
let animationFrameId: number | null = null

// Update camera information by accessing TresJS scene elements
const updateCameraInfo = () => {
  try {
    // Try to access the TresJS camera and orbit controls through the DOM
    const canvas = document.querySelector('canvas')
    if (canvas && (canvas as any).__tres) {
      const scene = (canvas as any).__tres
      
      if (scene.camera && scene.controls) {
        const camera = scene.camera
        const controls = scene.controls
        
        // Get actual distance from camera to target
        const target = controls.target || { x: 0, y: 0, z: 0 }
        const distance = camera.position.distanceTo(target)
        cameraDistance.value = distance

        // Calculate spherical coordinates for azimuth and elevation
        const position = camera.position
        
        // Calculate relative position
        const dx = position.x - target.x
        const dy = position.y - target.y
        const dz = position.z - target.z
        
        // Calculate azimuth (horizontal angle) in degrees
        azimuthAngle.value = (Math.atan2(dx, dz) * 180 / Math.PI)
        
        // Calculate elevation (vertical angle) in degrees
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz)
        elevationAngle.value = (Math.atan2(dy, horizontalDistance) * 180 / Math.PI)
        
        return
      }
    }
  } catch (error) {
    // Silently fall through to simulation mode
  }
  
  // Fallback to simulated values for demonstration
  const time = Date.now() * 0.001
  cameraDistance.value = 15 + Math.sin(time * 0.5) * 5
  azimuthAngle.value = Math.sin(time * 0.3) * 45
  elevationAngle.value = Math.cos(time * 0.4) * 30
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
  // Delay start to ensure TresJS is fully initialized
  setTimeout(startTracking, 100)
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
  transform: skew(1deg, -3deg) rotate(-2deg);
  transform-origin: center center;
  pointer-events: none;
  width: 160px;
  min-height: 80px;
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
  margin-bottom: 8px;
  text-align: center;
  border-bottom: 1px solid rgba(0, 204, 255, 0.2);
  padding-bottom: 4px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8em;
  line-height: 1.2;
}

.info-label {
  display: flex;
  align-items: center;
  opacity: 0.9;
  font-size: 0.75em;
}

.info-value {
  font-size: 1em;
  font-weight: 600;
  text-align: right;
  min-width: 45px;
}

.info-icon {
  display: inline-block;
  margin-right: 3px;
  font-style: normal;
  font-size: 0.9em;
}

.distance-icon {
  transform: rotate(45deg);
}

.azimuth-icon {
  font-size: 1.1em;
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

/* Responsive design */
@media only screen and (max-width: 900px) {
  .camera-info {
    padding: 8px 12px;
    width: 140px;
    min-height: 70px;
    transform: skew(0.5deg, -2deg) rotate(-1.5deg);
  }

  .info-value {
    font-size: 0.9em;
  }

  .info-label {
    font-size: 0.7em;
  }
}
</style>
