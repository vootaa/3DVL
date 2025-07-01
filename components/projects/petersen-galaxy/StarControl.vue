<script setup lang="ts">
import { ref } from 'vue'

// Star cluster control state
const showStars = ref(true)
const showStarInfo = ref(false)

// Star cluster statistics
const starStats = {
  total: 20,
  mainSequence: 5,
  blueGiants: 5,
  redGiants: 10,
  orbits: 3
}

// Toggle star cluster display
const toggleStars = () => {
  showStars.value = !showStars.value
}

// Toggle info display
const toggleInfo = () => {
  showStarInfo.value = !showStarInfo.value
}

// Expose state to parent component
defineExpose({
  showStars,
  showStarInfo
})
</script>

<template>
  <div class="star-control-panel">
    <!-- Control buttons -->
    <div class="control-buttons">
      <button 
        @click="toggleStars"
        :class="{ active: showStars }"
        class="control-btn star-toggle"
      >
        {{ showStars ? 'Hide Stars' : 'Show Stars' }}
      </button>
      
      <button 
        @click="toggleInfo"
        :class="{ active: showStarInfo }"
        class="control-btn info-toggle"
      >
        {{ showStarInfo ? 'Hide Info' : 'Star Info' }}
      </button>
    </div>
    
    <!-- Star information panel -->
    <div v-show="showStarInfo" class="star-info-panel">
      <h3>Star Cluster Info</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Total Stars:</span>
          <span class="value">{{ starStats.total }}</span>
        </div>
        <div class="info-item">
          <span class="label">Orbits:</span>
          <span class="value">{{ starStats.orbits }}</span>
        </div>
        <div class="info-item inner">
          <span class="label">Inner Orbit (Main Sequence):</span>
          <span class="value">{{ starStats.mainSequence }}</span>
        </div>
        <div class="info-item middle">
          <span class="label">Middle Orbit (Blue Giants):</span>
          <span class="value">{{ starStats.blueGiants }}</span>
        </div>
        <div class="info-item outer">
          <span class="label">Outer Orbit (Red Giants):</span>
          <span class="value">{{ starStats.redGiants }}</span>
        </div>
      </div>
      
      <div class="legend">
        <h4>Star Type Description</h4>
        <div class="legend-item">
          <div class="color-box main-sequence"></div>
          <span>Main Sequence - Stable hydrogen burning phase</span>
        </div>
        <div class="legend-item">
          <div class="color-box blue-giant"></div>
          <span>Blue Giant - High mass, high temperature stars</span>
        </div>
        <div class="legend-item">
          <div class="color-box red-giant"></div>
          <span>Red Giant - Late evolutionary stage massive stars</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.star-control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(0, 8, 17, 0.9);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(0, 120, 255, 0.3);
  backdrop-filter: blur(10px);
  color: #ffffff;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  min-width: 250px;
}

.control-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.control-btn {
  padding: 8px 16px;
  border: 1px solid rgba(135, 206, 235, 0.5);
  background: rgba(135, 206, 235, 0.1);
  color: #87ceeb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  font-weight: 500;
}

.control-btn:hover {
  background: rgba(135, 206, 235, 0.2);
  border-color: rgba(135, 206, 235, 0.8);
}

.control-btn.active {
  background: rgba(135, 206, 235, 0.3);
  border-color: #87ceeb;
  color: #ffffff;
}

.star-info-panel {
  animation: fadeIn 0.3s ease;
}

.star-info-panel h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #87ceeb;
  border-bottom: 1px solid rgba(135, 206, 235, 0.3);
  padding-bottom: 6px;
}

.info-grid {
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
}

.info-item.inner {
  border-left: 3px solid #ffd700;
}

.info-item.middle {
  border-left: 3px solid #87ceeb;
}

.info-item.outer {
  border-left: 3px solid #ff4500;
}

.label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.value {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
}

.legend h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.color-box {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.color-box.main-sequence {
  background: #ffd700;
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
}

.color-box.blue-giant {
  background: #87ceeb;
  box-shadow: 0 0 4px rgba(135, 206, 235, 0.5);
}

.color-box.red-giant {
  background: #ff4500;
  box-shadow: 0 0 4px rgba(255, 69, 0, 0.5);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
