<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  gridOn: boolean
  disabled?: boolean
  onToggleGrid: () => void
  bandedCylinderOn: boolean
  onToggleBandedCylinder: () => void
  chainwebSimpleOn: boolean
  onToggleChainweb: () => void
  concentricBaseOn: boolean
  onToggleConcentricBase: () => void
  firstPersonOn: boolean
  onToggleFirstPerson: () => void
}>()

const menuOpen = ref(false)
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

function handleMenuBtnClick() {
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
  <div class="switch-menu-bar" :class="{ 'compact': isCompactMode }">
    <button class="menu-btn" @click="handleMenuBtnClick" :disabled="props.disabled">
      <i class="i-carbon-switcher w-4 h-4" aria-hidden="true" />
      <span class="menu-btn-label" v-if="!isCompactMode">Switcher</span>
    </button>
    <div v-if="menuOpen" class="menu-dropdown">
      <div class="menu-item" :class="{ disabled: props.disabled }" :tabindex="props.disabled ? -1 : 0"
        :aria-disabled="props.disabled" @click="!props.disabled && props.onToggleGrid()">
        <span class="menu-status">
          <i v-if="props.gridOn" class="i-carbon-checkmark-filled"></i>
          <i v-else class="i-carbon-close"></i>
        </span>
        <span class="menu-text">{{ isCompactMode ? 'Grid' : 'Grid Helper' }}</span>
      </div>
      <div class="menu-item" :class="{ disabled: props.disabled }" :tabindex="props.disabled ? -1 : 0"
        :aria-disabled="props.disabled" @click="!props.disabled && props.onToggleBandedCylinder()">
        <span class="menu-status">
          <i v-if="props.bandedCylinderOn" class="i-carbon-checkmark-filled"></i>
          <i v-else class="i-carbon-close"></i>
        </span>
        <span class="menu-text">{{ isCompactMode ? 'Auroras' : 'Auroras Core' }}</span>
      </div>
      <div class="menu-item" :class="{ disabled: props.disabled }" :tabindex="props.disabled ? -1 : 0"
        :aria-disabled="props.disabled" @click="!props.disabled && props.onToggleChainweb()">
        <span class="menu-status">
          <i v-if="props.chainwebSimpleOn" class="i-carbon-checkmark-filled"></i>
          <i v-else class="i-carbon-close"></i>
        </span>
        <span class="menu-text">{{ isCompactMode ? 'Chainweb' : 'Chainweb 3D' }}</span>
      </div>
      <div class="menu-item" :class="{ disabled: props.disabled }" :tabindex="props.disabled ? -1 : 0"
        :aria-disabled="props.disabled" @click="!props.disabled && props.onToggleConcentricBase()">
        <span class="menu-status">
          <i v-if="props.concentricBaseOn" class="i-carbon-checkmark-filled"></i>
          <i v-else class="i-carbon-close"></i>
        </span>
        <span class="menu-text">{{ isCompactMode ? 'Base' : 'Auroras Base' }}</span>
      </div>
      <div class="menu-item" :class="{ disabled: props.disabled }" :tabindex="props.disabled ? -1 : 0"
        :aria-disabled="props.disabled" @click="!props.disabled && props.onToggleFirstPerson()">
        <span class="menu-status">
          <i v-if="props.firstPersonOn" class="i-carbon-checkmark-filled"></i>
          <i v-else class="i-carbon-close"></i>
        </span>
        <span class="menu-text">{{ isCompactMode ? 'Roam' : 'First Person Roam' }}</span>
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

.switch-menu-bar.compact {
  top: 15px;
  left: 15px;
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

.compact .menu-dropdown {
  margin-top: 6px;
  min-width: 120px;
  border-radius: 6px;
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

.compact .menu-item {
  padding: 8px 12px;
  font-size: 12px;
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

.compact .menu-status {
  margin-right: 6px;
  font-size: 1em;
}

.menu-text {
  flex: 1;
}

/* Very small screens */
@media only screen and (max-width: 480px) {
  .switch-menu-bar {
    top: 10px;
    left: 10px;
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
    min-width: 100px;
  }
  
  .menu-item {
    padding: 6px 8px;
    font-size: 11px;
  }
}
</style>
