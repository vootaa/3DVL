<script setup lang="ts">
import { ref, defineEmits, watch } from 'vue'

// Receive loading status passed from parent component
const props = defineProps({
  resourcesLoaded: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Number,
    default: 0,
  },
})
const emit = defineEmits(['launch'])
const isResourcesLoaded = ref(false)
const loadingProgress = ref(0)

// Monitor property changes
watch(() => props.resourcesLoaded, (newVal) => {
  isResourcesLoaded.value = newVal
})

watch(() => props.progress, (newVal) => {
  loadingProgress.value = newVal
})

const launchMode = (mode: 'battle' | 'explore') => {
  emit('launch', mode)
}
</script>

<template>
  <div class="launch-screen">
    <div class="content">
      <h1>Space Game</h1>
      <div
        v-if="!isResourcesLoaded"
        class="loading"
      >
        <div class="spinner" />
        <p>Loading resources... {{ loadingProgress }}%</p>
      </div>
      <div
        v-else
        class="buttons"
      >
        <button
          class="btn game-btn"
          :disabled="!isResourcesLoaded"
          @click="launchMode('battle')"
        >
          Battle
        </button>
        <button
          class="btn explore-btn"
          :disabled="!isResourcesLoaded"
          @click="launchMode('explore')"
        >
          Explore
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.launch-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, #0a0a2a 0%, #000005 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
}

.content {
  text-align: center;
  color: #fff;
  border: 2px solid #6495ed;
  border-radius: 10px;
  padding: 40px;
  background-color: rgba(10, 10, 42, 0.7);
  box-shadow: 0 0 20px rgba(100, 149, 237, 0.5);
  backdrop-filter: blur(5px);
  max-width: 500px;
  width: 80%;
}

h1 {
  font-size: 3em;
  margin-bottom: 2em;
  text-shadow: 0 0 10px rgba(100, 149, 237, 0.7);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading p {
  font-weight: 500;
  letter-spacing: 0.5px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #6495ed;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 2em;
}

.btn {
  padding: 12px 24px;
  font-size: 1.2em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  font-family: 'Kode Mono', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.game-btn {
  background-color: #e63946;
}

.explore-btn {
  background-color: #457b9d;
}

.btn:disabled {
  background-color: #666;
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

.btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(100, 149, 237, 0.7);
}
</style>