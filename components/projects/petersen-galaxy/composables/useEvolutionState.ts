import { reactive, computed, ref, readonly } from 'vue'

interface EvolutionState {
  // Global time for all animations
  globalTime: number
  
  // Evolution animation progress (0-1)
  evolutionProgress: number
  
  // Component states
  stellarCoreEnabled: boolean
  orbitalSystemEnabled: boolean
  
  // Animation states
  isEvolutionAnimating: boolean
  evolutionComplete: boolean
}

// Global reactive state
const state = reactive<EvolutionState>({
  globalTime: 0,
  evolutionProgress: 0,
  stellarCoreEnabled: true,
  orbitalSystemEnabled: true,
  isEvolutionAnimating: false,
  evolutionComplete: false
})

// Animation control refs
const timelineVisible = ref(false)
let globalTimeAnimationId: number | undefined

// Start global time animation
function startGlobalTime() {
  if (globalTimeAnimationId) return
  
  const startTime = performance.now()
  
  function animate(currentTime: number) {
    const elapsed = (currentTime - startTime) / 1000
    state.globalTime = elapsed
    
    globalTimeAnimationId = requestAnimationFrame(animate)
  }
  
  globalTimeAnimationId = requestAnimationFrame(animate)
}

// Stop global time animation
function stopGlobalTime() {
  if (globalTimeAnimationId) {
    cancelAnimationFrame(globalTimeAnimationId)
    globalTimeAnimationId = undefined
  }
}

export function useEvolutionState() {
  // Evolution animation controls
  function startEvolution() {
    if (state.isEvolutionAnimating) return
    
    state.isEvolutionAnimating = true
    state.evolutionComplete = false
    timelineVisible.value = true
    
    // Start global time if not running
    if (!globalTimeAnimationId) {
      startGlobalTime()
    }
  }
  
  function onEvolutionProgress(progress: number) {
    state.evolutionProgress = progress
  }
  
  function onEvolutionComplete() {
    state.isEvolutionAnimating = false
    state.evolutionComplete = true
    timelineVisible.value = false
    
    // Keep global time running after evolution completion
    // Do NOT stop global time here - orbital motion should continue
  }
  
  function resetEvolution() {
    state.evolutionProgress = 0
    state.evolutionComplete = false
    state.isEvolutionAnimating = false
    timelineVisible.value = false
    
    // Reset global time
    state.globalTime = 0
    stopGlobalTime()
    startGlobalTime()
  }
  
  // Component toggles
  function toggleStellarCore() {
    state.stellarCoreEnabled = !state.stellarCoreEnabled
  }
  
  function toggleOrbitalSystem() {
    state.orbitalSystemEnabled = !state.orbitalSystemEnabled
  }
  
  // Computed properties
  const controlsDisabled = computed(() => state.isEvolutionAnimating)
  
  return {
    // State
    evolutionState: readonly(state),
    timelineVisible: readonly(timelineVisible),
    controlsDisabled,
    
    // Evolution controls
    startEvolution,
    resetEvolution,
    onEvolutionProgress,
    onEvolutionComplete,
    
    // Component controls
    toggleStellarCore,
    toggleOrbitalSystem,
    
    // Global time controls
    startGlobalTime,
    stopGlobalTime
  }
}
