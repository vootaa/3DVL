import type { NebulaIdentity, GameGrowthEvent, EventType, IdentityType, OrbitronConfig } from '../types'

import { ref, reactive, computed, readonly } from 'vue'
import { OrbitronCore } from '../core/orbitron-core'
import { Logger } from '../../utils/logger'

// Global instance for cross-component state sharing
let orbitronInstance: OrbitronCore | null = null

export function useOrbitron(config?: Partial<OrbitronConfig>) {
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Reactive system info
  const systemInfo = reactive({
    version: '2.0.0',
    initialized: false,
    total_identities: 0,
    active_identity: null as string | null,
    total_events: 0,
    pin_configured: false,
    system_locked: false,
    cosmion_connected: false,
    last_sync: 0
  })

  // Initialize Orbitron instance
  const initialize = async (password?: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      if (!orbitronInstance) {
        orbitronInstance = new OrbitronCore(config)
      }
      
      // Update system info
      const info = orbitronInstance.getSystemInfo()
      Object.assign(systemInfo, info)
      
      isInitialized.value = true
      Logger.log('useOrbitron', '✅ System initialization completed')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Initialization failed'
      Logger.error('useOrbitron', 'Initialization failed:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Identity Management
  const createIdentity = async (type: IdentityType = 'main'): Promise<NebulaIdentity> => {
    if (!orbitronInstance) throw new Error('Orbitron not initialized')
    const identity = await orbitronInstance.createIdentity(type)
    updateSystemInfo()
    return identity
  }

  const listIdentities = async (): Promise<NebulaIdentity[]> => {
    if (!orbitronInstance) throw new Error('Orbitron not initialized')
    return orbitronInstance.getAllIdentities()
  }

  const getActiveIdentity = (): NebulaIdentity | null => {
    if (!orbitronInstance) return null
    return orbitronInstance.getActiveIdentity()
  }

  const activateIdentity = async (nebulaId: string): Promise<boolean> => {
    if (!orbitronInstance) throw new Error('Orbitron not initialized')
    const success = await orbitronInstance.activateIdentity(nebulaId)
    if (success) updateSystemInfo()
    return success
  }

  const deleteIdentity = async (nebulaId: string): Promise<boolean> => {
    if (!orbitronInstance) throw new Error('Orbitron not initialized')
    const success = await orbitronInstance.deleteIdentity(nebulaId)
    if (success) updateSystemInfo()
    return success
  }

  const importIdentity = async (identityJson: string): Promise<NebulaIdentity> => {
    if (!orbitronInstance) throw new Error('Orbitron not initialized')
    const identity = await orbitronInstance.importIdentity(identityJson)
    updateSystemInfo()
    return identity
  }

  const exportIdentity = async (nebulaId: string): Promise<string> => {
    if (!orbitronInstance) throw new Error('Orbitron not initialized')
    return orbitronInstance.exportIdentity(nebulaId)
  }

  // PIN Management
  const setupPin = async (pin: string): Promise<void> => {
    if (!orbitronInstance) throw new Error('Orbitron not initialized')
    await orbitronInstance.setupPin(pin)
    updateSystemInfo()
  }

  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!orbitronInstance) throw new Error('Orbitron not initialized')
    const success = await orbitronInstance.verifyPin(pin)
    updateSystemInfo()
    return success
  }

  const lock = async (): Promise<void> => {
    if (!orbitronInstance) throw new Error('Orbitron not initialized')
    await orbitronInstance.lock()
    updateSystemInfo()
  }

  const removePin = async (currentPin: string): Promise<void> => {
    if (!orbitronInstance) throw new Error('Orbitron not initialized')
    await orbitronInstance.removePin(currentPin)
    updateSystemInfo()
  }

  // Game Growth Recording
  const recordGameGrowth = async (
    experiment: string,
    eventType: EventType,
    action: string,
    growthData: Record<string, any> = {}
  ): Promise<GameGrowthEvent | null> => {
    if (!orbitronInstance) return null
    
    const activeIdentity = orbitronInstance.getActiveIdentity()
    if (!activeIdentity) return null
    
    return await orbitronInstance.recordGameGrowth(
      activeIdentity.nebula_id,
      experiment,
      eventType,
      action,
      growthData
    )
  }

  const startNewSession = (): string => {
    if (!orbitronInstance) throw new Error('Orbitron not initialized')
    return orbitronInstance.startNewSession()
  }

  const getGrowthEvents = (nebulaId?: string): GameGrowthEvent[] => {
    if (!orbitronInstance) return []
    return orbitronInstance.getGrowthEvents(nebulaId)
  }

  // Cosmion Sync
  const syncToCosmion = async (): Promise<{
    identities_synced: number
    events_synced: number
    success: boolean
  }> => {
    if (!orbitronInstance) throw new Error('Orbitron not initialized')
    const result = await orbitronInstance.syncToCosmion()
    updateSystemInfo()
    return result
  }

  // Utility function to update system info
  const updateSystemInfo = () => {
    if (orbitronInstance) {
      const info = orbitronInstance.getSystemInfo()
      Object.assign(systemInfo, info)
    }
  }

  // Auto-initialize if not already done
  if (!isInitialized.value && !isLoading.value) {
    initialize().catch(err => Logger.error('useOrbitron', 'Auto-initialization failed', err))
  }

  return {
    // State
    isInitialized: readonly(isInitialized),
    isLoading: readonly(isLoading),
    error: readonly(error),
    systemInfo: readonly(systemInfo),
    
    // Core functions
    initialize,
    
    // Identity management
    createIdentity,
    listIdentities,
    getActiveIdentity,
    activateIdentity,
    deleteIdentity,
    importIdentity,
    exportIdentity,
    
    // PIN management
    setupPin,
    verifyPin,
    lock,
    removePin,
    
    // Game growth recording
    recordGameGrowth,
    startNewSession,
    getGrowthEvents,
    
    // Cosmion sync
    syncToCosmion,
    
    // Utilities
    updateSystemInfo
  }
}

// Simplified global interface for experiments
export function useGlobalOrbitron() {
  const orbitron = useOrbitron()
  
  const isReady = computed(() => 
    orbitron.isInitialized.value && 
    !orbitron.systemInfo.system_locked && 
    !!orbitron.getActiveIdentity()
  )

  return {
    recordGameGrowth: orbitron.recordGameGrowth,
    activeIdentity: computed(() => orbitron.getActiveIdentity()),
    isReady,
    startNewSession: orbitron.startNewSession
  }
}
