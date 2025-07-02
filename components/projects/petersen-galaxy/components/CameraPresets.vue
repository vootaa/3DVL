<script setup lang="ts">
import { ref, inject, computed, onMounted, watch, nextTick } from 'vue'
import type { PerspectiveCamera } from 'three'
import type { Ref } from 'vue'
import { Logger } from '../../../utils/logger'

// Camera presets configuration
interface CameraPreset {
  id: string
  name: string
  description: string
  position: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
  icon: string
  transition: number // Animation duration in ms
}

const cameraPresets: CameraPreset[] = [
  {
    id: 'overview',
    name: 'Overview',
    description: 'Full galaxy view from above',
    position: { x: 0, y: 15, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    icon: '🌌',
    transition: 2000
  },
  {
    id: 'oblique',
    name: 'Oblique',
    description: 'Angled view of the galaxy',
    position: { x: 10, y: 8, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    icon: '📐',
    transition: 1500
  },
  {
    id: 'edge',
    name: 'Edge View',
    description: 'Galaxy from the side',
    position: { x: 0, y: 0, z: 15 },
    target: { x: 0, y: 0, z: 0 },
    icon: '📏',
    transition: 1800
  },
  {
    id: 'close',
    name: 'Close Up',
    description: 'Detailed view of galaxy center',
    position: { x: 3, y: 2, z: 3 },
    target: { x: 0, y: 0, z: 0 },
    icon: '🔍',
    transition: 1200
  },
  {
    id: 'drift-track',
    name: 'Drift Track',
    description: 'Follow galaxy drift movement',
    position: { x: 5, y: 5, z: 5 },
    target: { x: 0, y: 0, z: 0 },
    icon: '🛸',
    transition: 1000
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Dramatic low angle view',
    position: { x: -8, y: 3, z: 12 },
    target: { x: 0, y: 0, z: 0 },
    icon: '🎬',
    transition: 2500
  }
]

// Component state
const showPresetsPanel = ref(false)
const isTransitioning = ref(false)
const currentPreset = ref<string | null>(null)
const transitionProgress = ref(0)

// Inject camera and controls references
const cameraRef = inject<Ref<PerspectiveCamera | null>>('camera')
const orbitControlsRef = inject<Ref<any>>('orbitControls')

// Debug: Log injected refs
Logger.log('CAMERA_PRESETS', 'Initialized with refs:', { 
  cameraRef: !!cameraRef, 
  orbitControlsRef: !!orbitControlsRef
})

// Computed properties
const availablePresets = computed(() => cameraPresets)

const canUsePresets = computed(() => {
  const canUse = !!(cameraRef?.value && orbitControlsRef?.value)
  return canUse
})

// Create a more reactive status for debugging
const debugStatus = computed(() => ({
  hasCamera: !!cameraRef?.value,
  hasControls: !!orbitControlsRef?.value,
  canUse: canUsePresets.value,
  cameraType: cameraRef?.value?.constructor?.name || 'none',
  controlsType: orbitControlsRef?.value?.constructor?.name || 'none'
}))

// Watch for ref changes with better debugging
watch([() => cameraRef?.value, () => orbitControlsRef?.value], ([camera, controls]) => {
  if (camera && controls) {
    Logger.log('CAMERA_PRESETS', '✅ Both refs ready!')
  }
}, { immediate: true })

onMounted(async () => {
  Logger.log('CAMERA_PRESETS', '🚀 Component mounted')
  
  // Wait for next tick to allow TresJS to initialize
  await nextTick()
  Logger.log('CAMERA_PRESETS', '⏳ After nextTick:', debugStatus.value)
  
  // Check periodically for a few seconds to catch async initialization
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      Logger.log('CAMERA_PRESETS', `🔍 Check ${i + 1}/10:`, debugStatus.value)
    }, i * 500)
  }
})

// Toggle presets panel
const togglePresetsPanel = () => {
  showPresetsPanel.value = !showPresetsPanel.value
  Logger.log('CAMERA_PRESETS', `📂 Camera presets panel ${showPresetsPanel.value ? 'opened' : 'closed'}`)
}

// Test function to verify click events work
const testClick = () => {
  Logger.log('CAMERA_PRESETS', '🧪 TEST CLICK WORKS!', debugStatus.value)
  alert('Click test successful! Check console for details.')
}

// Animation helper for smooth camera transitions
const animateCamera = (preset: CameraPreset): Promise<void> => {
  return new Promise((resolve) => {
    if (!cameraRef?.value || !orbitControlsRef?.value) {
      Logger.error('CAMERA_PRESETS', 'Camera or controls not available')
      resolve()
      return
    }

    // Try to access the actual Three.js objects
    // TresJS may wrap components, so try different access patterns
    let camera: any = cameraRef.value
    let controls: any = orbitControlsRef.value
    
    // For TresJS, the actual Three.js object might be in different properties
    if (camera.$el) camera = camera.$el
    if (camera.value) camera = camera.value
    if (controls.$el) controls = controls.$el  
    if (controls.value) controls = controls.value
    
    Logger.log('CAMERA_PRESETS', 'Using objects:', {
      camera: camera?.constructor?.name,
      controls: controls?.constructor?.name,
      hasPosition: !!camera?.position,
      hasTarget: !!controls?.target
    })
    
    if (!camera?.position || !controls?.target) {
      Logger.error('CAMERA_PRESETS', 'Cannot access camera position or controls target')
      resolve()
      return
    }
    
    // Store initial positions
    const startPosition = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    }
    
    const startTarget = {
      x: controls.target.x,
      y: controls.target.y,
      z: controls.target.z
    }
    
    const duration = preset.transition
    const startTime = performance.now()
    
    isTransitioning.value = true
    transitionProgress.value = 0
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Use easeInOutCubic for smooth animation
      const easeProgress = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
      
      // Interpolate camera position
      camera.position.x = startPosition.x + (preset.position.x - startPosition.x) * easeProgress
      camera.position.y = startPosition.y + (preset.position.y - startPosition.y) * easeProgress
      camera.position.z = startPosition.z + (preset.position.z - startPosition.z) * easeProgress
      
      // Interpolate target position
      controls.target.x = startTarget.x + (preset.target.x - startTarget.x) * easeProgress
      controls.target.y = startTarget.y + (preset.target.y - startTarget.y) * easeProgress
      controls.target.z = startTarget.z + (preset.target.z - startTarget.z) * easeProgress
      
      // Update controls
      if (controls.update) {
        controls.update()
      }
      
      transitionProgress.value = progress * 100
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        isTransitioning.value = false
        transitionProgress.value = 0
        currentPreset.value = preset.id
        resolve()
      }
    }
    
    requestAnimationFrame(animate)
  })
}

// Apply camera preset
const applyPreset = async (preset: CameraPreset) => {
  Logger.log('CAMERA_PRESETS', `🎯 PRESET CLICKED: ${preset.name}`)
  
  // Simple test - just move camera directly without animation first
  if (!cameraRef?.value || !orbitControlsRef?.value) {
    Logger.error('CAMERA_PRESETS', 'Camera or controls not available', {
      camera: !!cameraRef?.value,
      controls: !!orbitControlsRef?.value,
      cameraRef: !!cameraRef,
      orbitControlsRef: !!orbitControlsRef
    })
    return
  }

  // Direct assignment test (without animation)
  try {
    const camera = cameraRef.value
    const controls = orbitControlsRef.value
    
    Logger.log('CAMERA_PRESETS', 'Camera object info:', {
      type: camera.constructor.name,
      hasPosition: !!camera.position,
      currentPos: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      }
    })
    
    Logger.log('CAMERA_PRESETS', 'Controls object info:', {
      type: controls.constructor.name,
      hasTarget: !!controls.target,
      hasUpdate: typeof controls.update === 'function',
      currentTarget: controls.target ? {
        x: controls.target.x,
        y: controls.target.y,
        z: controls.target.z
      } : null
    })
    
    // Direct assignment for testing
    camera.position.set(preset.position.x, preset.position.y, preset.position.z)
    if (controls.target) {
      controls.target.set(preset.target.x, preset.target.y, preset.target.z)
    }
    if (controls.update) {
      controls.update()
    }
    
    currentPreset.value = preset.id
    Logger.log('CAMERA_PRESETS', `✅ Direct preset applied: ${preset.name}`)
    
  } catch (error) {
    Logger.error('CAMERA_PRESETS', `❌ Error applying preset ${preset.name}`, error)
  }
}

// Reset to default view
const resetCamera = async () => {
  const defaultPreset: CameraPreset = {
    id: 'default',
    name: 'Default',
    description: 'Default camera position',
    position: { x: 5, y: 5, z: 5 },
    target: { x: 0, y: 0, z: 0 },
    icon: '🏠',
    transition: 1500
  }
  
  await applyPreset(defaultPreset)
  currentPreset.value = null
}
</script>

<template>
  <div class="camera-presets">
    <!-- Toggle Button -->
    <button 
      class="presets-toggle" 
      @click="togglePresetsPanel"
      :class="{ active: showPresetsPanel }"
      :disabled="!canUsePresets"
    >
      📷 PRESETS
    </button>

    <!-- Presets Panel -->
    <div v-if="showPresetsPanel" class="presets-panel">
      <div class="presets-header">
        <h3>📷 Camera Presets</h3>
        <button class="close-btn" @click="showPresetsPanel = false">×</button>
      </div>

      <div class="presets-content">
        <!-- Transition Status -->
        <div v-if="isTransitioning" class="transition-status">
          <div class="transition-info">
            <span class="transition-text">Animating Camera...</span>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${transitionProgress}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Current Status -->
        <div class="current-status">
          <div class="status-item">
            <span class="label">Current Preset:</span>
            <span class="value">{{ currentPreset || 'Custom' }}</span>
          </div>
          <div class="status-item">
            <span class="label">Controls:</span>
            <span class="value" :style="{ color: canUsePresets ? '#00ff00' : '#ff0000' }">
              {{ canUsePresets ? 'Ready' : 'Not Available' }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">Debug:</span>
            <span class="value">{{ debugStatus.hasCamera ? '📷' : '❌' }} {{ debugStatus.hasControls ? '🎮' : '❌' }}</span>
          </div>
        </div>

        <!-- Test Section -->
        <div class="test-section">
          <div class="section-title">Debug Test</div>
          <button class="test-btn" @click="testClick">
            🧪 Test Click Event
          </button>
        </div>

        <!-- Preset Buttons -->
        <div class="presets-section">
          <div class="section-title">Quick Presets</div>
          <div class="presets-grid">
            <button 
              v-for="preset in availablePresets" 
              :key="preset.id"
              class="preset-btn"
              :class="{ 
                active: currentPreset === preset.id,
                disabled: !canUsePresets || isTransitioning
              }"
              :disabled="!canUsePresets || isTransitioning"
              @click="applyPreset(preset)"
            >
              <div class="preset-icon">{{ preset.icon }}</div>
              <div class="preset-info">
                <div class="preset-name">{{ preset.name }}</div>
                <div class="preset-description">{{ preset.description }}</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Reset Button -->
        <div class="reset-section">
          <button 
            class="reset-btn"
            :disabled="!canUsePresets || isTransitioning"
            @click="resetCamera"
          >
            🏠 Reset to Default
          </button>
        </div>

        <!-- Usage Instructions -->
        <div class="instructions-section">
          <div class="section-title">Instructions</div>
          <div class="instructions">
            <div class="instruction-item">
              <span class="instruction-icon">🖱️</span>
              <span class="instruction-text">Click any preset to animate the camera</span>
            </div>
            <div class="instruction-item">
              <span class="instruction-icon">⏱️</span>
              <span class="instruction-text">Each preset has its own transition duration</span>
            </div>
            <div class="instruction-item">
              <span class="instruction-icon">🔄</span>
              <span class="instruction-text">Use Reset to return to default view</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.camera-presets {
  position: fixed;
  top: 140px; /* Below performance monitor */
  right: 20px;
  z-index: 998;
  font-family: 'Kode Mono', monospace;
}

.presets-toggle {
  background: rgba(0, 12, 20, 0.9);
  border: 2px solid #ff6600;
  color: #ff6600;
  padding: 8px 16px;
  border-radius: 6px;
  font-family: inherit;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.presets-toggle:hover:not(:disabled) {
  background: rgba(255, 102, 0, 0.1);
  box-shadow: 0 0 10px rgba(255, 102, 0, 0.3);
}

.presets-toggle.active {
  background: rgba(255, 102, 0, 0.2);
  box-shadow: 0 0 15px rgba(255, 102, 0, 0.5);
}

.presets-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.presets-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 400px;
  max-height: 75vh;
  background: rgba(0, 8, 16, 0.97);
  border: 2px solid rgba(255, 102, 0, 0.6);
  border-radius: 10px;
  overflow-y: auto;
  animation: slideDown 0.3s ease;
  box-shadow: 0 8px 32px rgba(255, 102, 0, 0.15);
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

.presets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 102, 0, 0.4);
  background: linear-gradient(135deg, rgba(255, 102, 0, 0.15), rgba(255, 80, 0, 0.1));
}

.presets-header h3 {
  margin: 0;
  color: #ff8800;
  font-size: 15px;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(255, 102, 0, 0.3);
}

.close-btn {
  background: none;
  border: none;
  color: #ff6600;
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

.presets-content {
  padding: 18px;
}

/* Transition Status */
.transition-status {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 102, 0, 0.1);
  border: 1px solid rgba(255, 102, 0, 0.3);
  border-radius: 6px;
}

.transition-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transition-text {
  color: #ff8800;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.progress-bar {
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6600, #ff8800);
  transition: width 0.1s ease;
}

/* Current Status */
.current-status {
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 102, 0, 0.25);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #ff9966;
  font-weight: 600;
}

.value {
  color: #ffffff;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', monospace;
  font-size: 12px;
  font-weight: 500;
}

/* Presets Section */
.presets-section {
  margin-bottom: 18px;
}

.section-title {
  color: #ff6600;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(255, 102, 0, 0.4);
  border-left: 3px solid #ff6600;
  padding-left: 8px;
}

.presets-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.preset-btn {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(255, 102, 0, 0.05);
  border: 1px solid rgba(255, 102, 0, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  text-align: left;
}

.preset-btn:hover:not(:disabled) {
  background: rgba(255, 102, 0, 0.15);
  border-color: rgba(255, 102, 0, 0.4);
  transform: translateX(2px);
}

.preset-btn.active {
  background: rgba(255, 102, 0, 0.25);
  border-color: rgba(255, 102, 0, 0.6);
  box-shadow: 0 0 10px rgba(255, 102, 0, 0.3);
}

.preset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset-icon {
  font-size: 20px;
  margin-right: 12px;
  min-width: 30px;
  text-align: center;
}

.preset-info {
  flex-grow: 1;
}

.preset-name {
  color: #ff8800;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 2px;
}

.preset-description {
  color: #cc9966;
  font-size: 11px;
  opacity: 0.9;
}

/* Test Section */
.test-section {
  margin-bottom: 18px;
  text-align: center;
  padding: 12px;
  background: rgba(0, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 6px;
}

.test-btn {
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.4);
  color: #00ffff;
  padding: 8px 16px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-btn:hover {
  background: rgba(0, 255, 255, 0.2);
  border-color: rgba(0, 255, 255, 0.6);
}

/* Reset Section */
.reset-section {
  margin-bottom: 18px;
  text-align: center;
}

.reset-btn {
  background: rgba(0, 12, 20, 0.8);
  border: 1px solid rgba(255, 102, 0, 0.4);
  color: #ff8800;
  padding: 10px 20px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn:hover:not(:disabled) {
  background: rgba(255, 102, 0, 0.1);
  border-color: rgba(255, 102, 0, 0.6);
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Instructions */
.instructions-section {
  border-top: 1px solid rgba(255, 102, 0, 0.25);
  padding-top: 12px;
}

.instructions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.instruction-item {
  display: flex;
  align-items: center;
  font-size: 11px;
  padding: 6px 8px;
  background: rgba(255, 102, 0, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(255, 102, 0, 0.1);
}

.instruction-icon {
  margin-right: 8px;
  font-size: 12px;
}

.instruction-text {
  color: #cc9966;
  flex-grow: 1;
}

/* Scrollbar styling */
.presets-panel::-webkit-scrollbar {
  width: 6px;
}

.presets-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.presets-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 102, 0, 0.5);
  border-radius: 3px;
}

.presets-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 102, 0, 0.7);
}
</style>
