import FontFaceObserver from 'fontfaceobserver'
import { reactive } from 'vue'
import { TextureLoader, AudioLoader } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { ResourceType } from './constants'
import { Logger } from '../core/logger'

import type { Resource, LoadingStats, LoadingError } from './types'

export const ResourceLoader = reactive({
  resources: [] as Resource[],
  totalResources: 0,
  loadedResources: 0,
  isLoaded: false,
  loadingProgress: 0,
  modelLoader: new GLTFLoader(),
  textureLoader: new TextureLoader(),
  audioLoader: new AudioLoader(),
  modelCache: new Map(),
  textureCache: new Map(),
  audioCache: new Map(),
  fontCache: new Set<string>(),

  loadingStats: {
    [ResourceType.Component]: { total: 0, loaded: 0, items: [], current: null },
    [ResourceType.Model]: { total: 0, loaded: 0, items: [], current: null },
    [ResourceType.Texture]: { total: 0, loaded: 0, items: [], current: null },
    [ResourceType.Audio]: { total: 0, loaded: 0, items: [], current: null },
    [ResourceType.Font]: { total: 0, loaded: 0, items: [], current: null },
    startTime: 0,
    elapsedTime: 0,
  } as LoadingStats,

  loadingErrors: [] as LoadingError[],

  updateLoadingStats() {
    const stats = this.loadingStats
    stats.elapsedTime = Date.now() - stats.startTime

    // Reset counters
    Object.values(ResourceType).forEach(type => {
      stats[type].total = 0;
      stats[type].loaded = 0;
    });

    // Single traversal to count all resource types
    for (const resource of this.resources) {
      stats[resource.type].total++;
      if (resource.loaded) {
        stats[resource.type].loaded++;
      }
    }

    // Calculate total loading progress
    const totalLoaded = Object.values(ResourceType).reduce(
      (sum, type) => sum + stats[type].loaded, 0
    );

    this.loadingProgress = this.totalResources > 0
      ? Math.floor((totalLoaded / this.totalResources) * 100)
      : 0;

    Logger.throttle('RESOURCE_LOADER', 'Loading progress update', {
      totalResources: this.totalResources,
      loadedResources: totalLoaded,
      progress: this.loadingProgress,
      elapsedTime: stats.elapsedTime
    })
  },

  registerResource(name: string, modulePromise: Promise<any>,
    type: ResourceType = ResourceType.Component) {
    this.resources.push({
      name,
      module: modulePromise,
      loaded: false,
      type,
      startTime: Date.now(),
      error: null,
    })
    this.totalResources = this.resources.length
    this.loadingStats[type].items.push(name)
    this.loadingStats[type].total = this.loadingStats[type].items.length
    this.updateLoadingStats()

    Logger.random('RESOURCE_LOADER', 'Resource registered', {
      name,
      type,
      totalResources: this.totalResources
    }, 0.1)
  },

  async registerFont(fontFamily: string, weights: number[] = [400]) {
    if (this.fontCache.has(fontFamily)) {
      Logger.log('RESOURCE_LOADER', 'Font already cached', { fontFamily })
      return Promise.resolve(true)
    }

    this.loadingStats.font.current = fontFamily

    try {
      const observers = weights.map((weight) => {
        const font = new FontFaceObserver(fontFamily, { weight })
        return font.load(null, 30000)
      })

      await Promise.all(observers)

      this.fontCache.add(fontFamily)

      this.registerResource(fontFamily, Promise.resolve(true), ResourceType.Font)
      Logger.log('RESOURCE_LOADER', 'Font loaded successfully', { fontFamily, weights })
      return true
    }
    catch (error) {
      Logger.error('RESOURCE_LOADER', 'Failed to load font', { fontFamily, weights, error })
      this.loadingErrors.push({ name: fontFamily, type: ResourceType.Font, error: error as Error })
      return false
    }
    finally {
      this.loadingStats[ResourceType.Font].current = null
    }
  },

  async registerModel(name: string, path: string) {
    if (this.modelCache.has(path)) {
      Logger.log('RESOURCE_LOADER', 'Model already cached', { name, path })
      return Promise.resolve(this.modelCache.get(path))
    }

    this.loadingStats[ResourceType.Model].current = name

    try {
      const result = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Model loading timeout: ${name}`))
        }, 20000)

        this.modelLoader.load(
          path,
          (gltf) => {
            clearTimeout(timeoutId)

            const nodes: { [key: string]: any } = {}
            gltf.scene.traverse((object) => {
              if (object.name) {
                nodes[object.name] = object
              }
            })

            const modelData = {
              scene: gltf.scene,
              nodes,
              animations: gltf.animations,
            }

            this.modelCache.set(path, modelData)
            resolve(modelData)
          },
          (progress) => {
            if (progress.lengthComputable) {
              const percentComplete = (progress.loaded / progress.total) * 100
              Logger.throttle('RESOURCE_LOADER', 'Model loading progress', {
                name,
                progress: percentComplete,
                loaded: progress.loaded,
                total: progress.total
              })
            }
          },
          (error) => {
            clearTimeout(timeoutId)
            Logger.error('RESOURCE_LOADER', 'Error loading model', { name, path, error })
            reject(error)
          },
        )
      })

      this.registerResource(name, Promise.resolve(result), ResourceType.Model)
      Logger.log('RESOURCE_LOADER', 'Model loaded successfully', { name, path })
      return result
    }
    catch (error) {
      Logger.error('RESOURCE_LOADER', 'Failed to load model', { name, path, error })
      this.loadingErrors.push({ name, type: ResourceType.Model, error: error as Error })
      return { scene: null, nodes: {}, animations: [] }
    }
    finally {
      this.loadingStats[ResourceType.Model].current = null
    }
  },

  async registerTexture(name: string, path: string) {
    if (this.textureCache.has(path)) {
      Logger.log('RESOURCE_LOADER', 'Texture already cached', { name, path })
      return Promise.resolve(this.textureCache.get(path))
    }

    this.loadingStats[ResourceType.Texture].current = name

    try {
      const texture = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Texture loading timeout: ${name}`))
        }, 10000)

        this.textureLoader.load(
          path,
          (texture) => {
            clearTimeout(timeoutId)
            this.textureCache.set(path, texture)
            resolve(texture)
          },
          (progress) => {
            if (progress.lengthComputable) {
              const percentComplete = (progress.loaded / progress.total) * 100
              Logger.throttle('RESOURCE_LOADER', 'Texture loading progress', {
                name,
                progress: percentComplete,
                loaded: progress.loaded,
                total: progress.total
              })
            }
          },
          (error) => {
            clearTimeout(timeoutId)
            Logger.error('RESOURCE_LOADER', 'Error loading texture', { name, path, error })
            reject(error)
          },
        )
      })

      this.registerResource(name, Promise.resolve(texture), ResourceType.Texture)
      Logger.log('RESOURCE_LOADER', 'Texture loaded successfully', { name, path })
      return texture
    }
    catch (error) {
      Logger.error('RESOURCE_LOADER', 'Failed to load texture', { name, path, error })
      this.loadingErrors.push({ name, type: ResourceType.Texture, error: error as Error })
      return null
    }
    finally {
      this.loadingStats[ResourceType.Texture].current = null
    }
  },

  async registerAudio(name: string, path: string) {
    if (this.audioCache.has(path)) {
      Logger.log('RESOURCE_LOADER', 'Audio already cached', { name, path })
      return Promise.resolve(this.audioCache.get(path))
    }

    this.loadingStats[ResourceType.Audio].current = name

    try {
      const buffer = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Audio loading timeout: ${name}`))
        }, 15000)

        this.audioLoader.load(
          path,
          (buffer) => {
            clearTimeout(timeoutId)
            this.audioCache.set(path, buffer)
            resolve(buffer)
          },
          (progress) => {
            if (progress.lengthComputable) {
              const percentComplete = (progress.loaded / progress.total) * 100
              Logger.throttle('RESOURCE_LOADER', 'Audio loading progress', {
                name,
                progress: percentComplete,
                loaded: progress.loaded,
                total: progress.total
              })
            }
          },
          (error) => {
            clearTimeout(timeoutId)
            Logger.error('RESOURCE_LOADER', 'Failed to load audio', { name, path, error })
            reject(error)
          },
        )
      })

      this.registerResource(name, Promise.resolve(buffer), ResourceType.Audio)
      Logger.log('RESOURCE_LOADER', 'Audio loaded successfully', { name, path })
      return buffer
    }
    catch (error) {
      Logger.error('RESOURCE_LOADER', 'Failed to load audio', { name, path, error })
      this.loadingErrors.push({ name, type: ResourceType.Audio, error: error as Error })
      return null
    }
    finally {
      this.loadingStats[ResourceType.Audio].current = null
    }
  },

  async loadAllResources() {
    this.loadingStats.startTime = Date.now()
    Logger.log('RESOURCE_LOADER', 'Starting resource loading process')

    this.registerResource('Game', import('../Game.vue'))

    this.registerResource('ChainLayer', import('../3d/ChainLayer.vue'))
    this.registerResource('Chainweb3D', import('../3d/Chainweb3D.vue'))
    //this.registerResource('Enemies', import('../3d/Enemies.vue'))
    this.registerResource('Explosions', import('../3d/Explosions.vue'))
    this.registerResource('InfoLabels', import('../3d/InfoLabels.vue'))
    this.registerResource('Particles', import('../3d/Particles.vue'))
    this.registerResource('PetersenGraphGroup', import('../3d/PetersenGraphGroup.vue'))
    this.registerResource('PetersenGraphPlane', import('../3d/PetersenGraphPlane.vue'))
    this.registerResource('Planets', import('../3d/Planets.vue'))
    this.registerResource('Rig', import('../3d/Rig.vue'))
    this.registerResource('Rings', import('../3d/Rings.vue'))
    this.registerResource('Rocks', import('../3d/Rocks.vue'))
    this.registerResource('Ship', import('../3d/Ship.vue'))
    this.registerResource('SpaceGameEffects', import('../3d/SpaceGameEffects.vue'))
    this.registerResource('SpaceObjects', import('../3d/SpaceObjects.vue'))
    this.registerResource('SpaceProbe', import('../3d/SpaceProbe.vue'))
    this.registerResource('SpaceStation', import('../3d/SpaceStation.vue'))
    this.registerResource('Stars', import('../3d/Stars.vue'))
    this.registerResource('TextPlane', import('../3d/TextPlane.vue'))
    this.registerResource('Track', import('../3d/Track.vue'))

    this.registerResource('SoundControl', import('../controls/SoundControl.vue'))
    this.registerResource('TrackControl', import('../controls/TrackControl.vue'))
    this.registerResource('InfoTextControl', import('../controls/InfoTextControl.vue'))
    this.registerResource('ControlPanel', import('../controls/ControlPanel.vue'))
    this.registerResource('ObservationControls', import('../controls/ObservationControls.vue'))
    this.registerResource('ModalDialog', import('../controls/ModalDialog.vue'))
    this.registerResource('HudControl', import('../controls/HudControl.vue'))

    await Promise.all([
      this.registerFont('Kode Mono', [400, 500, 700]),
      this.registerFont('Teko', [500]),
    ])

    await Promise.all([
      this.registerModel('ShipModel', '/models/space-game/Ship.glb'),
      this.registerModel('RockModel', '/models/space-game/Stone.glb'),
      this.registerModel('PodModel', '/models/space-game/Pod.glb'),
      this.registerModel('SpaceStationModel', '/models/space-game/InternationalSpaceStation.glb'),
      this.registerModel('SpaceProbeModel', '/models/space-game/SpaceProbe.glb'),
    ])

    await Promise.all([
      this.registerTexture('EarthTexture', '/textures/space-game/earth.jpg'),
      this.registerTexture('MoonTexture', '/textures/space-game/moon.png'),
    ])

    await Promise.all([
      this.registerAudio('BgAudio', '/audio/space-game/bg.mp3'),
      this.registerAudio('ClickAudio', '/audio/space-game/click.mp3'),
      this.registerAudio('EngineAudio', '/audio/space-game/engine.mp3'),
      this.registerAudio('Engine2Audio', '/audio/space-game/engine2.mp3'),
      this.registerAudio('ExplosionAudio', '/audio/space-game/explosion.mp3'),
      this.registerAudio('LaserAudio', '/audio/space-game/laser.mp3'),
      this.registerAudio('WarpAudio', '/audio/space-game/warp.mp3'),
    ])

    const loadPromises = this.resources.map(async (resource) => {
      try {
        this.loadingStats[resource.type].current = resource.name
        await resource.module
        resource.loaded = true
        resource.endTime = Date.now()
        this.loadedResources++
        this.updateLoadingStats()
      }
      catch (error) {
        Logger.error('RESOURCE_LOADER', 'Failed to load resource', {
          name: resource.name,
          type: resource.type,
          error
        })
        resource.error = error as Error
        this.loadingErrors.push({
          name: resource.name,
          type: resource.type,
          error: error as Error,
        })
      }
      finally {
        if (this.loadingStats[resource.type].current === resource.name) {
          this.loadingStats[resource.type].current = null
        }
      }
    })

    try {
      await Promise.all(loadPromises)
      this.updateLoadingStats()
      this.isLoaded = this.loadedResources === this.totalResources
        || (this.loadedResources > 0 && this.loadingProgress >= 95)

      Logger.log('RESOURCE_LOADER', 'Loading process completed', {
        loadedResources: this.loadedResources,
        totalResources: this.totalResources,
        successRate: Math.round((this.loadedResources / this.totalResources) * 100),
        elapsedTime: this.loadingStats.elapsedTime,
        errorCount: this.loadingErrors.length
      })
      if (this.loadingErrors.length > 0) {
        Logger.error('RESOURCE_LOADER', 'Some resources failed to load', {
          errorCount: this.loadingErrors.length,
          errors: this.loadingErrors.map(err => ({ name: err.name, type: err.type, message: err.error.message }))
        })
      }

      return this.isLoaded
    }
    catch (error) {
      Logger.error('RESOURCE_LOADER', 'Error during resource loading', { error })
      return false
    }
  },

  diagnose() {
    const diagnosticData = {
      totalResources: this.totalResources,
      loadedResources: this.loadedResources,
      progress: this.loadingProgress,
      isLoaded: this.isLoaded,
      errorsSize: this.loadingErrors.length,
      stats: {
        component: `${this.loadingStats.component.loaded}/${this.loadingStats.component.total}`,
        model: `${this.loadingStats.model.loaded}/${this.loadingStats.model.total}`,
        texture: `${this.loadingStats.texture.loaded}/${this.loadingStats.texture.total}`,
        audio: `${this.loadingStats.audio.loaded}/${this.loadingStats.audio.total}`,
        font: `${this.loadingStats.font.loaded}/${this.loadingStats.font.total}`
      },
      unloaded: this.resources.filter(r => !r.loaded).map(r => ({ name: r.name, type: r.type })),
      errors: this.loadingErrors.map(err => ({ name: err.name, type: err.type, message: err.error.message }))
    }

    Logger.log('RESOURCE_LOADER', 'Resource loader diagnostics', diagnosticData)

    return diagnosticData
  },

  forceComplete() {
    Logger.error('RESOURCE_LOADER', 'Forcing resource loading completion', {
      loadedResources: this.loadedResources,
      totalResources: this.totalResources,
      originalProgress: this.loadingProgress
    })
    this.isLoaded = true
    this.loadingProgress = 100
    return true
  },
})