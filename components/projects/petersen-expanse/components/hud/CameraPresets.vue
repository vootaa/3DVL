<script setup lang="ts">
import { ref, inject, computed, onMounted, onUnmounted } from 'vue'
import type { PerspectiveCamera } from 'three'
import type { Ref } from 'vue'
import { Logger } from '../../../../utils/logger'
import { OrbitControlsAccessTest } from '../../utils/orbit-controls-test'

// Responsive state
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// Check if should use compact mode based on screen size
const isCompactMode = computed(() => {
  return windowWidth.value < 768 || windowHeight.value < 600
})

// Check for ultra-compact mode (very small screens)
const isUltraCompactMode = computed(() => {
  return windowWidth.value < 480 || windowHeight.value < 400
})

// Handle window resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

// Display mode computed property
const displayMode = computed(() => {
  if (isUltraCompactMode.value) return 'ultra'
  if (isCompactMode.value) return 'compact'
  return 'full'
})

// Camera presets configuration
interface CameraPreset {
  id: string
  name: string
  shortName: string
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
    shortName: 'Over',
    description: 'Full galaxy view from above',
    position: { x: 0, y: 20, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    icon: '🌌',
    transition: 1800
  },
  {
    id: 'spiral-arm',
    name: 'Spiral Arm',
    shortName: 'Spiral',
    description: 'View from spiral arm perspective',
    position: { x: 16, y: 2, z: 16 },
    target: { x: -3, y: 0, z: -3 },
    icon: '🌀',
    transition: 1600
  },
  {
    id: 'oblique',
    name: 'Oblique',
    shortName: 'Angle',
    description: 'Balanced angled perspective',
    position: { x: 15, y: 12, z: 15 },
    target: { x: 0, y: 0, z: 0 },
    icon: '📐',
    transition: 1600
  },
  {
    id: 'side-view',
    name: 'Side View',
    shortName: 'Side',
    description: 'Galaxy profile from the side',
    position: { x: 22, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    icon: '📏',
    transition: 2000
  },
  {
    id: 'close-inspect',
    name: 'Close Inspect',
    shortName: 'Close',
    description: 'Detailed core inspection',
    position: { x: 2.5, y: 2, z: 2.5 },
    target: { x: 0, y: 0, z: 0 },
    icon: '🔍',
    transition: 1200
  },
  {
    id: 'drift-follow',
    name: 'Drift Follow',
    shortName: 'Drift',
    description: 'Follow the galaxy drift motion',
    position: { x: 8, y: 8, z: 8 },
    target: { x: 0, y: 2, z: 0 },
    icon: '🛸',
    transition: 1400
  }
]

// Component state
const currentPreset = ref<string | null>(null)

// Inject camera and controls references
const cameraRef = inject<Ref<PerspectiveCamera | null>>('camera')
const orbitControlsRef = inject<Ref<any>>('orbitControls')
const setCurrentPresetId = inject('setCurrentPresetId', (_id: string | null) => { })

// Computed properties
const availablePresets = computed(() => {
  // In ultra-compact mode, show only the first 5 presets
  if (displayMode.value === 'ultra') {
    return cameraPresets.slice(0, 5)
  }
  return cameraPresets
})

const canUsePresets = computed(() => {
  // Check if camera and controls are available
  const camera = cameraRef?.value
  const controls = orbitControlsRef?.value

  // Allow usage if camera exists and controls component exists
  // We don't need to check for target initialization here since we handle it in applyPreset
  return !!(camera && controls)
})

// Keyboard shortcuts support
const handleKeyPress = (event: KeyboardEvent) => {
  // Only handle shortcuts when panel is open
  if (!canUsePresets.value) return

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
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  window.removeEventListener('resize', handleResize)
})

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
    setCurrentPresetId(preset.id)
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
    shortName: 'Home',
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
  <div class="presets-panel unified-panel" :class="{ 
    'compact': isCompactMode, 
    'ultra-compact': isUltraCompactMode 
  }">
    <div class="presets-header">
      <h3>
        <i class="i-carbon-camera header-icon" aria-hidden="true" />
        <span v-if="displayMode === 'full'">Camera Presets</span>
        <span v-else-if="displayMode === 'compact'">Presets</span>
        <span v-else>Cam</span>
      </h3>
      <slot name="close"></slot>
    </div>
    <div class="presets-content">
      <!-- Ultra Compact Mode - 3x2 grid with 5 presets + reset -->
      <template v-if="displayMode === 'ultra'">
        <div class="ultra-compact-grid">
          <!-- Preset buttons 1-5 -->
          <button v-for="(preset, index) in availablePresets" :key="preset.id" class="preset-card-minimal" :class="{
            active: currentPreset === preset.id
          }" :disabled="!canUsePresets" @click="applyPreset(preset)" :title="preset.name">
            <span class="preset-number">{{ index + 1 }}</span>
          </button>

          <!-- Reset button in the 6th position -->
          <button class="preset-card-minimal reset-card" :disabled="!canUsePresets" @click="resetCamera"
            title="Reset Camera">
            <i class="i-carbon-home reset-icon" />
          </button>
        </div>
      </template>

      <!-- Compact Mode - Essential presets with simplified layout -->
      <template v-else-if="displayMode === 'compact'">
        <!-- Status indicator - compact -->
        <div class="status-compact">
          <span class="status-label">Status:</span>
          <span class="status-value" :style="{ color: canUsePresets ? '#00ccff' : '#4477ff' }">
            {{ canUsePresets ? 'Ready' : 'N/A' }}
          </span>
        </div>

        <!-- Preset grid - compact -->
        <div class="presets-grid compact-grid">
          <button v-for="(preset, index) in availablePresets" :key="preset.id" class="preset-btn compact" :class="{
            active: currentPreset === preset.id
          }" :disabled="!canUsePresets" @click="applyPreset(preset)">
            <div class="preset-header">
              <div class="preset-icon">{{ preset.icon }}</div>
              <div class="preset-shortcut">{{ index + 1 }}</div>
            </div>
            <div class="preset-info-compact">
              <div class="preset-name">{{ preset.shortName }}</div>
            </div>
          </button>
        </div>

        <!-- Reset button - compact with proper spacing -->
        <div class="reset-section compact">
          <button class="reset-btn compact" :disabled="!canUsePresets" @click="resetCamera">
            <i class="i-carbon-home" />
          </button>
        </div>
      </template>

      <!-- Full Mode - Complete preset interface -->
      <template v-else>
        <!-- Current Status -->
        <div class="current-status">
          <div class="status-item">
            <span class="label">Current Preset:</span>
            <span class="value">{{ currentPreset || 'Default' }}</span>
          </div>
          <div class="status-item">
            <span class="label">Controls:</span>
            <span class="value" :style="{ color: canUsePresets ? '#00ccff' : '#4477ff' }">
              {{ canUsePresets ? 'Ready' : 'Not Available' }}
            </span>
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
            <i class="i-carbon-home" />
            <span class="reset-text">Reset to Default</span>
          </button>
        </div>

        <!-- Usage Instructions -->
        <div class="instructions-section">
          <div class="section-title">Controls & Shortcuts</div>
          <div class="instructions">
            <div class="instruction-item">
              <i class="i-carbon-cursor-1 instruction-icon" aria-hidden="true" />
              <span class="instruction-text">Click any preset to switch camera view</span>
            </div>
            <div class="instruction-item">
              <i class="i-carbon-keyboard instruction-icon" aria-hidden="true" />
              <span class="instruction-text">Press 1-6 for quick preset selection</span>
            </div>
            <div class="instruction-item">
              <i class="i-carbon-reset instruction-icon" aria-hidden="true" />
              <span class="instruction-text">Press R to reset to default view</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="css" scoped>
.presets-panel.unified-panel {
  position: relative;
  width: 100%;
  max-width: 480px;
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

.presets-panel.compact {
  max-width: 320px;
  height: 350px;
  max-height: 70vh;
}

.presets-panel.ultra-compact {
  max-width: 240px;
  height: 150px;
  max-height: 50vh;
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

.compact .presets-header {
  padding: 10px 14px;
}

.ultra-compact .presets-header {
  padding: 8px 12px;
}

.presets-header h3 {
  margin: 0;
  color: #66ddff;
  font-size: 15px;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(0, 204, 255, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.compact .presets-header h3 {
  font-size: 13px;
  gap: 6px;
}

.ultra-compact .presets-header h3 {
  font-size: 11px;
  gap: 4px;
}

.header-icon {
  font-size: 16px;
  color: #00ccff;
  filter: drop-shadow(0 0 4px rgba(0, 204, 255, 0.5));
}

.compact .header-icon {
  font-size: 14px;
}

.ultra-compact .header-icon {
  font-size: 12px;
}

.presets-content {
  padding: 18px;
}

.compact .presets-content {
  padding: 12px;
}

.ultra-compact .presets-content {
  padding: 8px;
}

/* Ultra Compact Layout - 3x2 grid design */
.ultra-compact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 3px;
  margin-bottom: 0;
  height: calc(100% - 16px); /* Account for padding */
}

.preset-card-minimal {
  background: rgba(0, 204, 255, 0.08);
  border: 1px solid rgba(0, 204, 255, 0.2);
  border-radius: 3px;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  min-width: 0; /* Allow shrinking */
  min-height: 0; /* Allow shrinking */
}

.preset-card-minimal:hover:not(:disabled) {
  background: rgba(0, 204, 255, 0.15);
  border-color: rgba(0, 204, 255, 0.4);
  transform: scale(1.05);
}

.preset-card-minimal.active {
  background: rgba(0, 204, 255, 0.25);
  border-color: rgba(0, 204, 255, 0.6);
  box-shadow: 0 0 4px rgba(0, 204, 255, 0.4);
}

.preset-card-minimal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset-number {
  font-size: 12px;
  font-weight: 700;
  color: #66ddff;
  text-shadow: 0 0 3px rgba(0, 204, 255, 0.3);
}

/* Reset card styling */
.reset-card {
  background: rgba(0, 12, 20, 0.8) !important;
  border-color: rgba(0, 204, 255, 0.3) !important;
}

.reset-card:hover:not(:disabled) {
  background: rgba(0, 204, 255, 0.1) !important;
  border-color: rgba(0, 204, 255, 0.5) !important;
}

.reset-icon {
  font-size: 10px;
  color: #66ddff;
}

/* Compact Mode Status */
.status-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 6px 8px;
  background: rgba(0, 204, 255, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(0, 204, 255, 0.2);
}

.status-label {
  color: #99ddff;
  font-weight: 600;
  font-size: 11px;
}

.status-value {
  color: #ffffff;
  font-family: 'Kodo Mono', monospace;
  font-size: 11px;
  font-weight: 500;
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
  font-family: 'Kodo Mono', monospace;
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
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.compact-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
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

.preset-btn.compact {
  padding: 8px;
  min-height: 60px;
  border-radius: 6px;
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

.compact .preset-header {
  margin-bottom: 4px;
}

.preset-icon {
  font-size: 22px;
}

.compact .preset-icon {
  font-size: 18px;
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

.compact .preset-shortcut {
  font-size: 9px;
  padding: 1px 4px;
  min-width: 12px;
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

.preset-info-compact .preset-name {
  font-size: 10px;
  margin-bottom: 0;
  text-align: center;
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

/* Fix compact mode reset spacing */
.reset-section.compact {
  margin-top: 12px;
  margin-bottom: 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.reset-btn.compact {
  padding: 8px 12px;
  font-size: 10px;
  gap: 0;
}

.reset-btn i {
  font-size: 14px;
}

.reset-btn.compact i {
  font-size: 12px;
}

.reset-text {
  margin-left: 4px;
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
  color: #66ddff;
  flex-shrink: 0;
}

.instruction-text {
  color: #99ccff;
  flex-grow: 1;
}

/* Very small screens - ultra compact adjustments */
@media only screen and (max-width: 480px) {
  .presets-panel.ultra-compact {
    max-width: 200px;
    height: 120px;
  }

  .ultra-compact-grid {
    gap: 2px;
  }

  .preset-number {
    font-size: 10px;
  }

  .reset-icon {
    font-size: 8px;
  }
}

/* Extra small screens */
@media only screen and (max-width: 360px) {
  .presets-panel.ultra-compact {
    max-width: 100px;
    height: 100px;
  }

  .preset-number {
    font-size: 9px;
  }

  .reset-icon {
    font-size: 7px;
  }
}

/* Landscape phones */
@media only screen and (max-height: 480px) and (orientation: landscape) {
  .presets-panel.ultra-compact {
    height: 100px;
    max-height: 60vh;
  }
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
