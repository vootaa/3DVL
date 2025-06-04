import { Audio as ThreeAudio } from 'three'

import { ResourceType } from './constants'

/**
 * Audio system interface for managing game audio
 */
export interface AudioSystem {
    play: (name: string, loop?: boolean, volume?: number) => ThreeAudio<GainNode> | null
    stop: (name: string) => void
    get: (name: string) => ThreeAudio<GainNode> | null
    pauseAll: () => void
    resumeAll: () => void
    stopAll: () => void
    setGlobalVolume: (volume: number) => void
    isPlaying: (name: string) => boolean
}

/**
 * Resource loader interface for managing game assets
 */
export interface ResourceLoader {
    loadingProgress: number
    isLoaded: boolean
    loadAllResources(): Promise<void>
}

/**
 * Resource interface representing a game asset
 */
export interface Resource {
    name: string
    module: Promise<any>
    loaded: boolean
    type: ResourceType
    startTime?: number
    endTime?: number
    error?: Error | null
}

/**
 * Loading statistics for resource types
 */
export interface TypeStats {
    total: number
    loaded: number
    items: string[]
    current: string | null
}

/**
 * Overall loading statistics
 */
export interface LoadingStats {
    [ResourceType.Component]: TypeStats
    [ResourceType.Model]: TypeStats
    [ResourceType.Texture]: TypeStats
    [ResourceType.Audio]: TypeStats
    [ResourceType.Font]: TypeStats
    startTime: number
    elapsedTime: number
}

/**
 * Errors encountered during resource loading
 */
export interface LoadingError {
    name: string
    type: string
    error: Error
}