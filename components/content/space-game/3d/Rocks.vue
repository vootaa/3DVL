<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { BufferGeometry, Material } from 'three'
import { useLoop } from '@tresjs/core'
import { Group, MeshStandardMaterial, Color, Vector3 } from 'three'
import { inject, shallowRef, ref, onMounted, computed, watch } from 'vue'

import { ResourceLoader } from '../utils/ResourceLoader'
import { GameState } from '../core/constants'
import { gameStateManager } from '../core/GameStateManager'
import { DEV_Config } from '../core/constants'

import type { ObjectData } from '../store/types'
import type { GameStore } from '../GameStore'

const gameStore: GameStore = inject('gameStore') as GameStore
const rocksGroupRef = shallowRef(new Group())

// Performance optimization parameters
const PERFORMANCE = {
  // Visible range radius - rocks beyond this range won't have transformations calculated
  VISIBLE_RADIUS: 150,
  // Update throttling - update distant rocks' transformations every N frames
  UPDATE_THROTTLE: 3,
  // Maximum active rocks - limit the number of rocks animating simultaneously
  MAX_ACTIVE_ROCKS: 25
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
  // Pre-calculated rotation information
  rotAxisX: number
  rotAxisY: number
  rotAxisZ: number
  rotInitX: number
  rotInitY: number
  rotInitZ: number
  rotSpeedFactor: number // Rotation speed factor based on rock speed
  // Performance optimization flags
  isActive: boolean      // Whether in active range
  lastUpdateFrame: number // Last frame updated
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
    const variationRange = 0.3

    // Rotation speed factor based on rock speed
    const rotationSpeedFactor = 2.0 + rng() * 8.0
    
    // Pre-calculate all random values and store for performance
    rockVariations.set(String(rock.guid), {
      // Non-uniform scaling
      scaleX: baseScale * (1 + (rng() - 0.5) * variationRange),
      scaleY: baseScale * (1 + (rng() - 0.5) * variationRange),
      scaleZ: baseScale * (1 + (rng() - 0.5) * variationRange),
      
      // Rotation axis and initial rotation
      rotAxisX: rng() * 2 - 1,
      rotAxisY: rng() * 2 - 1,
      rotAxisZ: rng() * 2 - 1,
      rotInitX: rng() * Math.PI * 2,
      rotInitY: rng() * Math.PI * 2,
      rotInitZ: rng() * Math.PI * 2,
      rotSpeedFactor: rotationSpeedFactor,
      
      // Active by default
      isActive: true,
      lastUpdateFrame: 0,
      distance: 0
    })
  }
  
  if (DEV_Config.LOG_ENABLED) {
    console.log(`Initialized variations for ${rockVariations.size} rocks with varied rotation speeds`)
  }
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
}

onMounted(async () => {
  try {
    const result = await ResourceLoader.registerModel('RockModel', '/models/space-game/Stone.glb')
    if (result?.nodes?.Stone) {
      modelData.value.stoneNode = result.nodes.Stone as GLTFNode
      modelData.value.isLoaded = true
      
      // Initialize rock transformations
      initializeRockVariations()
      
      if (DEV_Config.LOG_ENABLED) {
        console.log('RockModel loaded successfully')
      }
    }
    else {
      console.error('RockModel missing Stone node')
    }
  }
  catch (error) {
    console.error('Failed to load RockModel:', error)
  }
})

// Watch for game state changes
watch(() => gameStateManager.getCurrentState(), (newState) => {
  if (newState === GameState.BATTLE && modelData.value.isLoaded && gameStore.rocks.length > 0) {
    if (DEV_Config.LOG_ENABLED) {
      console.log('[Rocks] Reinitializing rock variations for battle mode')
    }
    // Slight delay to ensure rock data is updated
    setTimeout(() => initializeRockVariations(), 100)
  }
})

// Get game clock
const { clock } = gameStore.mutation

// Performance-optimized render loop
useLoop().onBeforeRender(() => {
  // Increase frame counter
  frameCount++
  
  // Update rock activity state every 30 frames
  if (frameCount % 30 === 0) {
    updateRockActivity()
  }
  
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
    const r = clock.elapsedTime * data.speed * variation.rotSpeedFactor
    
    // Apply scaling
    rock.scale.set(variation.scaleX, variation.scaleY, variation.scaleZ)
    
    // Apply rotation
    rock.rotation.set(
      variation.rotInitX + r * variation.rotAxisX,
      variation.rotInitY + r * variation.rotAxisY,
      variation.rotInitZ + r * variation.rotAxisZ
    )
    
    // Record update frame
    variation.lastUpdateFrame = frameCount
    
    i++
  }
})
</script>

<template>
  <TresGroup ref="rocksGroupRef">
    <TresGroup
      v-for="data of gameStore.rocks as ObjectData[]"
      :key="data.guid"
      :position="data.offset"
    >
      <TresGroup
        :position="[-0.016, -0.012, 0.24]"
        :rotation="[3.00, 0.27, -0.22]"
        :scale="[3.5, 3.5, 3.5]"
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