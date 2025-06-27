import { ref, computed, readonly } from 'vue'
import { NebulaGenerator, type NebulaData } from '../core/nebula-generator'
import { useStorage } from './useStorage'
import { useOrbitron } from './useOrbitron'
import { Logger } from '../../utils/logger'

export function useNebula(seed?: string) {
  const generator = new NebulaGenerator()
  const { getActiveIdentity } = useOrbitron()
  
  // Use new storage key format
  const [savedNebulae, setSavedNebulae] = useStorage<NebulaData[]>('orbitron_v2_nebulae', [])
  
  const currentSeed = ref(seed || '')
  const currentNebula = ref<NebulaData | null>(null)
  
  const generateNebula = (newSeed?: string) => {
    const activeIdentity = getActiveIdentity()
    const useSeed = newSeed || currentSeed.value || activeIdentity?.nebula_id || Date.now().toString()
    
    currentSeed.value = useSeed
    currentNebula.value = generator.generateNebula(useSeed)
    
    Logger.log('useNebula', `Generated for seed: ${useSeed}`)
    return currentNebula.value
  }
  
  const saveNebula = () => {
    if (currentNebula.value) {
      const existing = savedNebulae.value.find(n => n.id === currentNebula.value!.id)
      if (!existing) {
        setSavedNebulae([...savedNebulae.value, currentNebula.value])
        Logger.log('useNebula', `Saved: ${currentNebula.value.id}`)
      }
    }
  }
  
  const removeNebula = (id: string) => {
    setSavedNebulae(savedNebulae.value.filter(n => n.id !== id))
    Logger.log('useNebula', `Removed: ${id}`)
  }
  
  const loadNebula = (nebula: NebulaData) => {
    currentNebula.value = nebula
    currentSeed.value = nebula.id
    Logger.log('useNebula', `Loaded: ${nebula.id}`)
  }
  
  const nebulaCSS = computed(() => {
    return currentNebula.value ? generator.generateCSS(currentNebula.value) : ''
  })
  
  const nebulaStyle = computed(() => ({
    background: nebulaCSS.value,
    opacity: currentNebula.value?.intensity || 1
  }))
  
  // Generate initial nebula based on active identity if available
  const activeIdentity = getActiveIdentity()
  if (activeIdentity && !currentNebula.value) {
    generateNebula(activeIdentity.nebula_id)
  } else if (seed) {
    generateNebula(seed)
  }
  
  return {
    currentNebula: readonly(currentNebula),
    currentSeed: readonly(currentSeed),
    savedNebulae: readonly(savedNebulae),
    nebulaCSS: readonly(nebulaCSS),
    nebulaStyle: readonly(nebulaStyle),
    generateNebula,
    saveNebula,
    removeNebula,
    loadNebula
  }
}
