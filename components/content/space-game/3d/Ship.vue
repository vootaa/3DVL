<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { BufferGeometry, Material } from 'three'

import { useLoop } from '@tresjs/core'
import { BoxGeometry, Color, Group, MeshBasicMaterial, PerspectiveCamera, PointLight, Vector3 } from 'three'
import { onMounted, onUnmounted, inject, shallowRef, watch, ref } from 'vue'

import { ResourceLoader } from '../utils/ResourceLoader'
import { gameStateManager } from '../core/GameStateManager'

import type { GameStore } from '../GameStore'
const gameStore = inject('gameStore') as GameStore

interface GLTFNode {
  geometry: BufferGeometry
  material: Material | Material[]
}

interface ShipModelData {
  'Renault_0'?: GLTFNode | null // Light_Metal
  'Renault_1'?: GLTFNode | null // Medium_Metal
  'Renault_2'?: GLTFNode | null // Dark_Metal
  'Renault_3'?: GLTFNode | null // Shield
  'Renault_4'?: GLTFNode | null // Engine_Glow
  'Renault_5'?: GLTFNode | null // Blue_Glow
  isLoaded: boolean
}

const modelData = ref<ShipModelData>({
  isLoaded: false,
})

onMounted(async () => {
  try {
    const result = await ResourceLoader.registerModel('ShipModel', '/models/space-game/Ship.glb')
    if (result?.nodes) {
      modelData.value = {
        Renault_0: result.nodes.Renault_0 as GLTFNode | undefined || null,
        Renault_1: result.nodes.Renault_1 as GLTFNode | undefined || null,
        Renault_2: result.nodes.Renault_2 as GLTFNode | undefined || null,
        Renault_3: result.nodes.Renault_3 as GLTFNode | undefined || null,
        Renault_4: result.nodes.Renault_4 as GLTFNode | undefined || null,
        Renault_5: result.nodes.Renault_5 as GLTFNode | undefined || null,
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
})

const geometry = new BoxGeometry(1, 1, 40)
const lightgreen = new Color('lightgreen')
const hotpink = new Color('hotpink')
const laserMaterial = new MeshBasicMaterial({ color: lightgreen })
const crossMaterial = new MeshBasicMaterial({ color: hotpink, fog: false })
const position = new Vector3()
const direction = new Vector3()

const main = shallowRef<Group>(new Group())
const laserGroup = shallowRef<Group | Group[]>(new Group())
const laserLight = shallowRef<PointLight>(new PointLight())
const exhaust = shallowRef<Group>(new Group())
const cross = shallowRef<Group>(new Group())
const target = shallowRef<Group>(new Group())

// Define margin values (percentage of screen)
const margins: { x: number; y: number } = {
  x: 0.12,
  y: 0.1,
}

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<F>): ReturnType<F> | undefined => {
    if (timeout !== null) {
      clearTimeout(timeout)
      timeout = null
    }
    timeout = setTimeout(() => func(...args), waitFor)
    return undefined as any
  }
}

// Calculate boundaries based on window size
const boundaries = shallowRef<{
  x: { min: number; max: number }
  y: { min: number; max: number }
}>({
  x: { min: 0, max: 0 },
  y: { min: 0, max: 0 },
})

// Function to update boundaries based on current screen size
function updateBoundaries(): void {
  const camera = gameStore.camera as unknown as PerspectiveCamera | undefined
  if (!camera || camera.position.z <= 0) {
    setTimeout(updateBoundaries, 100)
    return
  }
  const width: number = window.innerWidth
  const height: number = window.innerHeight

  const effectiveWidth: number = width * (1 - 2 * margins.x)
  const effectiveHeight: number = height * (1 - 2 * margins.y)

  const cameraZ: number = Math.max(camera.position.z, 100)
  const worldWidth: number = Math.tan(Math.PI * gameStore.mutation.fov / 360) * cameraZ * 2
  const worldHeight: number = worldWidth / (window.innerWidth / window.innerHeight)

  const worldScaleX: number = worldWidth / effectiveWidth
  const worldScaleY: number = worldHeight / effectiveHeight

  boundaries.value = {
    x: {
      min: -(width / 2 - width * margins.x) * worldScaleX,
      max: (width / 2 - width * margins.x) * worldScaleX,
    },
    y: {
      min: -(height / 2 - height * margins.y) * worldScaleY,
      max: (height / 2 - height * margins.y) * worldScaleY,
    },
  }
}

// Function to clamp values within boundaries
function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

const debouncedUpdateBoundaries = debounce(updateBoundaries, 100)
// Update boundaries when component is mounted and on window resize
onMounted(() => {
  updateBoundaries()
  window.addEventListener('resize', debouncedUpdateBoundaries)
  setTimeout(updateBoundaries, 500)
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedUpdateBoundaries)
})

watch(() => {
  const camera = gameStore.camera as unknown as PerspectiveCamera | undefined
  return camera?.position.z
}, (newValue) => {
  if (newValue !== undefined && gameStore.camera) {
    updateBoundaries()
  }
})

const mouseX = computed(() => gameStore.mutation.mouse.x)
const mouseY = computed(() => gameStore.mutation.mouse.y)

useLoop().onBeforeRender(() => {
  const time = gameStore.mutation.clock.getElapsedTime()
  main.value.position.z = Math.sin(time * 40) * Math.PI * 0.2

  if (gameStateManager.isObservationMode()) {
    main.value.rotation.z -= main.value.rotation.z * 0.05
    main.value.rotation.x -= main.value.rotation.x * 0.05
    main.value.rotation.y -= main.value.rotation.y * 0.05

    main.value.position.x -= main.value.position.x * 0.05
    main.value.position.y += (25 - main.value.position.y) * 0.05

    const period = 3.0
    const amplitude = 0.3
    main.value.position.x += Math.sin(time / period) * amplitude
    main.value.position.y += Math.cos(time / period * 1.3) * amplitude
  } else if (gameStateManager.canFlightMode()) {
    const mx = mouseX.value;
    const my = mouseY.value;

    if (Math.random() < 0.001) {
      console.log('Ship using mouse position:', { x: mx, y: my })
    }

    // Clamp mouse coordinates to stay within boundaries
    const clampedMouseX = clampValue(mx, boundaries.value.x.min * 5, boundaries.value.x.max * 5)
    const clampedMouseY = clampValue(my, boundaries.value.y.min * 12, boundaries.value.y.max * 12)

    main.value.rotation.z += (clampedMouseX / 500 - main.value.rotation.z) * 0.2
    main.value.rotation.x += (-clampedMouseY / 1200 - main.value.rotation.x) * 0.2
    main.value.rotation.y += (-clampedMouseX / 1200 - main.value.rotation.y) * 0.2

    // Apply clamped values to ship position
    const targetX = clampValue(clampedMouseX / 10, boundaries.value.x.min, boundaries.value.x.max)
    const targetY = clampValue(25 + -clampedMouseY / 10, boundaries.value.y.min, boundaries.value.y.max)

    main.value.position.x += (targetX - main.value.position.x) * 0.2
    main.value.position.y += (targetY - main.value.position.y) * 0.2

    // Get ships orientation and save it to the stores ray
    main.value.getWorldPosition(position)
    main.value.getWorldDirection(direction)
    gameStore.mutation.ray.origin.copy(position)
    gameStore.mutation.ray.direction.copy(direction.negate())
  }

  exhaust.value.scale.x = 1 + Math.sin(time * 200)
  exhaust.value.scale.y = 1 + Math.sin(time * 200)

  if (Array.isArray(laserGroup.value)) {
    for (const g of laserGroup.value) {
      g.position.z -= 20
    }
  }
  const laserActive = gameStore.lasers.length
    && Date.now() - gameStore.lasers[gameStore.lasers.length - 1] < 100

  const targetIntensity = laserActive ? 200000 : 0
  laserLight.value.intensity += (targetIntensity - laserLight.value.intensity) * 0.3

  // Only show crosshair and target in Battle mode
  crossMaterial.color = gameStore.mutation.hits ? lightgreen : hotpink

  // In Battle mode, show crosshair
  if (cross.value) {
    cross.value.visible = gameStateManager.isBattleMode() && !gameStore.mutation.hits
  }

  // In Battle mode, show target indicator when targeting
  if (target.value) {
    target.value.visible = gameStateManager.isBattleMode() && !!gameStore.mutation.hits
  }
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
      <TresPointLight
        ref="laserLight"
        :position="[0, 0, -20]"
        :distance="100"
        :intensity="0"
        color="lightgreen"
      />
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
      <TresGroup :rotation="[Math.PI / 2, Math.PI, 0]">
        <template v-if="modelData.isLoaded">
          <!-- Light_Metal (Renault_0) -->
          <TresMesh
            v-if="modelData.Renault_0"
            :geometry="modelData.Renault_0.geometry"
            :material="modelData.Renault_0.material"
          />

          <!-- Medium_Metal (Renault_1) -->
          <TresMesh
            v-if="modelData.Renault_1"
            :geometry="modelData.Renault_1.geometry"
            :material="modelData.Renault_1.material"
          />

          <!-- Dark_Metal (Renault_2) -->
          <TresMesh
            v-if="modelData.Renault_2"
            :geometry="modelData.Renault_2.geometry"
            :material="modelData.Renault_2.material"
          />

          <!-- Shield (Renault_3) -->
          <TresMesh
            v-if="modelData.Renault_3"
            :geometry="modelData.Renault_3.geometry"
            :material="modelData.Renault_3.material"
          />

          <!-- Engine_Glow (Renault_4) -->
          <TresMesh
            v-if="modelData.Renault_4"
            :geometry="modelData.Renault_4.geometry"
            :material="modelData.Renault_4.material"
          />

          <!-- Blue_Glow (Renault_5) -->
          <TresMesh
            v-if="modelData.Renault_5"
            :geometry="modelData.Renault_5.geometry"
            :material="modelData.Renault_5.material"
          />
        </template>
      </TresGroup>
    </TresGroup>
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