<script setup lang="ts">
import type { NebulaIdentity, IdentityType } from '../types'

import { ref, computed, onMounted, watch } from 'vue'
import { useOrbitron } from '../composables/useOrbitron'
import NebulaBadge from './NebulaBadge.vue'

interface Props {
  variant?: 'compact' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'compact'
})

const { 
  isInitialized, 
  isLoading, 
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
  syncToCosmion
} = useOrbitron()

const identities = ref<NebulaIdentity[]>([])
const showPanel = ref(false)
const selectedTab = ref<'identities' | 'pin' | 'sync' | 'system'>('identities')
const newIdentityType = ref<IdentityType>('main')
const pinInput = ref('')
const pinForRemovalInput = ref('')
const importData = ref('')
const localError = ref('')
const localSuccess = ref('')

watch(error, (newError) => {
  if (newError) {
    localError.value = newError
    setTimeout(() => localError.value = '', 4000)
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
    showError('System initialization failed')
  }
}

const loadIdentities = async () => {
  if (isInitialized.value) {
    identities.value = await listIdentities()
  }
}

const handleCreateIdentity = async () => {
  try {
    clearMessages()
    await createIdentity(newIdentityType.value)
    await loadIdentities()
    showSuccess(`${newIdentityType.value} identity created!`)
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

const handleDeleteIdentity = async (nebulaId: string) => {
  if (!confirm('Are you sure you want to delete this identity? This action cannot be undone.')) return
  try {
    clearMessages()
    await deleteIdentity(nebulaId)
    await loadIdentities()
    showSuccess('Identity deleted.')
  } catch (err: any) {
    showError(err.message || 'Failed to delete identity')
  }
}

const handleExportIdentity = async (nebulaId: string) => {
  try {
    clearMessages()
    const data = await exportIdentity(nebulaId)
    await navigator.clipboard.writeText(data)
    showSuccess('Identity copied to clipboard!')
  } catch (err: any) {
    showError('Export failed')
  }
}

const handleImportIdentity = async () => {
  try {
    clearMessages()
    await importIdentity(importData.value)
    importData.value = ''
    await loadIdentities()
    showSuccess('Identity imported successfully!')
  } catch (err: any) {
    showError(err.message || 'Import failed')
  }
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

const getActiveIdentity = computed(() => {
  return identities.value.find(id => id.is_active)
})

const buttonText = computed(() => {
  if (systemInfo.system_locked) return '🔒 Locked'
  if (!getActiveIdentity.value) return '👤 No Active Identity'
  return getActiveIdentity.value.nebula_nickname
})

const buttonClasses = computed(() => [
  'px-4 py-2 font-mono text-sm rounded-lg border transition-all duration-200 cursor-pointer',
  'tracking-wider font-medium whitespace-nowrap',
  {
    'bg-red-900/20 border-red-500/50 text-red-400 hover:bg-red-900/30': systemInfo.system_locked,
    'bg-yellow-900/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-900/30': !getActiveIdentity.value && !systemInfo.system_locked,
    'bg-cyan-900/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/30 hover:border-cyan-400 hover:shadow-cyan-400/20 hover:shadow-lg': getActiveIdentity.value && !systemInfo.system_locked
  }
])

onMounted(() => {
  initializeSystem()
})
</script>

<template>
  <div>
    <!-- Identity Button -->
    <button
      v-if="props.variant === 'compact'"
      @click="showPanel = true"
      :class="buttonClasses"
      :title="getActiveIdentity ? `Active: ${getActiveIdentity.nebula_id}` : 'Manage identities'"
    >
      {{ buttonText }}
    </button>

    <!-- Panel Overlay -->
    <div
      v-if="showPanel"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      @click="showPanel = false"
    >
      <div
        class="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-mono text-cyan-400 tracking-wider">⚡ ORBITRON CONTROL</h2>
          <button @click="showPanel = false" class="text-gray-400 hover:text-white font-mono text-xl"> × </button>
        </div>

        <!-- System Status -->
        <div class="mb-6 p-4 bg-gray-800 rounded-lg">
          <h3 class="font-mono text-cyan-300 mb-2 tracking-wider">System Status</h3>
          <div class="text-sm font-mono text-gray-300 space-y-1">
            <div>Active Identity: <span class="text-white">{{ getActiveIdentity ? getActiveIdentity.nebula_nickname : 'None' }}</span></div>
            <div>Identities: <span class="text-white">{{ identities.length }}/3</span></div>
            <div>PIN Protection: <span :class="systemInfo.pin_configured ? 'text-green-400' : 'text-yellow-400'">{{ systemInfo.pin_configured ? '✅ Enabled' : '❌ Disabled' }}</span></div>
            <div>Cosmion: <span :class="systemInfo.cosmion_connected ? 'text-green-400' : 'text-red-400'">{{ systemInfo.cosmion_connected ? '🟢 Connected' : '🔴 Offline' }}</span></div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex space-x-1 mb-4 bg-gray-800/30 rounded p-1">
          <button v-for="tab in ['identities', 'pin', 'sync', 'system']" :key="tab" @click="selectedTab = tab as 'identities' | 'pin' | 'sync' | 'system'" :class="['px-3 py-2 text-sm rounded transition-all duration-200 font-mono tracking-widest flex-1', selectedTab === tab ? 'bg-cyan-500/20 text-cyan-300 shadow-glow' : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10']">
            {{ tab.toUpperCase() }}
          </button>
        </div>

        <!-- Identities Tab -->
        <div v-if="selectedTab === 'identities'" class="space-y-4">
          <div class="flex gap-2">
            <select v-model="newIdentityType" class="px-3 py-2 bg-gray-800/50 border border-cyan-500/30 rounded text-cyan-100 font-mono">
              <option value="main">Main Identity</option>
              <option value="test">Test Identity</option>
              <option value="private">Private Identity</option>
            </select>
            <button @click="handleCreateIdentity" :disabled="identities.length >= 3" class="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-mono">
              Create Identity
            </button>
          </div>
          <div v-if="identities.length > 0" class="space-y-2">
            <div v-for="identity in identities" :key="identity.nebula_id" :class="['p-3 rounded border', identity.is_active ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-600 bg-gray-800']">
              <div class="flex justify-between items-center">
                <div>
                  <div class="font-mono text-white">{{ identity.nebula_nickname }}</div>
                  <div class="text-xs text-gray-400 font-mono">{{ identity.nebula_id }}</div>
                  <div class="text-xs text-gray-500">{{ identity.identity_type }}</div>
                </div>
                <div class="flex gap-2">
                  <button v-if="!identity.is_active" @click="handleActivateIdentity(identity.nebula_id)" class="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded font-mono">Activate</button>
                  <button @click="handleExportIdentity(identity.nebula_id)" class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-mono">Export</button>
                  <button @click="handleDeleteIdentity(identity.nebula_id)" class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-mono">Delete</button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-mono text-white mb-2">Import Identity</h4>
            <div class="space-y-2">
              <textarea v-model="importData" placeholder="Paste identity JSON data..." class="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm h-20" />
              <button @click="handleImportIdentity" :disabled="!importData.trim() || identities.length >= 3" class="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-mono text-sm">Import</button>
            </div>
          </div>
        </div>

        <!-- PIN Tab -->
        <div v-if="selectedTab === 'pin'" class="space-y-4">
          <div v-if="systemInfo.system_locked">
            <h4 class="font-mono text-white mb-2">🔒 System Locked</h4>
            <div class="flex gap-2">
              <input v-model="pinInput" type="password" placeholder="Enter PIN to unlock" class="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono" @keyup.enter="handleVerifyPin" />
              <button @click="handleVerifyPin" class="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-mono">Unlock</button>
            </div>
          </div>
          <div v-else>
            <h4 class="font-mono text-white mb-2">PIN Protection</h4>
            <div v-if="!systemInfo.pin_configured">
              <p class="text-sm text-gray-400 mb-2">Set a 4-8 digit PIN to secure your identities.</p>
              <div class="flex gap-2">
                <input v-model="pinInput" type="password" placeholder="4-8 digit PIN" class="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono" @keyup.enter="handleSetupPin" />
                <button @click="handleSetupPin" class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-mono">Setup PIN</button>
              </div>
            </div>
            <div v-else class="space-y-4">
              <div class="flex gap-2"><button @click="lock" class="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-mono">Lock Now</button></div>
              <div>
                <h5 class="font-mono text-white mb-2">Remove PIN</h5>
                <p class="text-sm text-gray-400 mb-2">Enter your current PIN to disable protection.</p>
                <div class="flex gap-2">
                  <input v-model="pinForRemovalInput" type="password" placeholder="Enter current PIN" class="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono" @keyup.enter="handleRemovePin" />
                  <button @click="handleRemovePin" class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-mono">Remove PIN</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sync Tab -->
        <div v-if="selectedTab === 'sync'" class="space-y-4">
          <h4 class="font-mono text-white mb-2">Cosmion Sync</h4>
          <div class="space-y-2">
            <div class="text-sm text-gray-400 font-mono">Last Sync: {{ systemInfo.last_sync ? new Date(systemInfo.last_sync).toLocaleString() : 'Never synced' }}</div>
            <button @click="handleSync" :disabled="!systemInfo.cosmion_connected" class="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-mono">
              {{ systemInfo.cosmion_connected ? 'Sync Now' : 'Offline' }}
            </button>
          </div>
        </div>

        <!-- System Tab -->
        <div v-if="selectedTab === 'system'" class="space-y-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><div class="text-gray-400 font-mono">Version</div><div class="text-cyan-300 font-mono">{{ systemInfo.version }}</div></div>
            <div><div class="text-gray-400 font-mono">Total Identities</div><div class="text-cyan-300 font-mono">{{ systemInfo.total_identities }}</div></div>
            <div><div class="text-gray-400 font-mono">Growth Events</div><div class="text-cyan-300 font-mono">{{ systemInfo.total_events }}</div></div>
            <div><div class="text-gray-400 font-mono">Initialization</div><div :class="systemInfo.initialized ? 'text-green-400' : 'text-red-400'" class="font-mono">{{ systemInfo.initialized ? 'Ready' : 'Not Initialized' }}</div></div>
          </div>
        </div>

        <!-- Messages -->
        <div v-if="localError" class="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm font-mono">{{ localError }}</div>
        <div v-if="localSuccess" class="mt-4 p-3 bg-green-900/20 border border-green-500/50 rounded text-green-400 text-sm font-mono">{{ localSuccess }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shadow-glow {
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}
</style>
