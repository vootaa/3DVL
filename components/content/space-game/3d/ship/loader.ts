import { Logger } from '../../../logger'
import { ResourceLoader } from '../../utils/ResourceLoader'

import type { Ref } from 'vue'
import type { ShipModelData } from './types'

export class ShipModelLoader {
  static async loadModel(modelData: Ref<ShipModelData>): Promise<void> {
    Logger.log('SHIP_LOADER', 'Starting ship model load', {
      modelPath: '/models/space-game/Ship.glb',
      modelName: 'ShipModel'
    })

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
          Logger.error('SHIP_LOADER', 'Missing main ship component (Renault_1)', {
            loadedNodes: Object.keys(result.nodes),
            expectedNode: 'Renault_1'
          })
          modelData.value.isLoaded = false
        }
        else {
          Logger.log('SHIP_LOADER', 'Ship model loaded successfully', {
            modelName: 'ShipModel',
            loadedComponents: Object.keys(modelData.value).filter(key =>
              key !== 'isLoaded' && modelData.value[key as keyof ShipModelData] !== null
            ),
            totalNodes: Object.keys(result.nodes).length
          })
        }
      }
      else {
        Logger.error('SHIP_LOADER', 'Ship model loaded but nodes are missing', {
          modelName: 'ShipModel',
          resultStructure: result ? Object.keys(result) : 'null'
        })
        modelData.value.isLoaded = false
      }
    }
    catch (error) {
      Logger.error('SHIP_LOADER', 'Failed to load ship model', {
        modelPath: '/models/space-game/Ship.glb',
        modelName: 'ShipModel',
        error: error
      })
      modelData.value.isLoaded = false
    }
  }
}