<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { Group, MeshStandardMaterial, Color, Vector3 } from 'three'
import { inject, shallowRef, ref, onMounted, computed, watch } from 'vue'

import { ResourceLoader } from '../utils/ResourceLoader'
import { GameState } from '../core/constants'
import { gameStateManager } from '../core/GameStateManager'
import { Logger } from '../core/logger'

import type { BufferGeometry, Material } from 'three'
import type { ObjectData } from '../store/types'
import type { GameStore } from '../GameStore'

const gameStore: GameStore = inject('gameStore') as GameStore
const rocksGroupRef = shallowRef(new Group())

// Performance optimization parameters
const PERFORMANCE = {
  // Visible range radius - rocks beyond this range won't have transformations calculated
  VISIBLE_RADIUS: 450,
  // Update throttling - update distant rocks' transformations every N frames
  UPDATE_THROTTLE: 3,
  // Maximum active rocks - limit the number of rocks animating simultaneously
  MAX_ACTIVE_ROCKS: 30
}

// Pre-allocated reusable objects - avoid creating new objects in loops
const tempVec3 = new Vector3()
let frameCount = 0

const fallbackMaterial = new MeshStandardMaterial({
  color: new Color(0x888888),
  roughness: 1,
  metalness: 0.2,
})

interface GLTFNode {
  geometry: BufferGeometry
  material: Material | Material[]
}

interface RockVariation {
  // Pre-calculated scaling factors
  scaleX: number
  scaleY: number
  scaleZ: number
  rotSpeed: number 
  // Performance optimization flags
  isActive: boolean      // Whether in active range
  distance: number       // Distance to camera/origin
}

const modelData = ref({
  stoneNode: null as GLTFNode | null,
  isLoaded: false,
})

// Use Map to store transformation info for each rock
const rockVariations = new Map<string, RockVariation>()

// Camera position - used for distance calculation
const cameraPosition = computed(() => {
  return gameStore.camera?.position || new Vector3(0, 0, 0)
})

// Generate consistent random transformation parameters for rocks
function initializeRockVariations() {
  // Clear old data
  rockVariations.clear()
  
  for (const rock of gameStore.rocks as ObjectData[]) {
    // Use deterministic pseudo-random to ensure consistent shape each render
    // Generate pseudo-random seed based on GUID
    const seed = hashString(String(rock.guid))
    const rng = createSeededRandom(seed)
    
    // Base scale value
    const baseScale = rock.scale
    
    // Pre-calculate all random values and store for performance
    rockVariations.set(String(rock.guid), {
      // Non-uniform scaling
      scaleX: baseScale * (1 + (rng() - 0.5) * 0.95),
      scaleY: baseScale * (1 + (rng() - 0.5) * 1.0),
      scaleZ: baseScale * (1 + (rng() - 0.5) * 1.05),

      rotSpeed: 1.0 + (rng() - 0.5) * 4.0,

      // Active by default
      isActive: true,
      distance: 0
    })
  }
  
  Logger.log('ROCKS', 'Rock variations initialized', {
    totalRocks: rockVariations.size,
    performance: PERFORMANCE
  })
}

// Create a numeric hash based on string (for seeds)
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Create a pseudo-random number generator based on seed
function createSeededRandom(seed: number) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

// Update rock visibility and active state
function updateRockActivity() {
  // If no camera, all rocks are active
  if (!gameStore.camera) return
  
  const cameraPos = cameraPosition.value
  let activeCount = 0
  
  // First calculate distance for all rocks
  for (const data of gameStore.rocks as ObjectData[]) {
    const variation = rockVariations.get(String(data.guid))
    if (!variation) continue
    
    // Calculate distance to camera
    tempVec3.set(data.offset.x, data.offset.y, data.offset.z)
    variation.distance = tempVec3.distanceTo(cameraPos)
  }
  
  // Sort rocks by distance (near to far)
  const sortedRocks = [...gameStore.rocks]
    .map(data => ({
      data,
      distance: rockVariations.get(String(data.guid))?.distance || 0
    }))
    .sort((a, b) => a.distance - b.distance)
  
  // Set active state
  for (const {data, distance} of sortedRocks) {
    const variation = rockVariations.get(String(data.guid))
    if (!variation) continue
    
    // Set as inactive if beyond visible distance
    const isInRange = distance < PERFORMANCE.VISIBLE_RADIUS
    
    // Within range and not exceeding maximum active count
    variation.isActive = isInRange && activeCount < PERFORMANCE.MAX_ACTIVE_ROCKS
    
    if (variation.isActive) {
      activeCount++
    }
  }
  
  // Log performance statistics occasionally
  Logger.random('ROCKS', 'Rock activity updated', {
    totalRocks: gameStore.rocks.length,
    activeRocks: activeCount,
    visibleRadius: PERFORMANCE.VISIBLE_RADIUS,
    maxActiveRocks: PERFORMANCE.MAX_ACTIVE_ROCKS
  }, 0.02)
}

onMounted(async () => {
  Logger.log('ROCKS', 'Initializing rocks component')
  
  try {
    const result = await ResourceLoader.registerModel('RockModel', '/models/space-game/Stone.glb')
    if (result?.nodes?.Stone) {
      modelData.value.stoneNode = result.nodes.Stone as GLTFNode
      modelData.value.isLoaded = true
      
      // Initialize rock transformations
      initializeRockVariations()
      
      Logger.log('ROCKS', 'Rock model loaded successfully', {
        modelName: 'RockModel',
        nodeName: 'Stone',
        hasGeometry: !!modelData.value.stoneNode.geometry,
        hasMaterial: !!modelData.value.stoneNode.material
      })
    } else {
      Logger.error('ROCKS', 'Rock model missing required node', {
        modelName: 'RockModel',
        expectedNode: 'Stone',
        availableNodes: result?.nodes ? Object.keys(result.nodes) : []
      })
    }
  } catch (error) {
    Logger.error('ROCKS', 'Failed to load rock model', {
      modelName: 'RockModel',
      modelPath: '/models/space-game/Stone.glb',
      error
    })
  }
})

// Watch for game state changes
watch(() => gameStateManager.getCurrentState(), (newState) => {
  if (newState === GameState.BATTLE && modelData.value.isLoaded && gameStore.rocks.length > 0) {
    Logger.log('ROCKS', 'Reinitializing rock variations for battle mode', {
      rockCount: gameStore.rocks.length,
      gameState: newState
    })
    // Slight delay to ensure rock data is updated
    setTimeout(() => initializeRockVariations(), 100)
  }
})

// Get game clock
const { clock } = gameStore.mutation

// Performance-optimized render loop
useLoop().onBeforeRender(() => {
  // Early exit if no rocks to render
  if (!gameStore.rocks || gameStore.rocks.length === 0) {
    return
  }

  // Increase frame counter
  frameCount++
  
  // Update rock activity state every 30 frames
  if (frameCount % 25 === 0) {
    updateRockActivity()
  }
  
  let activeRocksProcessed = 0
  let i = 0
  
  for (const data of gameStore.rocks as ObjectData[]) {
    const rock = rocksGroupRef.value.children[i]
    if (!rock) {
      i++
      continue
    }
    
    const variation = rockVariations.get(String(data.guid))
    if (!variation) {
      i++
      continue
    }
    
    // Skip inactive rocks
    if (!variation.isActive) {
      i++
      continue
    }
    
    // Throttle updates for distant rocks (update every few frames)
    if (variation.distance > 50 && frameCount % PERFORMANCE.UPDATE_THROTTLE !== 0) {
      i++
      continue
    }
    
    // Calculate rotation
    const rotationAmount = clock.elapsedTime * data.speed * variation.rotSpeed
    
    // Apply scaling
    rock.scale.set(variation.scaleX, variation.scaleY, variation.scaleZ)
    
    // Apply rotation
    rock.rotation.set(rotationAmount * 0.5, rotationAmount, rotationAmount * 0.3)
    
    activeRocksProcessed++
    i++
  }
  
  // Log render performance occasionally
  if (frameCount % 300 === 0) {
    Logger.throttle('ROCKS', 'Render performance', {
      frameCount,
      totalRocks: gameStore.rocks.length,
      activeRocksProcessed,
      cameraPosition: {
        x: cameraPosition.value.x,
        y: cameraPosition.value.y,
        z: cameraPosition.value.z
      }
    })
  }
})
</script>

<template>
  <TresGroup ref="rocksGroupRef" v-if="gameStore.rocks && gameStore.rocks.length > 0">
    <TresGroup
      v-for="data of gameStore.rocks as ObjectData[]"
      :key="data.guid"
      :position="data.offset"
    >
      <TresGroup
        :position="[-0.016, -0.012, 0.24]"
        :rotation="[3.00, 0.27, -0.22]"
        :scale="[2.95, 3.0, 3.05]"
      >
        <template v-if="modelData.isLoaded && modelData.stoneNode">
          <TresMesh
            :geometry="modelData.stoneNode.geometry"
            :material="modelData.stoneNode.material"
          />
        </template>
        <template v-else>
          <TresMesh :material="fallbackMaterial">
            <TresIcosahedronGeometry :args="[0.5, 1]" />
          </TresMesh>
        </template>
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>