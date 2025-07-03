<script setup lang="ts">
import { ref } from 'vue'
import { Logger } from '../../../../utils/logger'

// Drift trail control state - default disabled
const showDriftTrails = ref(false)

// Toggle drift trail display
const toggleDriftTrails = () => {
  showDriftTrails.value = !showDriftTrails.value
  Logger.log('DRIFT_TRAIL_CONTROL', `Drift trails ${showDriftTrails.value ? 'enabled' : 'disabled'}`)
}

// Expose state to parent component
defineExpose({
  showDriftTrails
})
</script>

<template>
  <div class="drift-trail-control" @click="toggleDriftTrails">
    <div class="control-label">DRIFT TRAILS</div>
    <div class="control-value">{{ showDriftTrails ? 'ON' : 'OFF' }}</div>
  </div>
</template>

<style lang="css" scoped>
.drift-trail-control {
  position: absolute;
  top: 100px; /* Position below GridControl (20px + 60px + 20px margin) */
  left: 20px;
  background: rgba(0, 12, 20, 0.85);
  border: 1px solid rgba(0, 204, 255, 0.4);
  border-radius: 8px;
  padding: 10px 15px;
  color: #00CCFF;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-weight: 500;
  font-variant-numeric: slashed-zero tabular-nums;
  text-transform: uppercase;
  line-height: 1em;
  transform: skew(-0.5deg, 1.5deg) rotate(1deg);
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
  z-index: 100;
  box-shadow: 0 0 15px rgba(0, 204, 255, 0.2);
  /* Helmet concave/convex effect */
  background-image: 
    linear-gradient(45deg, rgba(0, 204, 255, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%),
    radial-gradient(circle at 70% 30%, rgba(0, 204, 255, 0.05) 0%, transparent 70%);
}

.drift-trail-control:hover {
  background: rgba(0, 20, 30, 0.9);
  border-color: rgba(0, 204, 255, 0.6);
  box-shadow: 0 0 25px rgba(0, 204, 255, 0.4);
  transform: skew(-0.5deg, 1.5deg) rotate(1deg) scale(1.02);
  /* Enhanced helmet effect on hover */
  background-image: 
    linear-gradient(45deg, rgba(0, 204, 255, 0.15) 0%, transparent 50%, rgba(0, 0, 0, 0.3) 100%),
    radial-gradient(circle at 70% 30%, rgba(0, 204, 255, 0.08) 0%, transparent 70%);
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

@media only screen and (max-width: 900px) {
  .drift-trail-control {
    padding: 8px 12px;
    width: 140px;
    min-height: 50px;
    transform: skew(-0.25deg, 1deg) rotate(0.75deg);
  }

  .control-value {
    font-size: 1.4em;
  }
}
</style>
