<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    gridControlRef: any
    trailControlRef: any
    starControlRef: any
    disabled?: boolean
}>()

const menuOpen = ref(false)

function handleMenuBtnClick() {
    menuOpen.value = !menuOpen.value
}

function toggleGrid() {
    if (props.disabled) return
    props.gridControlRef.showGrid = !props.gridControlRef.showGrid
    menuOpen.value = false
}
function toggleTrail() {
    if (props.disabled) return
    props.trailControlRef.showDriftTrails = !props.trailControlRef.showDriftTrails
    menuOpen.value = false
}
function toggleStar() {
    if (props.disabled) return
    props.starControlRef.showStars = !props.starControlRef.showStars
    menuOpen.value = false
}
</script>

<template>
  <div class="switch-menu-bar">
    <button class="menu-btn" @click="handleMenuBtnClick">
      <i class="i-carbon-switcher w-4 h-4" aria-hidden="true" />
      <span class="menu-btn-label">Switch</span>
    </button>
    <div v-if="menuOpen" class="menu-dropdown">
      <div class="menu-item" @click="toggleGrid">Grid</div>
      <div class="menu-item" @click="toggleTrail">Trail</div>
      <div class="menu-item" @click="toggleStar">Star</div>
    </div>
  </div>
</template>

<style scoped>
.switch-menu-bar {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
  background: rgba(16, 24, 40, 0.97);
  border: 1px solid #00ccff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 204, 255, 0.15);
  min-width: 160px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
</style>
