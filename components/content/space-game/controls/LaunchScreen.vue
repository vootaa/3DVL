<!-- eslint-disable no-console -->
<script setup lang="ts">
import { ref, defineEmits, watch, onMounted, computed } from 'vue'
import { ResourceLoader } from '../utils/ResourceLoader'

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

const isLoadingSectionCollapsed = ref(false)
const isTechCreditsCollapsed = ref(true)

const toggleLoadingSection = () => {
  isLoadingSectionCollapsed.value = !isLoadingSectionCollapsed.value
  if (!isLoadingSectionCollapsed.value) {
    isTechCreditsCollapsed.value = true
  } 
}

const toggleTechCredits = () => {
  isTechCreditsCollapsed.value = !isTechCreditsCollapsed.value
  if (!isTechCreditsCollapsed.value) {
    isLoadingSectionCollapsed.value = true
  }
}

const allSectionsCollapsed = computed(() => {
  return isLoadingSectionCollapsed.value && isTechCreditsCollapsed.value
})

const emit = defineEmits(['launch'])

const isResourcesLoaded = ref(false)
const loadingProgress = ref(0)
const startTime = ref(0)

const loadingStats = computed(() => ResourceLoader.loadingStats)

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const milliseconds = ms % 1000
  return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`
}

const componentProgress = computed(() => {
  const stats = loadingStats.value.component
  return stats.loaded > 0 ? `${stats.loaded}/${stats.total}` : '0/0'
})

const modelProgress = computed(() => {
  const stats = loadingStats.value.model
  return stats.loaded > 0 ? `${stats.loaded}/${stats.total}` : '0/0'
})

const textureProgress = computed(() => {
  const stats = loadingStats.value.texture
  return stats.loaded > 0 ? `${stats.loaded}/${stats.total}` : '0/0'
})

const audioProgress = computed(() => {
  const stats = loadingStats.value.audio
  return stats.loaded > 0 ? `${stats.loaded}/${stats.total}` : '0/0'
})

const fontProgress = computed(() => {
  const stats = loadingStats.value.font
  return stats && stats.loaded > 0 ? `${stats.loaded}/${stats.total}` : '0/0'
})

const currentLoading = computed(() => {
  if (loadingStats.value.component.current) return `component: ${loadingStats.value.component.current}`
  if (loadingStats.value.model.current) return `model: ${loadingStats.value.model.current}`
  if (loadingStats.value.texture.current) return `texture: ${loadingStats.value.texture.current}`
  if (loadingStats.value.audio.current) return `audio: ${loadingStats.value.audio.current}`
  if (loadingStats.value.font?.current) return `font: ${loadingStats.value.font.current}`
  return 'Loading resources completed'
})

onMounted(() => {
  startTime.value = Date.now()
})

// Monitor property changes
watch(() => props.resourcesLoaded, (newVal) => {
  isResourcesLoaded.value = newVal
  if (newVal) {
    loadingProgress.value = 100 // Ensure it shows 100% when loaded
  }
})

watch(() => props.progress, (newVal) => {
  loadingProgress.value = newVal
})

const forceComplete = () => {
  console.log('Force completing resource loading')
  ResourceLoader.forceComplete()
}

const diagnoseLoading = () => {
  const report = ResourceLoader.diagnose()
  console.log('Diagnostic report:', report)
}

const launchMode = (mode: 'battle' | 'explore') => {
  emit('launch', mode)
}
</script>

<template>
  <div class="launch-screen">
    <div class="content" :class="{ 'all-collapsed': allSectionsCollapsed }">
      <h1>Space Game</h1>
      <h2 class="subtitle">
        A Web3D gaming & visualization of the Kadena Chainweb braided structure
        <span class="fold-button" @click.stop="toggleLoadingSection">
          {{ isLoadingSectionCollapsed ? '[+]' : '[-]' }}
        </span>
      </h2>

      <!-- Progress section -->
      <div class="loading-section" :class="{ 'collapsed': isLoadingSectionCollapsed }">
        <div
          v-if="!isResourcesLoaded"
          class="spinner"
        />

        <div class="progress-container">
          <div class="progress-stats">
            <span class="progress-percentage">{{ loadingProgress }}%</span>
            <span class="progress-time">{{ formatTime(loadingStats.elapsedTime) }}</span>
          </div>

          <div class="progress-bar-container">
            <div
              class="progress-bar"
              :class="{ 'progress-complete': isResourcesLoaded }"
              :style="{ width: `${loadingProgress}%` }"
            />
          </div>

          <div class="current-resource">
            {{ currentLoading }}
          </div>

          <div class="resource-type-stats">
            <div class="resource-type component">
              <span class="resource-label">component:</span>
              <span class="resource-count">{{ componentProgress }}</span>
            </div>
            <div class="resource-type model">
              <span class="resource-label">model:</span>
              <span class="resource-count">{{ modelProgress }}</span>
            </div>
            <div class="resource-type texture">
              <span class="resource-label">texture:</span>
              <span class="resource-count">{{ textureProgress }}</span>
            </div>
            <div class="resource-type audio">
              <span class="resource-label">audio:</span>
              <span class="resource-count">{{ audioProgress }}</span>
            </div>
            <div class="resource-type font">
              <span class="resource-label">font:</span>
              <span class="resource-count">{{ fontProgress }}</span>
            </div>
            <div class="resource-type empty">
            </div>
          </div>

          <div
            v-if="ResourceLoader.loadingErrors.length > 0"
            class="loading-errors"
          >
            <span class="error-count">{{ ResourceLoader.loadingErrors.length }} resources failed to load</span>
            <button
              class="error-button"
              @click="diagnoseLoading"
            >
              Diagnose
            </button>
          </div>

          <div
            v-if="loadingProgress >= 85 && !isResourcesLoaded && loadingStats.elapsedTime > 10000"
            class="stuck-loading"
          >
            <button
              class="force-button"
              @click="forceComplete"
            >
              continue loading
            </button>
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
          :class="{ 'centered': allSectionsCollapsed }"
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
      <div class="tech-stack" :class="{ 'collapsed': isTechCreditsCollapsed }">
        <div class="stack-title">
          Technology Stack:
        </div>
        <div class="tech-badges primary">
          <span class="tech-badge">Vue 3</span>
          <span class="tech-badge">Three.js</span>
          <span class="tech-badge">Nuxt</span>
          <span class="tech-badge">WebGL/GLSL</span>
        </div>
        <div class="tech-badges secondary">
          <span class="tech-badge framework">
            TresJS: Vue port of React Three Fiber
          </span>
        </div>
      </div>

      <!-- Tech & Credits toggle button -->
      <div class="tech-credits-toggle" @click="toggleTechCredits">
        <span class="fold-button">
          {{ isTechCreditsCollapsed ? '[+] Technology Stacks & Credits' : '[-] Technology Stacks & Credits' }}
        </span>
      </div>

      <!-- Credits footer -->
      <div class="credits" :class="{ 'collapsed': isTechCreditsCollapsed }">
        <p>Developed by Vootaa Labs</p>
        <p class="credit-note">
          Based on 0xca0a's R3F game prototype
        </p>
        <p class="credit-tools">
          AI-assisted: GitHub Copilot & Claude Sonnet
        </p>
        <p class="credit-fonts">
          Fonts: Kode Mono & Teko
        </p>
      </div>

      <!-- Hidden debug controls -->
      <div class="debug-controls">
        <button
          class="debug-button"
          @click="diagnoseLoading"
        >
          Debug
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
  pointer-events: none; /* Allow mouse events to pass through background area */
}

.content {
  pointer-events: auto; /* Restore mouse events for content area */
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
  margin-bottom: 0.1em;
  text-shadow: 0 0 10px rgba(100, 149, 237, 0.7);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 1em;
  margin-top: 0;
  margin-bottom: 1em;
  color: #8bb8ff;
  font-weight: 100;
  letter-spacing: 0.5px;
  text-shadow: 0 0 5px rgba(100, 149, 237, 0.5);
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 10px;
}

.progress-container {
  width: 100%;
  max-width: 400px;
  margin-top: 10px;
  margin-bottom: 20px;
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
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
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
  background: linear-gradient(to right, #4169e1, #6495ed);
  box-shadow: 0 0 8px rgba(100, 149, 237, 0.4);
  opacity: 0.7;
  transition: opacity 1s ease-out, width 0.3s ease-out;
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
  gap: 3em;
  margin-bottom: 40px;
  transition: margin 0.3s ease;
}

.buttons.centered {
  margin: auto 0;
  padding: 40px 0;
}

.content.all-collapsed {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.content.all-collapsed h1 {
  margin-top: 30px;
  margin-bottom: 10px;
}

.content.all-collapsed .subtitle {
  margin-bottom: 20px;
}

.content.all-collapsed .tech-credits-toggle {
  margin-top: 20px;
}

.btn {
  padding: 16px 32px;
  font-size: 1.5em;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  min-width: 150px;
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
  margin-bottom: 25px;
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
  background-color: rgba(100, 149, 237, 0.1);
  border: 1px solid rgba(100, 149, 237, 0.3);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8em;
  color: #8bb8ff;
  font-weight: 500;
}

.tech-badge.framework {
  background-color: rgba(100, 149, 237, 0.1);
  border: 1px solid rgba(100, 149, 237, 0.3);
  color: #8bb8ff;
  padding: 6px 12px;
  font-size: 0.8em;
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
  font-size: 0.85em;
  margin-top: 5px;
  font-style: italic;
}

.credit-tools {
  font-size: 0.8em;
  margin-top: 5px;
  color: #aaa;
}

.credit-fonts {
  font-size: 0.8em;
  margin-top: 8px;
  color: #aaa;
}

.current-resource {
  font-size: 0.9em;
  color: #6495ed;
  text-align: center;
  margin-top: 8px;
  min-height: 1.5em;
  font-family: 'Kode Mono', monospace;
}

.resource-type-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, auto);
  gap: 8px;
  margin-top: 15px;
  margin-bottom: 10px;
}

.resource-type {
  display: flex;
  justify-content: space-between;
  padding: 3px 8px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.resource-label {
  color: rgba(170, 170, 170, 0.7);
  font-size: 0.85em;
}

.resource-count {
  color: rgba(100, 149, 237, 0.8);
  font-weight: 500;
  font-size: 0.85em;
}

.component,
.model,
.texture,
.audio
.font {
  border-color: rgba(100, 149, 237, 0.15);
}

.loading-errors {
  margin-top: 12px;
  padding: 5px;
  background-color: rgba(255, 50, 50, 0.1);
  border: 1px solid rgba(255, 50, 50, 0.3);
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-count {
  color: #ff6b6b;
  font-size: 0.85em;
}

.error-button {
  background: rgba(255, 50, 50, 0.2);
  border: 1px solid rgba(255, 50, 50, 0.5);
  color: #ff6b6b;
  font-size: 0.8em;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
}

.stuck-loading {
  margin-top: 12px;
  text-align: center;
}

.force-button {
  background: rgba(100, 149, 237, 0.2);
  border: 1px solid rgba(100, 149, 237, 0.5);
  color: #6495ed;
  font-size: 0.9em;
  padding: 4px 12px;
  border-radius: 3px;
  cursor: pointer;
}

.debug-controls {
  position: absolute;
  bottom: 5px;
  right: 5px;
  opacity: 0.3;
}

.debug-button {
  font-size: 10px;
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
}

.debug-button:hover {
  color: #6495ed;
}

.fold-button {
  display: inline-block;
  color: #6495ed;
  cursor: pointer;
  margin-left: 5px;
  font-size: 0.9em;
  font-weight: normal;
  user-select: none;
  transition: color 0.2s;
}

.fold-button:hover {
  color: #8bb8ff;
}

.tech-credits-toggle {
  text-align: center;
  margin-top: auto;
  margin-bottom: 10px;
  color: #aaa;
  cursor: pointer;
  user-select: none;
}

.tech-credits-toggle:hover .fold-button {
  color: #8bb8ff;
}

.tech-credits-toggle .fold-button {
  font-size: 0.9em;
  margin-left: 0;
}

.tech-stack.collapsed {
  height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
  opacity: 0;
}

.tech-stack {
  transition: height 0.3s, opacity 0.3s, margin 0.3s, padding 0.3s;
}

.subtitle .fold-button {
  font-size: 0.8em;
  vertical-align: middle;
}

.collapsed {
  height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
  opacity: 0;
  transition: height 0.3s, opacity 0.3s, margin 0.3s, padding 0.3s;
}

.loading-section {
  transition: height 0.3s, opacity 0.3s, margin 0.3s;
}

.credits {
  transition: height 0.3s, opacity 0.3s, margin 0.3s, padding 0.3s;
}
</style>