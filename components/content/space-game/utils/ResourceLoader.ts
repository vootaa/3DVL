import { reactive } from 'vue'

interface Resource {
  name: string
  loaded: boolean
  module: Promise<any>
}

export const ResourceLoader = reactive({
  resources: [] as Resource[],
  totalResources: 0,
  loadedResources: 0,
  isLoaded: false,
  loadingProgress: 0,

  registerResource(name: string, modulePromise: Promise<any>) {
    this.resources.push({
      name,
      loaded: false,
      module: modulePromise,
    })
    this.totalResources = this.resources.length
  },

  async loadAllResources() {
    // Register Game.vue main component
    this.registerResource('Game', import('../Game.vue'))

    // Register all 3D components used in Game.vue
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

    // Register UI control components
    this.registerResource('SoundControl', import('../controls/SoundControl.vue'))
    this.registerResource('InfoTextControl', import('../controls/InfoTextControl.vue'))
    this.registerResource('ControlPanel', import('../controls/ControlPanel.vue'))
    this.registerResource('ObservationControls', import('../controls/ObservationControls.vue'))
    this.registerResource('HudControl', import('../controls/HudControl.vue'))

    // Load all resources
    const loadPromises = this.resources.map(async (resource) => {
      try {
        await resource.module
        resource.loaded = true
        this.loadedResources++
        this.loadingProgress = Math.floor((this.loadedResources / this.totalResources) * 100)
      }
      catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to load resource: ${resource.name}`, error)
      }
    })

    await Promise.all(loadPromises)
    this.isLoaded = this.loadedResources === this.totalResources
    return this.isLoaded
  },
})