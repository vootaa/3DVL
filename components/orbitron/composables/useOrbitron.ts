import { ref, reactive } from 'vue'
import { OrbitronAPI } from '../core/api'
import { createConfig, type OrbitronConfig } from '../core/config'
import type { NebulaIdentity } from '../core/identity-manager'

const api = ref<OrbitronAPI | null>(null)
const systemInfo = reactive({
  version: '',
  initialized: false,
  encryption: false,
  identityCount: 0,
  theme: {}
})

export function useOrbitron(config?: Partial<OrbitronConfig>) {
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const initialize = async (password?: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const fullConfig = createConfig(config)
      api.value = new OrbitronAPI(fullConfig)
      
      await api.value.initialize(password)
      
      const info = await api.value.getSystemInfo()
      Object.assign(systemInfo, info)
      
      isInitialized.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Initialization failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const createIdentity = async (name: string, metadata?: Record<string, any>): Promise<NebulaIdentity> => {
    if (!api.value) throw new Error('Orbitron not initialized')
    return await api.value.identity.createIdentity(name, metadata)
  }
  
  const getIdentity = async (id: string): Promise<NebulaIdentity | null> => {
    if (!api.value) throw new Error('Orbitron not initialized')
    return await api.value.identity.getIdentity(id)
  }
  
  const listIdentities = async (): Promise<NebulaIdentity[]> => {
    if (!api.value) throw new Error('Orbitron not initialized')
    return await api.value.identity.listIdentities()
  }
  
  const exportData = async (): Promise<string> => {
    if (!api.value) throw new Error('Orbitron not initialized')
    return await api.value.export()
  }
  
  const importData = async (data: string): Promise<void> => {
    if (!api.value) throw new Error('Orbitron not initialized')
    await api.value.import(data)
    
    // Refresh system info
    const info = await api.value.getSystemInfo()
    Object.assign(systemInfo, info)
  }
  
  return {
    isInitialized: readonly(isInitialized),
    isLoading: readonly(isLoading),
    error: readonly(error),
    systemInfo: readonly(systemInfo),
    api: readonly(api),
    initialize,
    createIdentity,
    getIdentity,
    listIdentities,
    exportData,
    importData
  }
}
