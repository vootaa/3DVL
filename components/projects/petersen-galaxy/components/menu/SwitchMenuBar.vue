<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  gridOn: boolean
  trailOn: boolean
  starOn: boolean
  disabled?: boolean
  onToggleGrid: () => void
  onToggleTrail: () => void
  onToggleStar: () => void
}>()

const menuOpen = ref(false)

function handleMenuBtnClick() {
  menuOpen.value = !menuOpen.value
}
</script>

<template>
  <div class="switch-menu-bar">
    <button class="menu-btn" @click="handleMenuBtnClick" :disabled="props.disabled">
      <i class="i-carbon-switcher w-4 h-4" aria-hidden="true" />
      <span class="menu-btn-label">Switcher</span>
    </button>
    <div v-if="menuOpen" class="menu-dropdown">
      <div class="menu-item" :class="{ disabled: props.disabled }" :tabindex="props.disabled ? -1 : 0"
        :aria-disabled="props.disabled" @click="!props.disabled && props.onToggleGrid()">
        <span class="menu-status">
          <i v-if="props.gridOn" class="i-carbon-checkmark-filled"></i>
          <i v-else class="i-carbon-close"></i>
        </span>
        Grid Helper
      </div>
      <div class="menu-item" :class="{ disabled: props.disabled }" :tabindex="props.disabled ? -1 : 0"
        :aria-disabled="props.disabled" @click="!props.disabled && props.onToggleTrail()">
        <span class="menu-status">
          <i v-if="props.trailOn" class="i-carbon-checkmark-filled"></i>
          <i v-else class="i-carbon-close"></i>
        </span>
        Drift Trails
      </div>
      <div class="menu-item" :class="{ disabled: props.disabled }" :tabindex="props.disabled ? -1 : 0"
        :aria-disabled="props.disabled" @click="!props.disabled && props.onToggleStar()">
        <span class="menu-status">
          <i v-if="props.starOn" class="i-carbon-checkmark-filled"></i>
          <i v-else class="i-carbon-close"></i>
        </span>
        Star Cluster
      </div>
    </div>
  </div>
</template>

<style scoped>
.switch-menu-bar {
  position: fixed;
  top: 20px;
  left: 20px;
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

.menu-btn:disabled {
  background: #222c36;
  color: #7da7b8;
  border-color: #334d5c;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.7;
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
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #00ccff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: rgba(0, 204, 255, 0.15);
}

.menu-item.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

.menu-status {
  margin-right: 10px;
  font-size: 1.1em;
  vertical-align: middle;
  display: flex;
  align-items: center;
}

</style>
