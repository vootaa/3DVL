<script setup lang="ts">
import { ref } from 'vue'
import PerformanceMonitor from '../hud/PerformanceMonitor.vue'
import DriftMonitor from '../hud/DriftMonitor.vue'
import CameraPresets from '../hud/CameraPresets.vue'

const menuOpen = ref(false)
const activePanel = ref<'performance' | 'drift' | 'camera' | null>(null)

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
</script>

<template>
  <div class="tools-menu-bar">
    <button class="menu-btn" @click="handleMenuBtnClick">
      <i class="i-carbon-tools w-4 h-4" aria-hidden="true" />
      <span class="menu-btn-label">Tools</span>
    </button>
    <div v-if="menuOpen" class="menu-dropdown">
      <div class="menu-item" @click="openPanel('performance')">Performance</div>
      <div class="menu-item" @click="openPanel('drift')">Drift Monitor</div>
      <div class="menu-item" @click="openPanel('camera')">Camera Presets</div>
    </div>
    <div v-if="activePanel" class="panel-wrapper">
      <div class="panel-close" @click="closePanel">×</div>
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

.menu-item {
  padding: 12px 20px;
  color: #00ccff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: rgba(0, 204, 255, 0.15);
}

.panel-wrapper {
  margin-top: 12px;
  position: relative;
  width: 400px;
  height: 400px;
  background: none;
}

.panel-close {
  position: absolute;
  top: 10px;
  right: 18px;
  z-index: 2;
  color: #00ccff;
  font-size: 22px;
  cursor: pointer;
  background: none;
  border: none;
  font-weight: bold;
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
}
</style>