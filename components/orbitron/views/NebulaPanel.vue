<script setup lang="ts">
import type { NebulaIdentity, IdentityType } from '../types'
import { generateNebulaNickname } from '../utils/generators'
import { formatTimestamp, formatSyncStatus } from '../utils/format-utils'
import { Logger } from '../../utils/logger'

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useOrbitron } from '../composables/useOrbitron'

interface Props {
  // The 'full' variant is reserved for future expansion.
  variant?: 'compact' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'compact'
})

const { 
  isInitialized, 
  error, 
  systemInfo, 
  initialize, 
  createIdentity,
  listIdentities,
  activateIdentity,
  deleteIdentity,
  exportIdentity,
  importIdentity,
  setupPin,
  verifyPin,
  lock,
  removePin,
  syncToCosmion,
  checkStorageHealth
} = useOrbitron()

const TABS = ['identities', 'pin', 'sync', 'about'] as const
type Tab = typeof TABS[number]
const IDENTITY_TYPES: IdentityType[] = ['main', 'test', 'private']

const identities = ref<NebulaIdentity[]>([])
const showPanel = ref(false)
const selectedTab = ref<Tab>('identities')
const pinInput = ref('')
const pinForRemovalInput = ref('')
const importData = ref('')
const localError = ref('')
const localSuccess = ref('')
const showImportDialog = ref(false)
const pendingActionType = ref<'delete' | 'export' | 'import' | null>(null)
const pendingActionId = ref('')
const pinVerificationInput = ref('')
const showPinVerification = ref(false)

// Auto-create timer for empty identities
let autoCreateTimer: NodeJS.Timeout | null = null

watch(error, (newError) => {
  if (newError) {
    localError.value = newError
    setTimeout(() => localError.value = '', 4000)
  }
})

// Watch for empty identities and auto-create TEST identity after 1 minute
watch(identities, (newIdentities) => {
  // Clear existing timer if any
  if (autoCreateTimer) {
    clearTimeout(autoCreateTimer)
    autoCreateTimer = null
  }
  
  // If no identities exist, set timer to auto-create TEST identity
  if (newIdentities.length === 0 && isInitialized.value) {
    Logger.log('Identity', 'No identities found, setting auto-create timer for TEST identity')
    autoCreateTimer = setTimeout(async () => {
      try {
        // Double check that still no identities exist
        await loadIdentities()
        if (identities.value.length === 0) {
          // Perform storage health check before attempting to create
          const storageHealthy = await checkStorageHealth()
          if (!storageHealthy) {
            showError('Storage not available. Cannot auto-create identity.')
            return
          }
          
          await handleCreateIdentity('test')
          showSuccess('Auto-created TEST identity after 1 minute of waiting')
        }
      } catch (err: any) {
        Logger.error('Auto-create TEST identity failed:', err)
        showError(`Auto-create failed: ${err.message || 'Storage error'}`)
      } finally {
        autoCreateTimer = null
      }
    }, 60000) // 1 minute = 60000ms
  }
})

const clearMessages = () => {
  localError.value = ''
  localSuccess.value = ''
}

const showSuccess = (message: string) => {
  clearMessages()
  localSuccess.value = message
  setTimeout(() => localSuccess.value = '', 3000)
}

const showError = (message: string) => {
  clearMessages()
  localError.value = message
  setTimeout(() => localError.value = '', 4000)
}

const initializeSystem = async () => {
  try {
    if (!isInitialized.value) {
      await initialize()
    }
    await loadIdentities()
  } catch (err: any) {
    showError(err.message || 'System initialization failed')
  }
}

const loadIdentities = async () => {
  if (isInitialized.value) {
    identities.value = await listIdentities()
  }
}

const handleCreateIdentity = async (type: IdentityType) => {
  try {
    clearMessages()
    await createIdentity(type)
    await loadIdentities()
    showSuccess(`${type} identity created!`)
  } catch (err: any) {
    showError(err.message || 'Failed to create identity')
  }
}

const handleActivateIdentity = async (nebulaId: string) => {
  try {
    clearMessages()
    await activateIdentity(nebulaId)
    await loadIdentities()
    showSuccess('Identity activated!')
  } catch (err: any) {
    showError(err.message || 'Failed to activate identity')
  }
}

const requiresPinVerification = (_action: 'delete' | 'export' | 'import'): boolean => {
  return systemInfo.pin_configured && !systemInfo.system_locked
}

const handleDeleteIdentity = async (nebulaId: string) => {
  if (systemInfo.system_locked) {
    showError('System is locked. Please unlock to delete identities.')
    return
  }
  
  if (requiresPinVerification('delete')) {
    pendingActionType.value = 'delete'
    pendingActionId.value = nebulaId
    showPinVerification.value = true
    return
  }
  
  if (!confirm('Are you sure you want to delete this identity? This action cannot be undone.')) return
  await performDeleteIdentity(nebulaId)
}

const handleExportIdentity = async (nebulaId: string) => {
  if (systemInfo.system_locked) {
    showError('System is locked. Please unlock to export identities.')
    return
  }
  
  if (requiresPinVerification('export')) {
    pendingActionType.value = 'export'
    pendingActionId.value = nebulaId
    showPinVerification.value = true
    return
  }
  
  await performExportIdentity(nebulaId)
}

const pendingImportType = ref<IdentityType>('main')

const openImportDialog = (targetType: IdentityType) => {
  if (systemInfo.system_locked) {
    showError('System is locked. Please unlock to import identities.')
    return
  }
  
  if (requiresPinVerification('import')) {
    pendingActionType.value = 'import'
    pendingActionId.value = targetType
    showPinVerification.value = true
    return
  }
  
  pendingImportType.value = targetType
  clearMessages()
  showImportDialog.value = true
}

const performDeleteIdentity = async (nebulaId: string) => {
  try {
    clearMessages()
    const wasActiveIdentity = getActiveIdentity.value?.nebula_id === nebulaId
    await deleteIdentity(nebulaId)
    await loadIdentities()
    
    if (wasActiveIdentity && identities.value.length > 0) {
      const newActiveIdentity = getActiveIdentity.value
      if (newActiveIdentity) {
        showSuccess(`Identity deleted. Auto-activated: ${getDisplayNickname(newActiveIdentity)}`)
      } else {
        showSuccess('Identity deleted.')
      }
    } else {
      showSuccess('Identity deleted.')
    }
  } catch (err: any) {
    showError(err.message || 'Failed to delete identity')
  }
}

const performExportIdentity = async (nebulaId: string) => {
  try {
    clearMessages()
    const data = await exportIdentity(nebulaId)
    
    // Parse the exported data and remove nickname
    let exportedIdentity
    try {
      exportedIdentity = JSON.parse(data)
      if (exportedIdentity.nebula_nickname) {
        delete exportedIdentity.nebula_nickname
      }
    } catch (parseError) {
      // If parsing fails, use original data
      exportedIdentity = data
    }
    
    const cleanedData = typeof exportedIdentity === 'string' ? exportedIdentity : JSON.stringify(exportedIdentity)
    await navigator.clipboard.writeText(cleanedData)
    showSuccess('Identity copied to clipboard!')
  } catch (err: any) {
    showError('Export failed')
  }
}

const handlePinVerification = async () => {
  try {
    const success = await verifyPin(pinVerificationInput.value)
    if (success) {
      showPinVerification.value = false
      pinVerificationInput.value = ''
      
      if (pendingActionType.value === 'delete') {
        await performDeleteIdentity(pendingActionId.value)
      } else if (pendingActionType.value === 'export') {
        await performExportIdentity(pendingActionId.value)
      } else if (pendingActionType.value === 'import') {
        // For import, pendingActionId contains the identity type
        pendingImportType.value = pendingActionId.value as IdentityType
        clearMessages()
        showImportDialog.value = true
      }
      
      pendingActionType.value = null
      pendingActionId.value = ''
    } else {
      showError('Invalid PIN')
    }
  } catch (err: any) {
    showError('PIN verification failed')
  }
}

const cancelPinVerification = () => {
  showPinVerification.value = false
  pinVerificationInput.value = ''
  pendingActionType.value = null
  pendingActionId.value = ''
}

const handleImportIdentity = async () => {
  try {
    clearMessages()
    
    // Parse and validate the imported identity
    let parsedIdentity
    try {
      parsedIdentity = JSON.parse(importData.value)
    } catch (parseError) {
      showError('Invalid JSON format. Please check the identity data.')
      return
    }
    
    // Validate required fields
    if (!parsedIdentity.nebula_id) {
      showError('Missing required field: nebula_id')
      return
    }
    
    if (!parsedIdentity.generation_seed) {
      showError('Missing required field: generation_seed')
      return
    }
    
    if (!parsedIdentity.validation_hash) {
      showError('Missing required field: validation_hash')
      return
    }
    
    // Check if NebulaID already exists in any identity
    const existingIdentity = identities.value.find(id => id.nebula_id === parsedIdentity.nebula_id)
    if (existingIdentity) {
      showError(`Identity with ID ${parsedIdentity.nebula_id} already exists as ${existingIdentity.identity_type} identity`)
      return
    }
    
    // Check if target type slot is already occupied
    const existingTypeIdentity = identities.value.find(id => id.identity_type === pendingImportType.value)
    if (existingTypeIdentity) {
      showError(`${pendingImportType.value} identity slot already occupied`)
      return
    }
    
    await importIdentity(importData.value, pendingImportType.value)
    importData.value = ''
    showImportDialog.value = false
    await loadIdentities()
    showSuccess('Identity imported successfully!')
  } catch (err: any) {
    // Provide more specific error messages
    const errorMessage = err.message || 'Import failed'
    showError(`Import failed: ${errorMessage}`)
  }
}

const closeImportDialog = () => {
  showImportDialog.value = false
  importData.value = ''
}

const handleSetupPin = async () => {
  try {
    clearMessages()
    await setupPin(pinInput.value)
    pinInput.value = ''
    showSuccess('PIN configured successfully!')
  } catch (err: any) {
    showError(err.message || 'Failed to set up PIN')
  }
}

const handleVerifyPin = async () => {
  try {
    clearMessages()
    const success = await verifyPin(pinInput.value)
    pinInput.value = ''
    if (success) {
      showSuccess('Unlocked successfully!')
      setTimeout(() => {
        if (getActiveIdentity.value) showPanel.value = false
      }, 1500)
    } else {
      showError('Invalid PIN')
    }
  } catch (err: any) {
    showError(err.message || 'PIN verification failed')
  }
}

const handleRemovePin = async () => {
  try {
    clearMessages()
    await removePin(pinForRemovalInput.value)
    pinForRemovalInput.value = ''
    showSuccess('PIN removed successfully!')
  } catch (err: any) {
    showError(err.message || 'Failed to remove PIN')
  }
}

const handleSync = async () => {
  try {
    clearMessages()
    const result = await syncToCosmion()
    showSuccess(`Sync: ${result.identities_synced} IDs, ${result.events_synced} events`)
  } catch (err: any) {
    showError('Sync failed')
  }
}

const getIdentityByType = (type: IdentityType): NebulaIdentity | null => {
  return identities.value.find(id => id.identity_type === type) || null
}

const getActiveIdentity = computed(() => {
  return identities.value.find(id => id.is_active)
})

const getDisplayNickname = (identity: NebulaIdentity): string => {
  return generateNebulaNickname(identity.nebula_id)
}

const getIdentityTypeColor = (type: IdentityType): string => {
  switch (type) {
    case 'main': return 'text-cyan-300'
    case 'test': return 'text-yellow-300'
    case 'private': return 'text-purple-300'
    default: return 'text-gray-400'
  }
}

const buttonText = computed(() => {
  if (systemInfo.system_locked) return '🔒 Locked'
  if (!getActiveIdentity.value) return '👤 No Active Identity'
  return getDisplayNickname(getActiveIdentity.value)
})

const buttonClasses = computed(() => [
  'px-4 py-2 text-sm rounded-lg border transition-all duration-200 cursor-pointer',
  'tracking-wider font-medium whitespace-nowrap',
  {
    'bg-red-900/20 border-red-500/50 text-red-400 hover:bg-red-900/30': systemInfo.system_locked,
    'bg-yellow-900/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-900/30': !getActiveIdentity.value && !systemInfo.system_locked,
    'bg-cyan-900/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/30 hover:border-cyan-400 hover:shadow-cyan-400/20 hover:shadow-lg': getActiveIdentity.value && !systemInfo.system_locked
  }
])

onMounted(async () => {
  await initializeSystem()
})

onUnmounted(() => {
  // Clear auto-create timer on component unmount
  if (autoCreateTimer) {
    clearTimeout(autoCreateTimer)
    autoCreateTimer = null
  }
})
</script>

<template>
  <div class="orbitron-font">
    <!-- Identity Button -->
    <button
      v-if="props.variant === 'compact'"
      @click="showPanel = true"
      :class="buttonClasses"
      :title="getActiveIdentity ? `Active: ${getActiveIdentity.nebula_id}` : 'Manage identities'"
    >
      {{ buttonText }}
    </button>

    <!-- Panel Overlay - positioned to align bottom with button bottom -->
    <div
      v-if="showPanel"
      class="fixed inset-0 z-50"
      @click="showPanel = false"
    >
      <div
        class="absolute bottom-5 right-5 bg-gray-900 border border-gray-700 rounded-lg p-6 w-[480px] max-h-[70vh] overflow-y-auto shadow-2xl orbitron-font"
        @click.stop
      >
        <!-- Header with Active Identity -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl text-cyan-400 tracking-wider">
            ⚡ Nebula Identity
            <span v-if="getActiveIdentity" class="text-base text-white ml-3">{{ getDisplayNickname(getActiveIdentity) }}</span>
          </h2>
          <button @click="showPanel = false" class="text-gray-400 hover:text-white text-xl"> × </button>
        </div>

        <!-- System Info (without Active) - Reduced to 3 columns -->
        <div class="mb-4 p-2 bg-gray-800 rounded-lg">
          <div class="flex items-center justify-between text-xs text-gray-300 gap-4">
            <div>Identities: <span class="text-white">{{ identities.length }}/3</span></div>
            <div>PIN: <span :class="systemInfo.pin_configured ? 'text-green-400' : 'text-yellow-400'">{{ systemInfo.pin_configured ? 'Enable' : 'Disable' }}</span></div>
            <div>Cosmion: <span :class="systemInfo.cosmion_connected ? 'text-green-400' : 'text-red-400'">{{ systemInfo.cosmion_connected ? 'Online' : 'Offline' }}</span></div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex space-x-1 mb-4 bg-gray-800/30 rounded p-1">
          <button v-for="tab in TABS" :key="tab" @click="selectedTab = tab" :class="['px-3 py-2 text-sm rounded transition-all duration-200 tracking-widest flex-1', selectedTab === tab ? 'bg-cyan-500/20 text-cyan-300 shadow-glow' : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10']">
            {{ tab.toUpperCase() }}
          </button>
        </div>

        <!-- Identities Tab -->
        <div v-if="selectedTab === 'identities'" class="space-y-3">
          <!-- Three Identity Slots - Adjusted Grid Layout with larger button column -->
          <div v-for="type in IDENTITY_TYPES" :key="type" class="border rounded p-3" :class="getIdentityByType(type)?.is_active ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-600 bg-gray-800'">
            <div v-if="getIdentityByType(type)" class="grid grid-cols-[80px_1fr_180px] gap-3 items-center">
              <!-- Column 1: Identity Type with Creation Time (Fixed width 80px) -->
              <div class="flex flex-col items-start">
                <div class="text-xs uppercase font-medium" :class="getIdentityTypeColor(type)">{{ type }}</div>
                <div class="text-xs text-gray-400 mt-1">{{ formatTimestamp(getIdentityByType(type)!.created_at, false) }}</div>
              </div>
              
              <!-- Column 2: Identity Info (Flexible width) -->
              <div class="flex flex-col min-w-0">
                <div class="text-white text-sm mb-1 truncate">{{ getDisplayNickname(getIdentityByType(type)!) }}</div>
                <div class="text-xs text-gray-400 truncate">{{ getIdentityByType(type)!.nebula_id }}</div>
              </div>
              
              <!-- Column 3: Action Buttons (Fixed width 180px) - Single row -->
              <div class="flex gap-1 justify-end items-center">
                <span v-if="getIdentityByType(type)!.is_active" class="text-green-400 text-lg mr-2">☑️</span>
                <button 
                  v-if="!getIdentityByType(type)!.is_active" 
                  @click="handleActivateIdentity(getIdentityByType(type)!.nebula_id)" 
                  :disabled="systemInfo.system_locked"
                  :class="systemInfo.system_locked ? 'px-2 py-1 text-xs bg-gray-600 text-gray-400 rounded cursor-not-allowed' : 'px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded'"
                >
                  Activate
                </button>
                <button 
                  @click="handleExportIdentity(getIdentityByType(type)!.nebula_id)" 
                  :disabled="systemInfo.system_locked"
                  :class="systemInfo.system_locked ? 'px-2 py-1 text-xs bg-gray-600 text-gray-400 rounded cursor-not-allowed' : 'px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded'"
                >
                  Export
                </button>
                <button 
                  @click="handleDeleteIdentity(getIdentityByType(type)!.nebula_id)" 
                  :disabled="systemInfo.system_locked"
                  :class="systemInfo.system_locked ? 'px-2 py-1 text-xs bg-gray-600 text-gray-400 rounded cursor-not-allowed' : 'px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded'"
                >
                  Delete
                </button>
              </div>
            </div>
            <div v-else class="grid grid-cols-[80px_1fr_180px] gap-3 items-center">
              <!-- Column 1: Identity Type (Fixed width 80px) -->
              <div class="text-xs uppercase font-medium" :class="getIdentityTypeColor(type)">{{ type }}</div>
              
              <!-- Column 2: No Identity Text (Flexible width) -->
              <div class="text-sm text-gray-400">No identity</div>
              
              <!-- Column 3: Create/Import Buttons (Fixed width 180px) -->
              <div class="flex gap-2 justify-end">
                <button 
                  @click="handleCreateIdentity(type)" 
                  :disabled="systemInfo.system_locked"
                  :class="systemInfo.system_locked ? 'px-2 py-1 text-xs bg-gray-600 text-gray-400 rounded cursor-not-allowed' : 'px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded'"
                >
                  Create
                </button>
                <button 
                  @click="openImportDialog(type)" 
                  :disabled="systemInfo.system_locked"
                  :class="systemInfo.system_locked ? 'px-2 py-1 text-xs bg-gray-600 text-gray-400 rounded cursor-not-allowed' : 'px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded'"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- PIN Tab -->
        <div v-if="selectedTab === 'pin'" class="space-y-4">
          <div v-if="systemInfo.system_locked">
            <h4 class="text-white mb-2">🔒 System Locked</h4>
            <div class="flex gap-2">
              <input v-model="pinInput" type="password" placeholder="Enter PIN to unlock" class="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white" @keyup.enter="handleVerifyPin" />
              <button @click="handleVerifyPin" class="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded">Unlock</button>
            </div>
          </div>
          <div v-else>
            <h4 class="text-white mb-2">PIN Protection</h4>
            <div v-if="!systemInfo.pin_configured">
              <p class="text-sm text-gray-400 mb-2">Set a 4-8 digit PIN to secure your identities.</p>
              <div class="flex gap-2">
                <input v-model="pinInput" type="password" placeholder="4-8 digit PIN" class="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white" @keyup.enter="handleSetupPin" />
                <button @click="handleSetupPin" class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Setup PIN</button>
              </div>
            </div>
            <div v-else class="space-y-4">
              <div class="flex justify-between items-center">
                <p class="text-sm text-gray-400">Lock system to require PIN for access</p>
                <button @click="lock" class="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded">Lock Now</button>
              </div>
              <div>
                <h5 class="text-white mb-2">Remove PIN</h5>
                <p class="text-sm text-gray-400 mb-2">Enter your current PIN to disable protection.</p>
                <div class="flex gap-2">
                  <input v-model="pinForRemovalInput" type="password" placeholder="Enter current PIN" class="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white" @keyup.enter="handleRemovePin" />
                  <button @click="handleRemovePin" class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Remove PIN</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sync Tab with System Information -->
        <div v-if="selectedTab === 'sync'" class="space-y-4">
          <h4 class="text-white mb-2">Cosmion Sync</h4>
          <div class="space-y-2">
            <div class="text-sm text-gray-400">Last Sync: {{ formatSyncStatus(systemInfo.last_sync) }}</div>
            <div class="flex justify-end">
              <button @click="handleSync" :disabled="!systemInfo.cosmion_connected" class="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded">
                {{ systemInfo.cosmion_connected ? 'Sync Now' : 'Offline' }}
              </button>
            </div>
          </div>
          
          <!-- System Information from About tab -->
          <div class="flex items-center justify-between text-sm p-2 bg-gray-800 rounded">
            <div><span class="text-gray-400">Growth Events:</span> <span class="text-cyan-300">{{ systemInfo.total_events }}</span></div>
            <div><span class="text-gray-400">Status:</span> <span :class="systemInfo.initialized ? 'text-green-400' : 'text-red-400'">{{ systemInfo.initialized ? 'Ready' : 'Not Initialized' }}</span></div>
          </div>
        </div>

        <!-- About Tab with Identity Type Descriptions Only -->
        <div v-if="selectedTab === 'about'" class="space-y-4">
          <!-- Device ID -->
          <div class="flex items-center justify-between text-sm p-2 bg-gray-800 rounded">
            <span class="text-gray-400 font-medium">Device ID:</span>
            <span class="text-white text-xs break-all">{{ systemInfo.deviceId || 'Generating...' }}</span>
          </div>

          <!-- Identity Types Information - Simplified descriptions -->
          <div>
            <h4 class="text-white mb-3 text-sm font-medium">Identity Types</h4>
            <div class="grid grid-cols-1 gap-2 text-xs">
              <div class="grid grid-cols-[60px_1fr] gap-3 bg-gray-800 p-2 rounded items-start">
                <div class="text-cyan-300 font-medium">MAIN</div>
                <div class="text-gray-400">Production identity for live experiments.</div>
              </div>
              <div class="grid grid-cols-[60px_1fr] gap-3 bg-gray-800 p-2 rounded items-start">
                <div class="text-yellow-300 font-medium">TEST</div>
                <div class="text-gray-400">Development identity for testing.</div>
              </div>
              <div class="grid grid-cols-[60px_1fr] gap-3 bg-gray-800 p-2 rounded items-start">
                <div class="text-purple-300 font-medium">PRIVATE</div>
                <div class="text-gray-400">Privacy-enhanced identity for sensitive data.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div v-if="localError" class="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">{{ localError }}</div>
        <div v-if="localSuccess" class="mt-4 p-3 bg-green-900/20 border border-green-500/50 rounded text-green-400 text-sm">{{ localSuccess }}</div>
      </div>
    </div>

    <!-- Import Dialog - positioned aligned with main panel -->
    <div v-if="showImportDialog" class="fixed inset-0 bg-black/80 z-60" @click="closeImportDialog">
      <div class="absolute bg-gray-900 border border-gray-700 rounded-lg p-6 w-96 orbitron-font" 
           style="right: 60px; bottom: calc(20px + 40px);" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg text-cyan-400">Import Identity to {{ pendingImportType.toUpperCase() }}</h3>
          <button @click="closeImportDialog" class="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div class="space-y-3">
          <textarea v-model="importData" placeholder="Paste identity JSON data..." class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm h-32 resize-none" />
          <div class="flex gap-2">
            <button @click="handleImportIdentity" :disabled="!importData.trim()" class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm">Import</button>
            <button @click="closeImportDialog" class="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">Cancel</button>
          </div>
          
          <!-- Error message display within import dialog -->
          <div v-if="localError" class="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">{{ localError }}</div>
        </div>
      </div>
    </div>

    <!-- PIN Verification Dialog - positioned aligned with main panel -->
    <div v-if="showPinVerification" class="fixed inset-0 bg-black/80 z-60" @click="cancelPinVerification">
      <div class="absolute bg-gray-900 border border-gray-700 rounded-lg p-6 w-96 orbitron-font" 
           style="right: 60px; bottom: calc(20px + 40px);" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg text-cyan-400">🔒 Verify PIN</h3>
          <button @click="cancelPinVerification" class="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div class="space-y-3">
          <p class="text-sm text-gray-400">Enter your PIN to {{ pendingActionType }} this identity:</p>
          <input v-model="pinVerificationInput" type="password" placeholder="Enter PIN" class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white" @keyup.enter="handlePinVerification" />
          <div class="flex gap-2">
            <button @click="handlePinVerification" :disabled="!pinVerificationInput.trim()" class="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm">Verify</button>
            <button @click="cancelPinVerification" class="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">Cancel</button>
          </div>
          
          <!-- Error message display within PIN verification dialog -->
          <div v-if="localError" class="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">{{ localError }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orbitron-font {
  font-family: 'Kode Mono', monospace;
}

.shadow-glow {
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}
</style>
