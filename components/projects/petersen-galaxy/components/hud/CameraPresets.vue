<script setup lang="ts">
import { ref, inject, computed, onMounted, onUnmounted } from 'vue'
import type { PerspectiveCamera } from 'three'
import type { Ref } from 'vue'
import { Logger } from '../../../../utils/logger'
import { OrbitControlsAccessTest } from '../../utils/orbit-controls-test'

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
    position: { x: 0, y: 20, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    icon: '🌌',
    transition: 1800
  },
  {
    id: 'spiral-arm',
    name: 'Spiral Arm', 
    description: 'View from spiral arm perspective',
    position: { x: 16, y: 2, z: 16 },
    target: { x: -3, y: 0, z: -3 },
    icon: '🌀',
    transition: 1600
  },
  {
    id: 'oblique',
    name: 'Oblique',
    description: 'Balanced angled perspective',
    position: { x: 15, y: 12, z: 15 },
    target: { x: 0, y: 0, z: 0 },
    icon: '�',
    transition: 1600
  },
  {
    id: 'side-view',
    name: 'Side View',
    description: 'Galaxy profile from the side',
    position: { x: 22, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    icon: '📏',
    transition: 2000
  },
  {
    id: 'close-inspect',
    name: 'Close Inspect',
    description: 'Detailed core inspection',  
    position: { x: 2.5, y: 2, z: 2.5 },
    target: { x: 0, y: 0, z: 0 },
    icon: '🔍',
    transition: 1200
  },
  {
    id: 'drift-follow',
    name: 'Drift Follow',
    description: 'Follow the galaxy drift motion',
    position: { x: 8, y: 8, z: 8 },
    target: { x: 0, y: 2, z: 0 },
    icon: '🛸',
    transition: 1400
  }
]

// Component state
const showPresetsPanel = ref(false)
const currentPreset = ref<string | null>(null)

// Inject camera and controls references
const cameraRef = inject<Ref<PerspectiveCamera | null>>('camera')
const orbitControlsRef = inject<Ref<any>>('orbitControls')
const startTrailReview = inject('startTrailReview') as (points: any[]) => void
const trailRendererRef = inject('trailRendererRef', null) // Must be provided by the parent component

// Computed properties
const availablePresets = computed(() => cameraPresets)

const canUsePresets = computed(() => {
  // Check if camera and controls are available
  const camera = cameraRef?.value
  const controls = orbitControlsRef?.value
  
  // Allow usage if camera exists and controls component exists
  // We don't need to check for target initialization here since we handle it in applyPreset
  return !!(camera && controls)
})

// Debug status for template
const debugStatus = computed(() => {
  const camera = cameraRef?.value
  const controlsComponent = orbitControlsRef?.value
  
  let accessTest = null
  if (controlsComponent) {
    accessTest = OrbitControlsAccessTest.testControlsAccess(controlsComponent)
  }
  
  return {
    cameraReady: !!camera,
    controlsReady: !!controlsComponent,
    targetReady: accessTest?.success || false,
    cameraRef: !!cameraRef,
    orbitControlsRef: !!orbitControlsRef,
    accessMethod: accessTest?.method || 'none'
  }
})

// Keyboard shortcuts support
const handleKeyPress = (event: KeyboardEvent) => {
  // Only handle shortcuts when panel is open
  if (!showPresetsPanel.value || !canUsePresets.value) return
  
  const key = event.key.toLowerCase()
  const numKey = parseInt(key)
  
  // Support number keys 1-6 for quick preset selection
  if (numKey >= 1 && numKey <= availablePresets.value.length) {
    event.preventDefault()
    const preset = availablePresets.value[numKey - 1]
    applyPreset(preset)
  }
  
  // Support 'r' for reset
  if (key === 'r') {
    event.preventDefault()
    resetCamera()
  }
  
  // Support escape to close panel
  if (key === 'escape') {
    event.preventDefault()
    showPresetsPanel.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})

// Toggle presets panel
const togglePresetsPanel = () => {
  showPresetsPanel.value = !showPresetsPanel.value
  Logger.log('CAMERA_PRESETS', `Camera presets panel ${showPresetsPanel.value ? 'opened' : 'closed'}`)
}

// Apply camera preset - DIRECT SWITCH ONLY
const applyPreset = (preset: CameraPreset) => {
  Logger.log('CAMERA_PRESETS', `Applying preset: ${preset.name}`)
  
  const camera = cameraRef?.value
  const controlsComponent = orbitControlsRef?.value
  
  if (!camera) {
    Logger.error('CAMERA_PRESETS', 'Missing camera reference')
    return
  }
  
  if (!controlsComponent) {
    Logger.error('CAMERA_PRESETS', 'Missing controls reference')
    return
  }
  
  try {
    // Direct assignment - instant switch
    camera.position.set(preset.position.x, preset.position.y, preset.position.z)
    
    // Use the test utility to find the correct way to access OrbitControls
    const accessTest = OrbitControlsAccessTest.testControlsAccess(controlsComponent)
    
    if (accessTest.success) {
      // Successfully found OrbitControls, set the target
      accessTest.target.set(preset.target.x, preset.target.y, preset.target.z)
      
      // Update the controls if update method exists
      if (typeof accessTest.controls.update === 'function') {
        accessTest.controls.update()
      }
      
      Logger.log('CAMERA_PRESETS', `Successfully applied preset: ${preset.name} (method: ${accessTest.method})`)
    } else {
      // Log structure for debugging in development
      if (process.env.NODE_ENV === 'development') {
        OrbitControlsAccessTest.logControlsStructure(controlsComponent)
      }
      
      Logger.warn('CAMERA_PRESETS', 'Could not access OrbitControls target - controls may not be fully initialized')
      Logger.log('CAMERA_PRESETS', `Camera position set for preset: ${preset.name} (target setting skipped)`)
    }
    // Check Drift Follow trail review conditions
    if (preset.id === 'drift-follow') {
      // Check trail review conditions
      if (trailRendererRef?.getTrailStats && trailRendererRef?.getTrailSnapshot) {
      const stats = trailRendererRef.getTrailStats()
      if (stats.enabled && stats.pointCount > stats.maxTrailPoints / 3) {
        // If conditions are met, trigger trail review
        const trailPoints = trailRendererRef.getTrailSnapshot()
        if (startTrailReview && typeof startTrailReview === 'function') {
        startTrailReview(trailPoints)
        }
      }
      }
    }
    
    currentPreset.value = preset.id
  } catch (error) {
    Logger.error('CAMERA_PRESETS', `Error applying preset: ${error}`)
  }
}

// Reset to default view
const resetCamera = () => {
  const defaultPreset: CameraPreset = {
    id: 'default',
    name: 'Default',
    description: 'Default camera position',
    position: { x: 10, y: 8, z: 10 }, // Match initial position from parent component
    target: { x: 0, y: 0, z: 0 },
    icon: '🏠',
    transition: 1800
  }
  
  applyPreset(defaultPreset)
  currentPreset.value = null
}
</script>

<template>
  <div class="camera-presets">
    <!-- Toggle Button -->
    <button class="presets-toggle" @click="togglePresetsPanel" :class="{ active: showPresetsPanel }"
      :disabled="!canUsePresets">
      📷 CAMERA PRESETS
    </button>

    <!-- Presets Panel -->
    <div v-if="showPresetsPanel" class="presets-panel">
      <div class="presets-header">
        <h3>📷 Camera Presets</h3>
        <button class="close-btn" @click="showPresetsPanel = false">×</button>
      </div>

      <div class="presets-content">
        <!-- Current Status -->
        <div class="current-status">
          <div class="status-item">
            <span class="label">Current Preset:</span>
            <span class="value">{{ currentPreset || 'Custom' }}</span>
          </div>
          <div class="status-item">
            <span class="label">Controls:</span>
            <span class="value" :style="{ color: canUsePresets ? '#00ccff' : '#4477ff' }">
              {{ canUsePresets ? 'Ready' : 'Not Available' }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">Debug:</span>
            <span class="value">Cam: {{ debugStatus.cameraReady ? '✅' : '❌' }} | Ctrl: {{ debugStatus.controlsReady ?
              '✅' : '❌' }} | Target: {{ debugStatus.targetReady ? '✅' : '❌' }} | Method: {{ debugStatus.accessMethod }}</span>
          </div>
          <div class="status-item">
            <span class="label">Refs:</span>
            <span class="value">CamRef: {{ debugStatus.cameraRef ? '✅' : '❌' }} | CtrlRef: {{ debugStatus.orbitControlsRef ? '✅' : '❌' }}</span>
          </div>
        </div>

        <!-- Preset Buttons -->
        <div class="presets-section">
          <div class="section-title">Quick Presets</div>
          <div class="presets-grid">
            <button v-for="(preset, index) in availablePresets" :key="preset.id" class="preset-btn" :class="{ 
                active: currentPreset === preset.id
              }" :disabled="!canUsePresets" @click="applyPreset(preset)">
              <div class="preset-header">
                <div class="preset-icon">{{ preset.icon }}</div>
                <div class="preset-shortcut">{{ index + 1 }}</div>
              </div>
              <div class="preset-info">
                <div class="preset-name">{{ preset.name }}</div>
                <div class="preset-description">{{ preset.description }}</div>
                <div class="preset-duration">{{ preset.transition }}ms</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Reset Button -->
        <div class="reset-section">
          <button class="reset-btn" :disabled="!canUsePresets" @click="resetCamera">
            🏠 Reset to Default
          </button>
        </div>

        <!-- Usage Instructions -->
        <div class="instructions-section">
          <div class="section-title">Controls & Shortcuts</div>
          <div class="instructions">
            <div class="instruction-item">
              <span class="instruction-icon">🖱️</span>
              <span class="instruction-text">Click any preset to switch camera view</span>
            </div>
            <div class="instruction-item">
              <span class="instruction-icon">⌨️</span>
              <span class="instruction-text">Press 1-6 for quick preset selection</span>
            </div>
            <div class="instruction-item">
              <span class="instruction-icon">🔄</span>
              <span class="instruction-text">Press R to reset to default view</span>
            </div>
            <div class="instruction-item">
              <span class="instruction-icon">⏭️</span>
              <span class="instruction-text">ESC to close this panel</span>
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

.presets-toggle:hover:not(:disabled) {
  background: rgba(0, 204, 255, 0.1);
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
}

.presets-toggle.active {
  background: rgba(0, 204, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 204, 255, 0.5);
}

.presets-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.presets-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 480px;
  max-height: 70vh;
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

.presets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.4);
  background: linear-gradient(135deg, rgba(0, 204, 255, 0.15), rgba(0, 150, 200, 0.1));
}

.presets-header h3 {
  margin: 0;
  color: #66ddff;
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

.presets-content {
  padding: 18px;
}

/* Current Status */
.current-status {
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.25);
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
  color: #99ddff;
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
  color: #00ccff;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(0, 204, 255, 0.4);
  border-left: 3px solid #00ccff;
  padding-left: 8px;
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  padding: 14px;
  background: rgba(0, 204, 255, 0.05);
  border: 1px solid rgba(0, 204, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  text-align: left;
  min-height: 100px;
}

.preset-btn:hover:not(:disabled) {
  background: rgba(0, 204, 255, 0.15);
  border-color: rgba(0, 204, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 204, 255, 0.2);
}

.preset-btn.active {
  background: rgba(0, 204, 255, 0.25);
  border-color: rgba(0, 204, 255, 0.6);
  box-shadow: 0 0 15px rgba(0, 204, 255, 0.4);
}

.preset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.preset-icon {
  font-size: 22px;
}

.preset-shortcut {
  background: rgba(0, 204, 255, 0.2);
  color: #66ddff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  min-width: 16px;
  text-align: center;
}

.preset-info {
  flex-grow: 1;
}

.preset-name {
  color: #66ddff;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}

.preset-description {
  color: #99ccff;
  font-size: 11px;
  opacity: 0.9;
  margin-bottom: 4px;
  line-height: 1.3;
}

.preset-duration {
  color: #99bbff;
  font-size: 10px;
  opacity: 0.7;
  font-style: italic;
}

/* Reset Section */
.reset-section {
  margin-bottom: 18px;
  text-align: center;
}

.reset-btn {
  background: rgba(0, 12, 20, 0.8);
  border: 1px solid rgba(0, 204, 255, 0.4);
  color: #66ddff;
  padding: 10px 20px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn:hover:not(:disabled) {
  background: rgba(0, 204, 255, 0.1);
  border-color: rgba(0, 204, 255, 0.6);
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Instructions */
.instructions-section {
  border-top: 1px solid rgba(0, 204, 255, 0.25);
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
  background: rgba(0, 204, 255, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(0, 204, 255, 0.1);
}

.instruction-icon {
  margin-right: 8px;
  font-size: 12px;
}

.instruction-text {
  color: #99ccff;
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
  background: rgba(0, 204, 255, 0.5);
  border-radius: 3px;
}

.presets-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 204, 255, 0.7);
}
</style>
