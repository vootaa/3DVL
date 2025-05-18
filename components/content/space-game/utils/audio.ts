/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-console */
import type { PerspectiveCamera, Camera } from 'three'
import { AudioListener, Audio as ThreeAudio } from 'three'
import { watch } from 'vue'
import { ResourceLoader } from './ResourceLoader'

// Create a global audio listener
let listener: AudioListener | null = null
const audioObjects: Record<string, ThreeAudio> = {}

// Audio resource mapping table
const AUDIO_RESOURCES = {
  bg: { resourceName: 'BgAudio', path: '/audio/space-game/bg.mp3' },
  click: { resourceName: 'ClickAudio', path: '/audio/space-game/click.mp3' },
  engine: { resourceName: 'EngineAudio', path: '/audio/space-game/engine.mp3' },
  engine2: { resourceName: 'Engine2Audio', path: '/audio/space-game/engine2.mp3' },
  explosion: { resourceName: 'ExplosionAudio', path: '/audio/space-game/explosion.mp3' },
  zap: { resourceName: 'LaserAudio', path: '/audio/space-game/laser.mp3' },
  warp: { resourceName: 'WarpAudio', path: '/audio/space-game/warp.mp3' },
}

/**
 * Initialize audio system
 * @param camera Three.js camera object
 * @returns Audio control interface
 */
export async function initializeAudio(camera: PerspectiveCamera | Camera): Promise<AudioSystem> {
  console.log('Initializing audio system...')

  listener = new AudioListener()
  camera.add(listener)

  if (!ResourceLoader.isLoaded) {
    console.log('Waiting for ResourceLoader to complete...')
    await new Promise<void>((resolve) => {
      if (ResourceLoader.isLoaded) {
        resolve()
        return
      }

      const unwatch = watch(() => ResourceLoader.isLoaded, (loaded) => {
        if (loaded) {
          unwatch()
          console.log('ResourceLoader completed')
          resolve()
        }
      })
    })
  }

  const missingAudios = Object.entries(AUDIO_RESOURCES).filter(
    ([_, { path }]) => !ResourceLoader.audioCache.has(path),
  )
  
  if (missingAudios.length > 0) {
    console.log(`Loading ${missingAudios.length} missing audio resources...`)
    await Promise.all(
      missingAudios.map(([, { resourceName, path }]) =>
        ResourceLoader.registerAudio(resourceName, path),
      ),
    )
  }

  console.log('Creating audio objects...')
  const audioPromises = Object.entries(AUDIO_RESOURCES).map(
    ([name, { path }]) => createAudio(name, path),
  )

  try {
    await Promise.all(audioPromises)
    console.log('Audio system initialized successfully')
  }
  catch (error) {
    console.error('Error initializing audio system:', error)
  }

  return {
    play: (name: string, loop = false, volume = 1.0) => {
      if (audioObjects[name]) {
        const sound = audioObjects[name]
        sound.setLoop(loop)
        sound.setVolume(volume)

        if (sound.isPlaying) {
          sound.stop()
        }

        sound.play()
        return sound
      }
      console.warn(`Audio '${name}' not found`)
      return null
    },

    stop: (name: string) => {
      if (audioObjects[name] && audioObjects[name].isPlaying) {
        audioObjects[name].stop()
      }
    },

    get: (name: string) => audioObjects[name] || null,

    pauseAll: () => {
      Object.values(audioObjects).forEach((sound) => {
        if (sound.isPlaying) {
          sound.pause()
        }
      })
    },

    resumeAll: () => {
      Object.values(audioObjects).forEach((sound) => {
        if (sound.buffer && !sound.isPlaying) {
          sound.play()
        }
      })
    },

    setGlobalVolume: (volume: number) => {
      if (listener) {
        listener.gain.gain.value = Math.max(0, Math.min(1, volume))
      }
    },

    isPlaying: (name: string) => audioObjects[name] ? audioObjects[name].isPlaying : false,
  }
}

/**
 * Create a single audio object
 * @param name Audio name
 * @param path Audio file path
 */
async function createAudio(name: string, path: string): Promise<void> {
  try {
    if (!listener) {
      console.error('AudioListener not initialized')
      return
    }
        
    // Get audio data from cache
    let buffer = ResourceLoader.audioCache.get(path)

    if (!buffer) {
      console.warn(`Audio buffer for ${name} (${path}) not found in cache`)
            
      try {
        buffer = await ResourceLoader.registerAudio(`${name}Audio`, path)
      }
      catch (loadError) {
        console.error(`Failed to load audio ${name} directly:`, loadError)
      }
    }

    const sound = new ThreeAudio(listener)
    sound.setBuffer(buffer)
    audioObjects[name] = sound

    console.log(`Audio ${name} initialized successfully`)
  }
  catch (error) {
    console.error(`Error initializing audio ${name}:`, error)
  }
}

export interface AudioSystem {
  play: (name: string, loop?: boolean, volume?: number) => ThreeAudio<GainNode> | null
  stop: (name: string) => void
  get: (name: string) => ThreeAudio<GainNode> | null
  pauseAll: () => void
  resumeAll: () => void
  setGlobalVolume: (volume: number) => void
  isPlaying: (name: string) => boolean
}

