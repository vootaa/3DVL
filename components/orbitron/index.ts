// Orbitron v2.0 - Global Identity Management System
// Streamlined version focused on core functionality

// Core exports
export { OrbitronCore } from './core/orbitron-core'
export { IdentityManager } from './core/identity-manager'
export { GrowthRecorder } from './core/growth-recorder'
export { PinManager } from './core/pin-manager'
export { StorageEngine } from './core/storage-engine'
export { NebulaGenerator } from './core/nebula-generator'
export { CosmionClient } from './clients/cosmion-client'

// Vue components
export { default as NebulaPanel } from './views/NebulaPanel.vue'
export { default as NebulaDisplay } from './views/NebulaDisplay.vue'
export { default as NebulaBadge } from './views/NebulaBadge.vue'
export { default as CodeButton } from './views/CodeButton.vue'

// Composables
export { useOrbitron, useGlobalOrbitron } from './composables/useOrbitron'
export { useNebula } from './composables/useNebula'
export { useStorage } from './composables/useStorage'

// Types
export type {
    NebulaIdentity,
    GameGrowthEvent,
    OrbitronConfig,
    OrbitronState,
    CosmionSyncData,
    IdentityType,
    EventType,
} from './types'

// Configuration
export { createConfig, DEFAULT_CONFIG } from './core/config'

// Utilities
export * from './utils/generators'
export * from './utils/format-utils'
export * from './utils/hash-utils'

// Constants
export { SPACE_THEME_COLORS, ANIMATION_DURATIONS } from './utils/constants'

console.log('[Orbitron] v2.0 module loaded - Global Identity Management System ready')
