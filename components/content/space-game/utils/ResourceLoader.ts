import FontFaceObserver from 'fontfaceobserver'
import { reactive } from 'vue'
import { TextureLoader, AudioLoader } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { ResourceType } from './constants'
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
  },

  async registerFont(fontFamily: string, weights: number[] = [400]) {
    if (this.fontCache.has(fontFamily)) {
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
      console.log(`Font loaded: ${fontFamily}`)
      return true
    }
    catch (error) {
      console.error(`Failed to load font: ${fontFamily}`, error)
      this.loadingErrors.push({ name: fontFamily, type: ResourceType.Font, error: error as Error })
      return false
    }
    finally {
      this.loadingStats[ResourceType.Font].current = null
    }
  },

  async registerModel(name: string, path: string) {
    if (this.modelCache.has(path)) {
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
              console.log(`Model ${name} loading: ${percentComplete.toFixed(2)}%`)
            }
          },
          (error) => {
            clearTimeout(timeoutId)
            console.error(`Error loading model ${name}:`, error)
            reject(error)
          },
        )
      })

      this.registerResource(name, Promise.resolve(result), ResourceType.Model)
      return result
    }
    catch (error) {
      console.error(`Failed to load model ${name}:`, error)
      this.loadingErrors.push({ name, type: ResourceType.Model, error: error as Error })
      return { scene: null, nodes: {}, animations: [] }
    }
    finally {
      this.loadingStats[ResourceType.Model].current = null
    }
  },

  async registerTexture(name: string, path: string) {
    if (this.textureCache.has(path)) {
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
              console.log(`Texture ${name} loading: ${percentComplete.toFixed(2)}%`)
            }
          },
          (error) => {
            clearTimeout(timeoutId)
            console.error(`Error loading texture ${name}:`, error)
            reject(error)
          },
        )
      })

      this.registerResource(name, Promise.resolve(texture), ResourceType.Texture)
      return texture
    }
    catch (error) {
      console.error(`Failed to load texture ${name}:`, error)
      this.loadingErrors.push({ name, type: ResourceType.Texture, error: error as Error })
      return null
    }
    finally {
      this.loadingStats[ResourceType.Texture].current = null
    }
  },

  async registerAudio(name: string, path: string) {
    if (this.audioCache.has(path)) {
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
              console.log(`Audio ${name} loading: ${percentComplete.toFixed(2)}%`)
            }
          },
          (error) => {
            clearTimeout(timeoutId)
            console.error(`Failed to load audio ${name} (${path}):`, error)
            reject(error)
          },
        )
      })

      this.registerResource(name, Promise.resolve(buffer), ResourceType.Audio)
      return buffer
    }
    catch (error) {
      console.error(`Failed to load audio ${name}:`, error)
      this.loadingErrors.push({ name, type: ResourceType.Audio, error: error as Error })
      return null
    }
    finally {
      this.loadingStats[ResourceType.Audio].current = null
    }
  },

  async loadAllResources() {
    this.loadingStats.startTime = Date.now()

    this.registerResource('Game', import('../Game.vue'))
    this.registerResource('Planets', import('../3d/Planets.vue'))
    this.registerResource('Stars', import('../3d/Stars.vue'))
    this.registerResource('Particles', import('../3d/Particles.vue'))
    this.registerResource('Rings', import('../3d/Rings.vue'))
    this.registerResource('Chainweb3D', import('../3d/Chainweb3D.vue'))
    this.registerResource('PetersenGraphGroup', import('../3d/PetersenGraphGroup.vue'))
    this.registerResource('InfoLabels', import('../3d/InfoLabels.vue'))
    //this.registerResource('Enemies', import('../3d/Enemies.vue'))
    this.registerResource('Rocks', import('../3d/Rocks.vue'))
    this.registerResource('Track', import('../3d/Track.vue'))
    this.registerResource('Explosions', import('../3d/Explosions.vue'))
    this.registerResource('Rig', import('../3d/Rig.vue'))
    this.registerResource('Ship', import('../3d/Ship.vue'))
    this.registerResource('SpaceObjects', import('../3d/SpaceObjects.vue'))
    this.registerResource('SpaceGameEffects', import('../3d/SpaceGameEffects.vue'))

    this.registerResource('SoundControl', import('../controls/SoundControl.vue'))
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
        console.error(`Failed to load resource: ${resource.name} (${resource.type})`, error)
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

      console.log(`Loading complete. ${this.loadedResources}/${this.totalResources} resources loaded.`)
      if (this.loadingErrors.length > 0) {
        console.warn(`${this.loadingErrors.length} resources failed to load.`)
      }

      return this.isLoaded
    }
    catch (error) {
      console.error('Error during resource loading:', error)
      return false
    }
  },

  diagnose() {
    console.log('=== Resource Loader Diagnostics ===')
    console.log(`Total resources: ${this.totalResources}`)
    console.log(`Loaded resources: ${this.loadedResources}`)
    console.log(`Loading progress: ${this.loadingProgress}%`)
    console.log(`Is loaded: ${this.isLoaded}`)
    console.log(`Loading errors: ${this.loadingErrors.length}`)

    console.log('\n=== Resource Type Breakdown ===')
    console.log(`Components: ${this.loadingStats.component.loaded}/${this.loadingStats.component.total}`)
    console.log(`Models: ${this.loadingStats.model.loaded}/${this.loadingStats.model.total}`)
    console.log(`Textures: ${this.loadingStats.texture.loaded}/${this.loadingStats.texture.total}`)
    console.log(`Audio: ${this.loadingStats.audio.loaded}/${this.loadingStats.audio.total}`)
    console.log(`Font: ${this.loadingStats.font.loaded}/${this.loadingStats.font.total}`)

    if (this.loadingErrors.length > 0) {
      console.log('\n=== Loading Errors ===')
      this.loadingErrors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.name} (${err.type}): ${err.error.message}`)
      })
    }

    const unloadedResources = this.resources.filter(r => !r.loaded)
    if (unloadedResources.length > 0) {
      console.log('\n=== Unloaded Resources ===')
      unloadedResources.forEach((res, index) => {
        console.log(`${index + 1}. ${res.name} (${res.type})`)
      })
    }

    return {
      totalResources: this.totalResources,
      loadedResources: this.loadedResources,
      progress: this.loadingProgress,
      isLoaded: this.isLoaded,
      errors: this.loadingErrors.length,
      stats: this.loadingStats,
      unloaded: unloadedResources.map(r => r.name),
    }
  },

  forceComplete() {
    console.warn('Forcing resource loading completion')
    this.isLoaded = true
    this.loadingProgress = 100
    return true
  },
})