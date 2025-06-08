import { AudioListener, Audio as ThreeAudio } from 'three'
import { watch } from 'vue'
import { ResourceLoader } from './ResourceLoader'
import { Logger } from '../core/logger'

import type { PerspectiveCamera, Camera } from 'three'
import type { AudioSystem } from './types'

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
  Logger.log('AUDIO_SYSTEM', 'Initializing audio system')

  listener = new AudioListener()
  camera.add(listener)

  if (!ResourceLoader.isLoaded) {
    Logger.log('AUDIO_SYSTEM', 'Waiting for ResourceLoader to complete')
    await new Promise<void>((resolve) => {
      if (ResourceLoader.isLoaded) {
        resolve()
        return
      }

      const unwatch = watch(() => ResourceLoader.isLoaded, (loaded) => {
        if (loaded) {
          unwatch()
          Logger.log('AUDIO_SYSTEM', 'ResourceLoader completed')
          resolve()
        }
      })
    })
  }

  const missingAudios = Object.entries(AUDIO_RESOURCES).filter(
    ([_, { path }]) => !ResourceLoader.audioCache.has(path),
  )
  
  if (missingAudios.length > 0) {
    Logger.log('AUDIO_SYSTEM', 'Loading missing audio resources', {
      missingCount: missingAudios.length,
      missingAudios: missingAudios.map(([name, { path }]) => ({ name, path }))
    })
    await Promise.all(
      missingAudios.map(([, { resourceName, path }]) =>
        ResourceLoader.registerAudio(resourceName, path),
      ),
    )
  }

  Logger.log('AUDIO_SYSTEM', 'Creating audio objects', {
    totalAudioObjects: Object.keys(AUDIO_RESOURCES).length
  })
  const audioPromises = Object.entries(AUDIO_RESOURCES).map(
    ([name, { path }]) => createAudio(name, path),
  )

  try {
    await Promise.all(audioPromises)
    Logger.log('AUDIO_SYSTEM', 'Audio system initialized successfully', {
      audioObjectsCreated: Object.keys(audioObjects).length,
      availableAudios: Object.keys(audioObjects)
    })
  }
  catch (error) {
    Logger.error('AUDIO_SYSTEM', 'Error initializing audio system', { error })
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
        Logger.random('AUDIO_SYSTEM', 'Audio played', {
          name,
          loop,
          volume
        }, 0.1)
        return sound
      }
      Logger.error('AUDIO_SYSTEM', 'Audio not found', {
        requestedAudio: name,
        availableAudios: Object.keys(audioObjects)
      })
      return null
    },

    stop: (name: string) => {
      if (audioObjects[name] && audioObjects[name].isPlaying) {
        audioObjects[name].stop()
        Logger.random('AUDIO_SYSTEM', 'Audio stopped', { name }, 0.1)
      }
    },

    get: (name: string) => audioObjects[name] || null,

    pauseAll: () => {
      const pausedCount = Object.values(audioObjects).filter((sound) => {
        if (sound.isPlaying) {
          sound.pause()
          return true
        }
        return false
      }).length

      Logger.log('AUDIO_SYSTEM', 'All audio paused', { pausedCount })
    },

    resumeAll: () => {
      const resumedCount = Object.values(audioObjects).filter((sound) => {
        if (sound.buffer && !sound.isPlaying) {
          sound.play()
          return true
        }
        return false
      }).length

      Logger.log('AUDIO_SYSTEM', 'All audio resumed', { resumedCount })
    },

    stopAll: () => {
      const stoppedCount = Object.values(audioObjects).filter((sound) => {
        if (sound.buffer && sound.isPlaying) {
          sound.stop()
          return true
        }
        return false
      }).length

      Logger.log('AUDIO_SYSTEM', 'All audio stopped', { stoppedCount })
    },

    setGlobalVolume: (volume: number) => {
      if (listener) {
        const clampedVolume = Math.max(0, Math.min(1, volume))
        listener.gain.gain.value = clampedVolume
        Logger.log('AUDIO_SYSTEM', 'Global volume changed', {
          requestedVolume: volume,
          actualVolume: clampedVolume
        })
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
      Logger.error('AUDIO_SYSTEM', 'AudioListener not initialized', { name, path })
      return
    }
        
    // Get audio data from cache
    let buffer = ResourceLoader.audioCache.get(path)

    if (!buffer) {
      Logger.log('AUDIO_SYSTEM', 'Audio buffer not found in cache, loading directly', { name, path })
      try {
        buffer = await ResourceLoader.registerAudio(`${name}Audio`, path)
      }
      catch (loadError) {
        Logger.error('AUDIO_SYSTEM', 'Failed to load audio directly', { name, path, loadError })
      }
    }

    const sound = new ThreeAudio(listener)
    sound.setBuffer(buffer)
    audioObjects[name] = sound

    Logger.log('AUDIO_SYSTEM', 'Audio initialized successfully', {
      name,
      path,
      bufferDuration: buffer?.duration || 'unknown'
    })
  }
  catch (error) {
    Logger.error('AUDIO_SYSTEM', 'Error initializing audio', { name, path, error })
  }
}