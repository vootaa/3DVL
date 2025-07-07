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

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="tools-menu-bar" :class="{ 'compact': isCompactMode }">
    <button class="menu-btn" @click="handleMenuBtnClick">
      <i class="i-carbon-tools w-4 h-4" aria-hidden="true" />
      <span class="menu-btn-label" v-if="!isCompactMode">Tools</span>
    </button>
    <div v-if="menuOpen" class="menu-dropdown">
      <div class="menu-item" @click="openPanel('performance')">
        <span class="menu-icon">
          <i class="i-carbon-flash" aria-hidden="true" />
        </span>
        <span class="menu-text" v-if="!isCompactMode">Performance</span>
      </div>
      <div class="menu-item" @click="openPanel('drift')">
        <span class="menu-icon">
          <i class="i-carbon-search" aria-hidden="true" />
        </span>
        <span class="menu-text" v-if="!isCompactMode">Drift Monitor</span>
      </div>
      <div class="menu-item" @click="openPanel('camera')">
        <span class="menu-icon">
          <i class="i-carbon-camera" aria-hidden="true" />
        </span>
        <span class="menu-text" v-if="!isCompactMode">Camera Presets</span>
      </div>
    </div>
    <div v-if="activePanel" class="panel-wrapper" :class="{ 'compact': isCompactMode }">
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
}

.compact .menu-btn {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  gap: 0.3em;
}

.compact .menu-btn i {
  font-size: 1.1em;
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

.menu-btn:hover {
  background: rgba(0, 204, 255, 0.1);
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
}

.menu-dropdown {
  margin-top: 8px;
  background: rgba(0, 8, 16, 0.97);
  border: 1px solid #00ccff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 204, 255, 0.15);
  min-width: 160px;
  overflow: hidden;
}

.compact .menu-dropdown {
  margin-top: 6px;
  min-width: 40px;
  border-radius: 6px;
}

.menu-item {
  padding: 12px 20px;
  color: #00ccff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.compact .menu-item {
  padding: 8px;
  font-size: 12px;
  justify-content: center;
  gap: 0;
}

.menu-item:hover {
  background: rgba(0, 204, 255, 0.15);
}

.menu-icon {
  display: flex;
  align-items: center;
  font-size: 1.1em;
  flex-shrink: 0;
}

.compact .menu-icon {
  font-size: 1.2em;
}

.menu-text {
  display: block;
  flex: 1;
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
}

.compact .close-btn {
  font-size: 18px;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
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
    min-width: 36px;
  }
  
  .menu-item {
    padding: 6px;
    font-size: 11px;
  }
  
  .panel-wrapper {
    width: 280px;
    height: 280px;
  }

  .close-btn {
    font-size: 16px;
    width: 20px;
    height: 20px;
    top: 6px;
    right: 6px;
  }
}
</style>