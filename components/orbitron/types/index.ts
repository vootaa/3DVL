export type IdentityType = 'main' | 'test' | 'private'
export type EventType = 'exploration' | 'achievement' | 'interaction' | 'progress'

export interface NebulaIdentity {
    nebula_id: string           // "NEB-A1B2C3D4"
    nebula_nickname: string     // "🚀ABC12"
    created_at: number
    identity_type: IdentityType
    generation_seed: string     // Used for backend verification
    is_active: boolean
}

export interface GameGrowthEvent {
    nebula_id: string
    event_type: EventType
    action: string
    growth_data: Record<string, any>
    timestamp: number
    session_id: string
    experiment: string          // Marks the source experiment
}

export interface OrbitronConfig {
    max_identities: number      // Default 3
    auto_sync: boolean
    offline_cache: boolean
    pin_required: boolean
    storage: {
        prefix: string
        encryption: boolean
    }
    theme: {
        colors: Record<string, any>
        animations: Record<string, number>
    }
}

export interface OrbitronState {
    identities: NebulaIdentity[]
    active_identity_id: string | null
    pin_hash: string | null
    config: OrbitronConfig
    last_sync: number
    is_locked: boolean
}

export interface CosmionSyncData {
    identity: NebulaIdentity
    growth_events: GameGrowthEvent[]
    sync_timestamp: number
    signature: string
}
