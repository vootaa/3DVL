<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { BoxGeometry, Color, Group, MeshBasicMaterial, Vector3 } from 'three'
import { onMounted, inject, shallowRef, ref, computed } from 'vue'

import { gameStateManager } from '../core/GameStateManager'

import { ShipController } from './ship/controller'
import { ShipVisualEffects } from './ship/effects'
import { ShipModelLoader } from './ship/loader'

import type { ShipModelData } from './ship/types'
import type { GameStore } from '../GameStore'

// Game store
const gameStore = inject('gameStore') as GameStore

// Model data
const modelData = ref<ShipModelData>({
  isLoaded: false,
})

// Geometry and materials
const geometry = new BoxGeometry(1, 1, 40)
const lightgreen = new Color('lightgreen')
const hotpink = new Color('hotpink')
const laserMaterial = new MeshBasicMaterial({ color: lightgreen })
const crossMaterial = new MeshBasicMaterial({ color: hotpink, fog: false })

// Vectors
const position = new Vector3()
const direction = new Vector3()

// 3D object references
const main = shallowRef<Group>(new Group())
const laserGroup = shallowRef<Group | Group[]>(new Group())
const laserLight = shallowRef<any>(null)
const exhaust = shallowRef<Group>(new Group())
const cross = shallowRef<Group>(new Group())
const target = shallowRef<Group>(new Group())

// Mouse position
const mouseX = computed(() => gameStore.mutation.mouse.x)
const mouseY = computed(() => gameStore.mutation.mouse.y)

// Create controller and effects manager
const shipRefs = {
  main, laserGroup, laserLight, exhaust, cross, target, position, direction
}
const shipController = new ShipController(shipRefs, gameStore, mouseX, mouseY)
const visualEffects = new ShipVisualEffects(shipRefs, gameStore, crossMaterial)

// Load model
onMounted(() => {
  ShipModelLoader.loadModel(modelData)
})

// Render loop
useLoop().onBeforeRender(() => {
  const time = gameStore.mutation.clock.getElapsedTime()
  
  // Generic floating effect
  shipController.handleFloatEffect(time)
  
  // Control ship based on game state
  if (gameStateManager.isObservationMode()) {
    shipController.handleObservationMode(time)
  } else if (gameStateManager.canFlightMode()) {
    shipController.handleFlightMode()
  }
  
  // Update visual effects
  visualEffects.updateVisualEffects(time)
  
  // Debug logs
  shipController.logDebugInfo()
})
</script>

<template>
  <TresGroup ref="main">
    <TresPointLight
      color="cornflowerblue"
      :intensity="500"
      :distance="500"
      :position-z="10"
    />
    <TresGroup :scale="[3.5, 3.5, 3.5]">
      <!-- Crosshair -->
      <TresGroup
        ref="cross"
        :position="[0, 0, -300]"
        name="cross"
      >
        <TresMesh
          :render-order="1000"
          :material="crossMaterial"
        >
          <TresBoxGeometry :args="[20, 2, 2]" />
        </TresMesh>
        <TresMesh
          :render-order="1000"
          :material="crossMaterial"
        >
          <TresBoxGeometry :args="[2, 20, 2]" />
        </TresMesh>
      </TresGroup>
      
      <!-- Target indicator -->
      <TresGroup
        ref="target"
        :position="[0, 0, -300]"
        name="target"
      >
        <TresMesh
          :position="[0, 20, 0]"
          :render-order="1000"
          :material="crossMaterial"
        >
          <TresBoxGeometry :args="[40, 2, 2]" />
        </TresMesh>
        <TresMesh
          :position="[0, -20, 0]"
          :render-order="1000"
          :material="crossMaterial"
        >
          <TresBoxGeometry :args="[40, 2, 2]" />
        </TresMesh>
        <TresMesh
          :position="[20, 0, 0]"
          :render-order="1000"
          :material="crossMaterial"
        >
          <TresBoxGeometry :args="[2, 40, 2]" />
        </TresMesh>
        <TresMesh
          :position="[-20, 0, 0]"
          :render-order="1000"
          :material="crossMaterial"
        >
          <TresBoxGeometry :args="[2, 40, 2]" />
        </TresMesh>
      </TresGroup>
      
      <!-- Laser light effect -->
      <TresPointLight
        ref="laserLight"
        :position="[0, 0, -20]"
        :distance="100"
        :intensity="0"
        color="lightgreen"
      />
      
      <!-- Laser -->
      <TresGroup
        v-for="_ in gameStore.lasers"
        :key="_"
        ref="laserGroup"
      >
        <TresMesh
          :position="[-2.8, 0, -0.8]"
          :geometry="geometry"
          :material="laserMaterial"
        />
        <TresMesh
          :position="[2.8, 0, -0.8]"
          :geometry="geometry"
          :material="laserMaterial"
        />
      </TresGroup>
      
      <!-- Ship model -->
      <TresGroup :rotation="[Math.PI / 2, Math.PI, 0]">
        <template v-if="modelData.isLoaded">
          <TresMesh v-if="modelData.Renault_0" :geometry="modelData.Renault_0.geometry" :material="modelData.Renault_0.material" />
          <TresMesh v-if="modelData.Renault_1" :geometry="modelData.Renault_1.geometry" :material="modelData.Renault_1.material" />
          <TresMesh v-if="modelData.Renault_2" :geometry="modelData.Renault_2.geometry" :material="modelData.Renault_2.material" />
          <TresMesh v-if="modelData.Renault_3" :geometry="modelData.Renault_3.geometry" :material="modelData.Renault_3.material" />
          <TresMesh v-if="modelData.Renault_4" :geometry="modelData.Renault_4.geometry" :material="modelData.Renault_4.material" />
          <TresMesh v-if="modelData.Renault_5" :geometry="modelData.Renault_5.geometry" :material="modelData.Renault_5.material" />
        </template>
      </TresGroup>
    </TresGroup>
    
    <!-- Engine exhaust -->
    <TresMesh
      ref="exhaust"
      :scale="[1, 1, 30]"
      :position="[0, 1, 30]"
    >
      <TresDodecahedronGeometry :args="[1.5, 0]" />
      <TresMeshBasicMaterial color="lightblue" />
    </TresMesh>
  </TresGroup>
</template>