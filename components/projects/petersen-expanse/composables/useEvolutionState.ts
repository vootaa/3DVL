import { reactive, computed, ref, readonly } from 'vue'

interface EvolutionState {
  globalTime: number
  evolutionProgress: number
  stellarCoreEnabled: boolean
  orbitalSystemEnabled: boolean
  tethersEnabled: boolean
  isEvolutionAnimating: boolean
  evolutionComplete: boolean
}

const state = reactive<EvolutionState>({
  globalTime: 0,
  evolutionProgress: 0,
  stellarCoreEnabled: true,
  orbitalSystemEnabled: true,
  tethersEnabled: true,
  isEvolutionAnimating: false,
  evolutionComplete: false
})

const timelineVisible = ref(false)
let globalTimeAnimationId: number | undefined

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

function stopGlobalTime() {
  if (globalTimeAnimationId) {
    cancelAnimationFrame(globalTimeAnimationId)
    globalTimeAnimationId = undefined
  }
}

export function useEvolutionState() {
  function startEvolution() {
    if (state.isEvolutionAnimating) return
    
    state.isEvolutionAnimating = true
    state.evolutionComplete = false
    timelineVisible.value = true
    
    if (!globalTimeAnimationId) {
      startGlobalTime()
    }
  }
  
  function updateEvolutionProgress(progress: number) {
    state.evolutionProgress = progress
  }
  
  function onEvolutionComplete() {
    state.isEvolutionAnimating = false
    state.evolutionComplete = true
    timelineVisible.value = false
  }
  
  function resetEvolution() {
    state.evolutionProgress = 0
    state.evolutionComplete = false
    state.isEvolutionAnimating = false
    timelineVisible.value = false
    
    state.globalTime = 0
    stopGlobalTime()
    startGlobalTime()
  }
  
  function toggleStellarCore() {
    state.stellarCoreEnabled = !state.stellarCoreEnabled
  }
  
  function toggleOrbitalSystem() {
    state.orbitalSystemEnabled = !state.orbitalSystemEnabled
  }

  const toggleTethers = () => {
    state.tethersEnabled = !state.tethersEnabled
  }
  
  const controlsDisabled = computed(() => state.isEvolutionAnimating)
  
  return {
    state: readonly(state),
    timelineVisible: readonly(timelineVisible),
    controlsDisabled,
    
    startEvolution,
    resetEvolution,
    updateEvolutionProgress,
    onEvolutionComplete,
    
    toggleStellarCore,
    toggleOrbitalSystem,
    toggleTethers,
    
    startGlobalTime,
    stopGlobalTime
  }
}