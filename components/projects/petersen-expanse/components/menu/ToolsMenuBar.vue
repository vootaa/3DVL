<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PerformanceMonitor from '../hud/PerformanceMonitor.vue'
import DriftMonitor from '../hud/DriftMonitor.vue'
import CameraPresets from '../hud/CameraPresets.vue'

const menuOpen = ref(false)
const activePanel = ref<'performance' | 'drift' | 'camera' | null>(null)
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

// Display mode for different screen sizes
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

function openPanel(panel: 'performance' | 'drift' | 'camera') {
  activePanel.value = panel
  menuOpen.value = false
}

function closePanel() {
  activePanel.value = null
}

function handleMenuBtnClick() {
  activePanel.value = null
  menuOpen.value = !menuOpen.value
}

// Menu button text based on screen size
const menuButtonText = computed(() => {
  switch (displayMode.value) {
    case 'ultra':
      return '' // No text in ultra mode
    case 'compact':
      return 'Tools'
    case 'full':
    default:
      return 'Tools'
  }
})

// Menu items configuration
const menuItems = computed(() => {
  return [
    {
      key: 'performance',
      icon: 'i-carbon-flash',
      text: displayMode.value === 'ultra' ? '' : 'Performance',
      shortText: displayMode.value === 'compact' ? 'Perf' : 'Performance'
    },
    {
      key: 'drift',
      icon: 'i-carbon-search',
      text: displayMode.value === 'ultra' ? '' : 'Drift Monitor',
      shortText: displayMode.value === 'compact' ? 'Drift' : 'Drift Monitor'
    },
    {
      key: 'camera',
      icon: 'i-carbon-camera',
      text: displayMode.value === 'ultra' ? '' : 'Camera Presets',
      shortText: displayMode.value === 'compact' ? 'Camera' : 'Camera Presets'
    }
  ]
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="tools-menu-bar" :class="{
    'compact': isCompactMode,
    'ultra-compact': isUltraCompactMode
  }">
    <button class="menu-btn" @click="handleMenuBtnClick">
      <i class="i-carbon-tools w-4 h-4" aria-hidden="true" />
      <span class="menu-btn-label" v-if="menuButtonText">{{ menuButtonText }}</span>
    </button>
    
    <div v-if="menuOpen" class="menu-dropdown" :class="displayMode">
      <div 
        v-for="item in menuItems" 
        :key="item.key"
        class="menu-item" 
        @click="openPanel(item.key as 'performance' | 'drift' | 'camera')"
      >
        <span class="menu-icon">
          <i :class="item.icon" aria-hidden="true" />
        </span>
        <span class="menu-text" v-if="displayMode !== 'ultra'">
          {{ displayMode === 'compact' ? item.shortText : item.text }}
        </span>
      </div>
    </div>
    
    <div v-if="activePanel" class="panel-wrapper" :class="{
      'compact': isCompactMode,
      'ultra-compact': isUltraCompactMode
    }">
      <client-only>
        <PerformanceMonitor v-if="activePanel === 'performance'">
          <template #close>
            <button class="close-btn" @click="closePanel">×</button>
          </template>
        </PerformanceMonitor>
      </client-only>
      <DriftMonitor v-if="activePanel === 'drift'">
        <template #close>
          <button class="close-btn" @click="closePanel">×</button>
        </template>
      </DriftMonitor>
      <CameraPresets v-if="activePanel === 'camera'">
        <template #close>
          <button class="close-btn" @click="closePanel">×</button>
        </template>
      </CameraPresets>
    </div>
  </div>
</template>

<style scoped>
.tools-menu-bar {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.tools-menu-bar.compact {
  top: 15px;
  right: 15px;
}

.tools-menu-bar.ultra-compact {
  top: 10px;
  right: 10px;
}

.menu-btn {
  background: rgba(0, 12, 20, 0.9);
  border: 1px solid #00ccff;
  color: #00ccff;
  border-radius: 6px;
  font-family: inherit;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  width: auto;
  height: 38px;
  padding: 0 18px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 204, 255, 0.1);
}

.compact .menu-btn {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  gap: 0.3em;
  border-radius: 5px;
}

.ultra-compact .menu-btn {
  height: 28px;
  padding: 0 8px;
  font-size: 11px;
  gap: 0.2em;
  border-radius: 4px;
  min-width: 28px;
}

.compact .menu-btn i {
  font-size: 1.1em;
}

.ultra-compact .menu-btn i {
  font-size: 1em;
}

.menu-btn i {
  font-size: 1.3em;
  vertical-align: middle;
}

.menu-btn-label {
  margin-left: 0.5em;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #00ccff;
}

.compact .menu-btn-label {
  font-size: 12px;
  margin-left: 0.3em;
}

.ultra-compact .menu-btn-label {
  font-size: 10px;
  margin-left: 0.2em;
}

.menu-btn:hover {
  background: rgba(0, 204, 255, 0.1);
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
  transform: translateY(-1px);
}

.ultra-compact .menu-btn:hover {
  transform: scale(1.05);
}

.menu-dropdown {
  margin-top: 8px;
  background: rgba(0, 8, 16, 0.97);
  border: 1px solid #00ccff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 204, 255, 0.15);
  min-width: 160px;
  overflow: hidden;
  backdrop-filter: blur(8px);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-dropdown.compact {
  margin-top: 6px;
  min-width: 120px;
  border-radius: 6px;
}

.menu-dropdown.ultra {
  margin-top: 4px;
  min-width: 32px;
  border-radius: 4px;
}

.menu-item {
  padding: 12px 20px;
  color: #00ccff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(0, 204, 255, 0.1);
}

.menu-item:last-child {
  border-bottom: none;
}

.compact .menu-item {
  padding: 8px 12px;
  font-size: 12px;
  gap: 6px;
}

.ultra-compact .menu-item {
  padding: 6px 8px;
  font-size: 11px;
  gap: 0;
  justify-content: center;
}

.menu-item:hover {
  background: rgba(0, 204, 255, 0.15);
  transform: translateX(2px);
}

.ultra-compact .menu-item:hover {
  transform: scale(1.1);
}

.menu-icon {
  display: flex;
  align-items: center;
  font-size: 1.1em;
  flex-shrink: 0;
  color: #66ddff;
}

.compact .menu-icon {
  font-size: 1.2em;
}

.ultra-compact .menu-icon {
  font-size: 1.3em;
}

.menu-text {
  display: block;
  flex: 1;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.compact .menu-text {
  font-size: 11px;
  font-weight: 600;
}

.panel-wrapper {
  margin-top: 12px;
  position: relative;
  width: 400px;
  height: 400px;
  background: none;
}

.panel-wrapper.compact {
  margin-top: 8px;
  width: 320px;
  height: 320px;
}

.panel-wrapper.ultra-compact {
  margin-top: 6px;
  width: 240px;
  height: 240px;
}

.close-btn {
  background: none;
  border: none;
  color: #00ccff;
  font-size: 22px;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 10px;
  transition: all 0.2s ease;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.compact .close-btn {
  font-size: 18px;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
}

.ultra-compact .close-btn {
  font-size: 16px;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
  box-shadow: 0 0 8px rgba(0, 204, 255, 0.3);
}

/* Very small screens */
@media only screen and (max-width: 480px) {
  .tools-menu-bar {
    top: 10px;
    right: 10px;
  }
  
  .menu-btn {
    height: 28px;
    padding: 0 8px;
    font-size: 11px;
  }
  
  .menu-btn i {
    font-size: 1em;
  }
  
  .menu-dropdown {
    min-width: 32px;
  }
  
  .menu-item {
    padding: 6px 8px;
    font-size: 11px;
  }
  
  .panel-wrapper {
    width: 240px;
    height: 240px;
  }

  .close-btn {
    font-size: 16px;
    width: 20px;
    height: 20px;
    top: 6px;
    right: 6px;
  }
}

/* Landscape phones */
@media only screen and (max-height: 480px) and (orientation: landscape) {
  .tools-menu-bar {
    top: 8px;
    right: 8px;
  }

  .tools-menu-bar.compact {
    top: 6px;
    right: 6px;
  }

  .tools-menu-bar.ultra-compact {
    top: 4px;
    right: 4px;
  }

  .panel-wrapper {
    height: 200px;
  }

  .panel-wrapper.compact {
    height: 180px;
  }

  .panel-wrapper.ultra-compact {
    height: 160px;
  }
}

/* Very small screens */
@media only screen and (max-width: 400px) {
  .menu-btn {
    height: 24px;
    padding: 0 6px;
    font-size: 10px;
    min-width: 24px;
  }

  .menu-btn i {
    font-size: 0.9em;
  }

  .menu-dropdown {
    min-width: 28px;
  }

  .menu-item {
    padding: 4px 6px;
    font-size: 10px;
  }

  .menu-icon {
    font-size: 1.1em;
  }

  .panel-wrapper {
    width: 200px;
    height: 200px;
  }

  .close-btn {
    font-size: 14px;
    width: 18px;
    height: 18px;
    top: 4px;
    right: 4px;
  }
}
</style>