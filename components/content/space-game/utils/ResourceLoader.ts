import { reactive } from 'vue'
import { TextureLoader, AudioLoader } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface Resource {
  name: string
  module: Promise<any>
  loaded: boolean
  type: 'component' | 'model' | 'texture' | 'audio'
}
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

  registerResource(name: string, modulePromise: Promise<any>,
    type: 'component' | 'model' | 'texture' | 'audio' = 'component') {
    this.resources.push({
      name,
      module: modulePromise,
      loaded: false,
      type,
    })
    this.totalResources = this.resources.length
  },

  registerModel(name: string, path: string) {
    if (this.modelCache.has(path)) {
      return Promise.resolve(this.modelCache.get(path))
    }
    const modelPromise = new Promise((resolve, reject) => {
      this.modelLoader.load(
        path,
        (gltf) => {
          this.modelCache.set(path, gltf)
          resolve(gltf)
        },
        undefined,
        error => reject(error),
      )
    })

    this.registerResource(name, modelPromise, 'model')
    return modelPromise
  },

  registerTexture(name: string, path: string) {
    if (this.textureCache.has(path)) {
      return Promise.resolve(this.textureCache.get(path))
    }
    const texturePromise = new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          this.textureCache.set(path, texture)
          resolve(texture)
        },
        undefined,
        error => reject(error),
      )
    })

    this.registerResource(name, texturePromise, 'texture')
    return texturePromise
  },

  registerAudio(name: string, path: string) {
    if (this.audioCache.has(path)) {
      return Promise.resolve(this.audioCache.get(path))
    }

    const audioPromise = new Promise((resolve, reject) => {
      this.audioLoader.load(
        path,
        (buffer) => {
          this.audioCache.set(path, buffer)
          resolve(buffer)
        },
        undefined,
        error => reject(error),
      )
    })

    this.registerResource(name, audioPromise, 'audio')
    return audioPromise
  },

  async loadAllResources() {
    this.registerResource('Game', import('../Game.vue'))
    this.registerResource('Planets', import('../3d/Planets.vue'))
    this.registerResource('Stars', import('../3d/Stars.vue'))
    this.registerResource('Particles', import('../3d/Particles.vue'))
    this.registerResource('Rings', import('../3d/Rings.vue'))
    this.registerResource('Chainweb3D', import('../3d/Chainweb3D.vue'))
    this.registerResource('PetersenGraphGroup', import('../3d/PetersenGraphGroup.vue'))
    this.registerResource('InfoLabels', import('../3d/InfoLabels.vue'))
    this.registerResource('Enemies', import('../3d/Enemies.vue'))
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
    this.registerResource('HudControl', import('../controls/HudControl.vue'))

    this.registerModel('ShipModel', '/models/space-game/ship.gltf')
    this.registerModel('RockModel', '/models/space-game/rock.gltf')
    this.registerModel('SpaceDroneModel', '/models/space-game/spacedrone.gltf')
    this.registerModel('SpaceStationModel', '/models/space-game/InternationalSpaceStation.glb')

    this.registerTexture('EarthTexture', '/textures/space-game/earth.jpg')
    this.registerTexture('MoonTexture', '/textures/space-game/moon.png')

    this.registerAudio('BgAudio', '/audio/space-game/bg.mp3')
    this.registerAudio('ClickAudio', '/audio/space-game/click.mp3')
    this.registerAudio('EngineAudio', '/audio/space-game/engine.mp3')
    this.registerAudio('Engine2Audio', '/audio/space-game/engine2.mp3')
    this.registerAudio('ExplosionAudio', '/audio/space-game/explosion.mp3')
    this.registerAudio('LaserAudio', '/audio/space-game/laser.mp3')
    this.registerAudio('WarpAudio', '/audio/space-game/warp.mp3')

    const loadPromises = this.resources.map(async (resource) => {
      try {
        await resource.module
        resource.loaded = true
        this.loadedResources++
        this.loadingProgress = Math.floor((this.loadedResources / this.totalResources) * 100)
      }
      catch (error) {
        console.error(`Failed to load resource: ${resource.name}`, error)
      }
    })

    await Promise.all(loadPromises)
    this.isLoaded = this.loadedResources === this.totalResources
    return this.isLoaded
  },
})