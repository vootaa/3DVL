<script setup lang="ts">
import { ref } from 'vue'
import type { NebulaIdentity } from '../core/identity-manager'
import { useOrbitron } from '../composables/useOrbitron'
import { useNebula } from '../composables/useNebula'
import { getSpaceFontClass, formatTimestamp } from '../utils/format-utils'
import NebulaDisplay from './NebulaDisplay.vue'
import NebulaBadge from './NebulaBadge.vue'

interface Props {
  variant?: 'compact' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'full'
})

const { 
  isInitialized, 
  isLoading, 
  error, 
  systemInfo, 
  initialize, 
  listIdentities,
  createIdentity 
} = useOrbitron()

const { 
  savedNebulae, 
  generateNebula, 
  loadNebula, 
  removeNebula 
} = useNebula()

const identities = ref<NebulaIdentity[]>([])
const newIdentityName = ref('')
const selectedTab = ref<'nebulae' | 'identities' | 'system'>('nebulae')
const password = ref('')

const initializeSystem = async () => {
  try {
    await initialize(password.value || undefined)
    await loadIdentities()
  } catch (err) {
    console.error('Initialization failed:', err)
  }
}

const loadIdentities = async () => {
  if (isInitialized.value) {
    identities.value = await listIdentities()
  }
}

const handleCreateIdentity = async () => {
  if (newIdentityName.value.trim()) {
    await createIdentity(newIdentityName.value.trim())
    newIdentityName.value = ''
    await loadIdentities()
  }
}

const panelClasses = computed(() => [
  'bg-gray-900/90 backdrop-blur-md border border-cyan-500/30 rounded-lg',
  'text-cyan-100 shadow-xl shadow-cyan-500/10',
  'font-mono tracking-wider', // Use space-game font directly
  {
    'p-4 w-80': props.variant === 'compact',
    'p-6 w-96': props.variant === 'full'
  }
])

const tabButtonClasses = (tab: string) => [
  'px-3 py-2 text-sm rounded transition-all duration-200',
  'font-mono tracking-widest', // Use space-game font directly
  {
    'bg-cyan-500/20 text-cyan-300 shadow-glow': selectedTab.value === tab,
    'text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10': selectedTab.value !== tab
  }
]

onMounted(() => {
  if (!isInitialized.value) {
    initializeSystem()
  }
})
</script>

<template>
  <div :class="panelClasses">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-cyan-300 font-mono tracking-wider">ORBITRON</h2>
      <NebulaBadge 
        variant="primary" 
        size="sm" 
        rounded
        :pulse="isLoading"
      >
        {{ isInitialized ? 'ONLINE' : 'OFFLINE' }}
      </NebulaBadge>
    </div>

    <!-- Initialization -->
    <div v-if="!isInitialized" class="space-y-4">
      <div>
        <label class="block text-sm text-gray-400 mb-2 font-mono">Security Key (Optional)</label>
        <input
          v-model="password"
          type="password"
          placeholder="Enter encryption key..."
          class="w-full px-3 py-2 bg-gray-800/50 border border-cyan-500/30 rounded text-cyan-100 placeholder-gray-500 focus:border-cyan-400 focus:outline-none font-mono"
        />
      </div>
      <button
        @click="initializeSystem"
        :disabled="isLoading"
        class="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 rounded text-white font-medium transition-colors font-mono tracking-wider"
      >
        {{ isLoading ? 'INITIALIZING...' : 'INITIALIZE SYSTEM' }}
      </button>
      <div v-if="error" class="text-red-400 text-sm font-mono">{{ error }}</div>
    </div>

    <!-- Navigation Tabs -->
    <div v-else>
      <div class="flex space-x-1 mb-4 bg-gray-800/30 rounded p-1">
        <button
          v-for="tab in ['nebulae', 'identities', 'system']"
          :key="tab"
          @click="selectedTab = tab"
          :class="tabButtonClasses(tab)"
        >
          {{ tab.toUpperCase() }}
        </button>
      </div>

      <!-- Nebulae Tab -->
      <div v-if="selectedTab === 'nebulae'" class="space-y-4">
        <div class="text-center">
          <NebulaDisplay size="md" :interactive="true" :show-info="true" />
        </div>
        
        <div v-if="savedNebulae.length > 0">
          <h3 class="text-sm font-medium text-cyan-300 mb-2 font-mono">SAVED NEBULAE</h3>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="nebula in savedNebulae"
              :key="nebula.id"
              class="flex items-center justify-between p-2 bg-gray-800/30 rounded text-sm"
            >
              <div class="flex-1">
                <div class="text-cyan-300 font-mono">{{ nebula.id }}</div>
                <div class="text-gray-400 text-xs font-mono">{{ nebula.pattern }}</div>
              </div>
              <div class="flex space-x-1">
                <button
                  @click="loadNebula(nebula)"
                  class="p-1 text-cyan-400 hover:text-cyan-300"
                  title="Load"
                >
                  <span class="i-carbon-play w-3 h-3"></span>
                </button>
                <button
                  @click="removeNebula(nebula.id)"
                  class="p-1 text-red-400 hover:text-red-300"
                  title="Delete"
                >
                  <span class="i-carbon-trash-can w-3 h-3"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Identities Tab -->
      <div v-if="selectedTab === 'identities'" class="space-y-4">
        <div class="flex space-x-2">
          <input
            v-model="newIdentityName"
            placeholder="Identity name..."
            class="flex-1 px-3 py-2 bg-gray-800/50 border border-cyan-500/30 rounded text-cyan-100 placeholder-gray-500 focus:border-cyan-400 focus:outline-none text-sm font-mono"
            @keyup.enter="handleCreateIdentity"
          />
          <button
            @click="handleCreateIdentity"
            class="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white text-sm"
          >
            <span class="i-carbon-add w-4 h-4"></span>
          </button>
        </div>
        
        <div v-if="identities.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="identity in identities"
            :key="identity.id"
            class="p-3 bg-gray-800/30 rounded"
          >
            <div class="text-cyan-300 font-medium font-mono">{{ identity.name }}</div>
            <div class="text-gray-400 text-xs font-mono">{{ identity.id }}</div>
            <div class="text-gray-500 text-xs font-mono">{{ formatTimestamp(identity.created) }}</div>
          </div>
        </div>
      </div>

      <!-- System Tab -->
      <div v-if="selectedTab === 'system'" class="space-y-3">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div class="text-gray-400 font-mono">Version</div>
            <div class="text-cyan-300 font-mono">{{ systemInfo.version || '1.0.0' }}</div>
          </div>
          <div>
            <div class="text-gray-400 font-mono">Encryption</div>
            <div :class="systemInfo.encryption ? 'text-green-400' : 'text-red-400'" class="font-mono">
              {{ systemInfo.encryption ? 'ENABLED' : 'DISABLED' }}
            </div>
          </div>
          <div>
            <div class="text-gray-400 font-mono">Identities</div>
            <div class="text-cyan-300 font-mono">{{ systemInfo.identityCount || 0 }}</div>
          </div>
          <div>
            <div class="text-gray-400 font-mono">Nebulae</div>
            <div class="text-cyan-300 font-mono">{{ savedNebulae.length }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shadow-glow {
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}
</style>
