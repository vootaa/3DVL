import { ref, computed, watch } from 'vue'
import { NebulaGenerator, type NebulaData } from '../core/nebula-generator'
import { useStorage } from './useStorage'

export function useNebula(seed?: string) {
  const generator = new NebulaGenerator()
  const [savedNebulae, setSavedNebulae] = useStorage<NebulaData[]>('orbitron_nebulae', [])
  
  const currentSeed = ref(seed || '')
  const currentNebula = ref<NebulaData | null>(null)
  
  const generateNebula = (newSeed?: string) => {
    const useSeed = newSeed || currentSeed.value || Date.now().toString()
    currentSeed.value = useSeed
    currentNebula.value = generator.generateNebula(useSeed)
    return currentNebula.value
  }
  
  const saveNebula = () => {
    if (currentNebula.value) {
      const existing = savedNebulae.value.find(n => n.id === currentNebula.value!.id)
      if (!existing) {
        setSavedNebulae([...savedNebulae.value, currentNebula.value])
      }
    }
  }
  
  const removeNebula = (id: string) => {
    setSavedNebulae(savedNebulae.value.filter(n => n.id !== id))
  }
  
  const loadNebula = (nebula: NebulaData) => {
    currentNebula.value = nebula
    currentSeed.value = nebula.id
  }
  
  const nebulaCSS = computed(() => {
    return currentNebula.value ? generator.generateCSS(currentNebula.value) : ''
  })
  
  const nebulaStyle = computed(() => ({
    background: nebulaCSS.value,
    opacity: currentNebula.value?.intensity || 1
  }))
  
  // Generate initial nebula if seed provided
  if (seed) {
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
