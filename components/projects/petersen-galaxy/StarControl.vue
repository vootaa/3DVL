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
  <div class="star-control-container">
    <!-- Main control panel -->
    <div class="star-control" @click="toggleStars">
      <div class="control-label">STAR CLUSTER</div>
      <div class="control-value">{{ showStars ? 'ON' : 'OFF' }}</div>
    </div>
    
    <!-- Info toggle button -->
    <div class="info-control" @click="toggleInfo">
      <div class="info-symbol">{{ showStarInfo ? '−' : '+' }}</div>
    </div>
    
    <!-- Star information panel -->
    <div v-show="showStarInfo" class="star-info-panel">
      <h3>CLUSTER DATA</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">TOTAL</span>
          <span class="info-value">{{ starStats.total }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">ORBITS</span>
          <span class="info-value">{{ starStats.orbits }}</span>
        </div>
        <div class="info-item inner">
          <span class="info-label">INNER</span>
          <span class="info-value">{{ starStats.mainSequence }}</span>
        </div>
        <div class="info-item middle">
          <span class="info-label">MIDDLE</span>
          <span class="info-value">{{ starStats.blueGiants }}</span>
        </div>
        <div class="info-item outer">
          <span class="info-label">OUTER</span>
          <span class="info-value">{{ starStats.redGiants }}</span>
        </div>
      </div>
      
      <div class="legend">
        <div class="legend-item">
          <div class="color-box main-sequence"></div>
          <span>Main Sequence</span>
        </div>
        <div class="legend-item">
          <div class="color-box blue-giant"></div>
          <span>Blue Giant</span>
        </div>
        <div class="legend-item">
          <div class="color-box red-giant"></div>
          <span>Red Giant</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.star-control-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

/* Main star control panel (mirroring GridControl) */
.star-control {
  background: rgba(0, 12, 20, 0.85);
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  padding: 10px 15px;
  color: #FFD700;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-weight: 500;
  font-variant-numeric: slashed-zero tabular-nums;
  text-transform: uppercase;
  line-height: 1em;
  transform: skew(0.5deg, -1.5deg) rotate(-1deg); /* Mirror of GridControl transform */
  transform-origin: center center;
  pointer-events: all;
  cursor: pointer;
  width: 160px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  transition: all 0.2s ease;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
  /* Helmet concave/convex effect - opposite direction from GridControl */
  background-image: 
    linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%),
    radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.05) 0%, transparent 70%);
}

.star-control:hover {
  background: rgba(20, 12, 0, 0.9);
  border-color: rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.4);
  transform: skew(0.5deg, -1.5deg) rotate(-1deg) scale(1.02);
  /* Enhanced helmet effect on hover */
  background-image: 
    linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, transparent 50%, rgba(0, 0, 0, 0.3) 100%),
    radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.08) 0%, transparent 70%);
}

.control-label {
  font-size: 0.9em;
  opacity: 0.8;
}

.control-value {
  font-size: 1.6em;
  line-height: 1em;
  margin: 2px 0;
  text-align: right;
}

/* Info toggle button */
.info-control {
  background: rgba(0, 12, 20, 0.85);
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transform: skew(0.5deg, -1.5deg) rotate(-1deg); /* Mirror GridControl transform */
  transition: all 0.2s ease;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
  /* Helmet concave effect for button */
  background-image: 
    linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, transparent 50%, rgba(0, 0, 0, 0.15) 100%),
    radial-gradient(circle at center, rgba(255, 215, 0, 0.03) 0%, transparent 70%);
}

.info-control:hover {
  background: rgba(20, 12, 0, 0.9);
  border-color: rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.4);
  transform: skew(0.5deg, -1.5deg) rotate(-1deg) scale(1.05);
  /* Enhanced helmet effect on hover */
  background-image: 
    linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%),
    radial-gradient(circle at center, rgba(255, 215, 0, 0.05) 0%, transparent 70%);
}

.info-symbol {
  color: #FFD700;
  font-family: 'Kode Mono', monospace;
  font-size: 1.5em;
  font-weight: bold;
  line-height: 1;
}

/* Info panel */
.star-info-panel {
  position: absolute;
  top: 70px;
  right: 0;
  background: rgba(0, 8, 17, 0.95);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
  color: #ffffff;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  min-width: 220px;
  animation: fadeInDown 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.star-info-panel h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #FFD700;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 6px;
  text-transform: uppercase;
  font-weight: 600;
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

.info-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}

.legend {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  font-weight: 500;
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

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media only screen and (max-width: 900px) {
  .star-control {
    padding: 8px 12px;
    width: 140px;
    min-height: 50px;
    transform: skew(0.25deg, -1deg) rotate(-0.75deg); /* Mirror responsive transform */
  }

  .control-value {
    font-size: 1.4em;
  }
  
  .info-control {
    width: 35px;
    height: 35px;
    transform: skew(0.25deg, -1deg) rotate(-0.75deg); /* Mirror responsive transform */
  }
  
  .info-symbol {
    font-size: 1.3em;
  }
}
</style>
