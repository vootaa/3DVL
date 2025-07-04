<script setup lang="ts">
const showGrid = ref(false)
defineProps<{ disabled?: boolean }>()

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

defineExpose({
  showGrid
})
</script>

<template>
  <button
    class="grid-control-btn"
    :disabled="disabled"
    :class="{ disabled }"
    @click="toggleGrid"
  >
    <div class="control-label">GRID HELPER</div>
    <div class="control-value">{{ showGrid ? 'ON' : 'OFF' }}</div>
  </button>
</template>

<style lang="css" scoped>
.grid-control-btn {
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

.grid-control-btn:hover {
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

.grid-control-btn.disabled,
.grid-control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

@media only screen and (max-width: 900px) {
  .grid-control-btn {
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
