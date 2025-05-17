<script setup lang="ts">
import { ref, defineEmits, watch, onMounted } from 'vue'

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
const loadingTime = ref(0)
const startTime = ref(0)

// Monitor property changes
watch(() => props.resourcesLoaded, (newVal) => {
  isResourcesLoaded.value = newVal
  if (newVal) {
    loadingProgress.value = 100 // Ensure it shows 100% when loaded
    loadingTime.value = Math.round((Date.now() - startTime.value) / 100) / 10
  }
})

watch(() => props.progress, (newVal) => {
  loadingProgress.value = newVal
})

onMounted(() => {
  startTime.value = Date.now()
})

const launchMode = (mode: 'battle' | 'explore') => {
  emit('launch', mode)
}
</script>

<template>
  <div class="launch-screen">
    <div class="content">
      <h1>Space Game</h1>

      <!-- Progress section - always visible -->
      <div class="loading-section">
        <div
          v-if="!isResourcesLoaded"
          class="spinner"
        />

        <div class="progress-container">
          <div class="progress-stats">
            <span class="progress-percentage">{{ loadingProgress }}%</span>
            <span class="progress-time">{{ loadingTime }}s</span>
          </div>

          <div class="progress-bar-container">
            <div
              class="progress-bar"
              :class="{ 'progress-complete': isResourcesLoaded }"
              :style="{ width: `${loadingProgress}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Buttons section -->
      <div
        v-if="isResourcesLoaded"
        class="buttons"
      >
        <button
          class="btn game-btn"
          @click="launchMode('battle')"
        >
          Battle
        </button>
        <button
          class="btn explore-btn"
          @click="launchMode('explore')"
        >
          Explore
        </button>
      </div>

      <!-- Tech Stack Section -->
      <div class="tech-stack">
        <div class="stack-title">
          Powered by:
        </div>
        <div class="tech-badges primary">
          <span class="tech-badge">Vue 3</span>
          <span class="tech-badge">Three.js</span>
          <span class="tech-badge">WebGL</span>
        </div>
        <div class="tech-badges secondary">
          <span class="tech-badge framework">TresJS</span>
          <span class="tech-badge framework">
            <span class="tech-badge-port">Ported from</span> React Three Fiber
          </span>
        </div>
      </div>

      <!-- Credits footer -->
      <div class="credits">
        <p>Developed by Vootaa Labs</p>
        <p class="credit-note">
          Based on 0xca0a's React Three Fiber game prototype
        </p>
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
  position: relative;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

h1 {
  font-size: 3em;
  margin-bottom: 1.5em;
  text-shadow: 0 0 10px rgba(100, 149, 237, 0.7);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
}

.progress-container {
  width: 100%;
  max-width: 400px;
  margin-top: 20px;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 1em;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.progress-percentage {
  color: #6495ed;
  font-weight: 700;
}

.progress-time {
  color: #aaa;
}

.progress-bar-container {
  width: 100%;
  height: 16px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(100, 149, 237, 0.3);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(to right, #4169e1, #6495ed);
  transition: width 0.3s ease-out;
  border-radius: 3px;
  box-shadow: 0 0 8px rgba(100, 149, 237, 0.7);
}

.progress-complete {
  background: linear-gradient(to right, #43c59e, #47e3b8);
  box-shadow: 0 0 12px rgba(71, 227, 184, 0.7);
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
  margin-bottom: 30px;
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

.btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(100, 149, 237, 0.7);
}

.tech-stack {
  margin-top: auto;
  margin-bottom: 35px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stack-title {
  color: #aaa;
  font-size: 0.9em;
  margin-bottom: 8px;
  font-weight: 400;
}

.tech-badges {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.tech-badges.secondary {
  margin-top: 10px;
}

.tech-badge {
  background-color: rgba(100, 149, 237, 0.2);
  border: 1px solid rgba(100, 149, 237, 0.5);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  color: #8bb8ff;
  font-weight: 500;
}

.tech-badge.framework {
  background-color: rgba(237, 100, 149, 0.2);
  border: 1px solid rgba(237, 100, 149, 0.5);
  color: #ff8bb8;
}

.tech-badge-port {
  font-size: 0.75em;
  opacity: 0.8;
  margin-right: 4px;
}

.credits {
  width: 100%;
  padding-top: 15px;
  text-align: center;
  font-size: 0.85em;
  opacity: 0.7;
  color: #ccc;
  margin-top: auto;
}

.credit-note {
  font-size: 0.9em;
  margin-top: 5px;
  font-style: italic;
}
</style>