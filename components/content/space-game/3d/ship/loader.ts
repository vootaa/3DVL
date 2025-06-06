import { ResourceLoader } from '../../utils/ResourceLoader'
import type { Ref } from 'vue'
import type { ShipModelData } from './types'

export class ShipModelLoader {
  static async loadModel(modelData: Ref<ShipModelData>): Promise<void> {
    try {
      const result = await ResourceLoader.registerModel('ShipModel', '/models/space-game/Ship.glb')
      if (result?.nodes) {
        modelData.value = {
          Renault_0: result.nodes.Renault_0 || null,
          Renault_1: result.nodes.Renault_1 || null,
          Renault_2: result.nodes.Renault_2 || null,
          Renault_3: result.nodes.Renault_3 || null,
          Renault_4: result.nodes.Renault_4 || null,
          Renault_5: result.nodes.Renault_5 || null,
          isLoaded: true,
        }

        if (!modelData.value['Renault_1']) {
          console.error('Missing main Ship component (Renault_1)')
          modelData.value.isLoaded = false
        }
        else {
          console.log('ShipModel loaded successfully')
        }
      }
      else {
        console.error('ShipModel loaded but nodes are missing')
        modelData.value.isLoaded = false
      }
    }
    catch (error) {
      console.error('Failed to load ShipModel:', error)
      modelData.value.isLoaded = false
    }
  }
}