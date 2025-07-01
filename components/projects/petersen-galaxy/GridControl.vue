<script setup lang="ts">
const showGrid = ref(true)

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

defineExpose({
  showGrid
})
</script>

<template>
  <div class="grid-control" @click="toggleGrid">
    <div class="control-label">GRID HELPER</div>
    <div class="control-value">{{ showGrid ? 'ON' : 'OFF' }}</div>
  </div>
</template>

<style lang="css" scoped>
.grid-control {
  position: absolute;
  top: 20px;
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
  transform: skew(-1deg, 3deg) rotate(2deg);
  transform-origin: center center;
  pointer-events: all;
  cursor: pointer;
  width: 180px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  transition: all 0.2s ease;
  z-index: 100;
  box-shadow: 0 0 15px rgba(0, 204, 255, 0.2);
}

.grid-control:hover {
  background: rgba(0, 20, 30, 0.9);
  border-color: rgba(0, 204, 255, 0.6);
  box-shadow: 0 0 25px rgba(0, 204, 255, 0.4);
  transform: skew(-1deg, 3deg) rotate(2deg) scale(1.02);
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
  .grid-control {
    padding: 8px 12px;
    width: 160px;
    min-height: 50px;
    transform: skew(-0.5deg, 2deg) rotate(1.5deg);
  }

  .control-value {
    font-size: 1.4em;
  }
}
</style>
