<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { BoxGeometry, Color, Group, MeshBasicMaterial, PointLight, Vector3 } from 'three'
import { onMounted, onUnmounted, inject, shallowRef, computed, watch } from 'vue'

// eslint-disable-next-line import/namespace
import type { GameStore } from '../GameStore'

import { GameMode, ObservationMode } from '../store/constants'
import { ResourceLoader } from '../utils/ResourceLoader'

const geometry = new BoxGeometry(1, 1, 40)
const lightgreen = new Color('lightgreen')
const hotpink = new Color('hotpink')
const laserMaterial = new MeshBasicMaterial({ color: lightgreen })
const crossMaterial = new MeshBasicMaterial({ color: hotpink, fog: false })
const position = new Vector3()
const direction = new Vector3()

const { nodes } = await ResourceLoader.registerModel('ShipModel', '/models/space-game/ship.gltf')
const gameStore = inject('gameStore') as GameStore
const mutation = gameStore.mutation
const { clock, mouse, ray } = mutation

const main = shallowRef(new Group())
const laserGroup = shallowRef(new Group())
const laserLight = shallowRef(new PointLight())
const exhaust = shallowRef(new Group())
const cross = shallowRef(new Group())
const target = shallowRef(new Group())

// Add computed property to check current game mode
const isBattleMode = computed(() => gameStore.gameMode === GameMode.Battle)

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
  if (!gameStore.camera || gameStore.camera.position.z <= 0) {
    setTimeout(updateBoundaries, 100)
    return
  }
  const width: number = window.innerWidth
  const height: number = window.innerHeight

  const effectiveWidth: number = width * (1 - 2 * margins.x)
  const effectiveHeight: number = height * (1 - 2 * margins.y)

  const cameraZ: number = Math.max(gameStore.camera.position.z, 100)
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

watch(() => gameStore.camera.position.z, () => {
  updateBoundaries()
})

useLoop().onBeforeRender(() => {
  const time = clock.getElapsedTime()
  main.value.position.z = Math.sin(time * 40) * Math.PI * 0.2

  if (gameStore.observationMode === ObservationMode.None) {
    // Clamp mouse coordinates to stay within boundaries
    const clampedMouseX = clampValue(mouse.x, boundaries.value.x.min * 5, boundaries.value.x.max * 5)
    const clampedMouseY = clampValue(mouse.y, boundaries.value.y.min * 12, boundaries.value.y.max * 12)

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
    ray.origin.copy(position)
    ray.direction.copy(direction.negate())
  }
  else {
    main.value.rotation.z -= main.value.rotation.z * 0.05
    main.value.rotation.x -= main.value.rotation.x * 0.05
    main.value.rotation.y -= main.value.rotation.y * 0.05

    main.value.position.x -= main.value.position.x * 0.05
    main.value.position.y += (25 - main.value.position.y) * 0.05

    const period = 3.0
    const amplitude = 0.3
    main.value.position.x += Math.sin(time / period) * amplitude
    main.value.position.y += Math.cos(time / period * 1.3) * amplitude
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
  crossMaterial.color = mutation.hits ? lightgreen : hotpink

  // Hide crosshair in Explore mode
  if (cross.value) {
    cross.value.visible = isBattleMode.value && !mutation.hits
  }

  // In Battle mode, show target indicator when targeting
  if (target.value) {
    target.value.visible = isBattleMode.value && !!mutation.hits
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
        <TresMesh
          name="Renault_(S,_T1)_0"
          :geometry="nodes['Renault_(S,_T1)_0'].geometry"
        >
          <TresMeshStandardMaterial color="#070707" />
        </TresMesh>
        <TresMesh
          name="Renault_(S,_T1)_1"
          :geometry="nodes['Renault_(S,_T1)_1'].geometry"
        >
          <TresMeshStandardMaterial color="black" />
        </TresMesh>
        <TresMesh
          name="Renault_(S,_T1)_2"
          :geometry="nodes['Renault_(S,_T1)_2'].geometry"
        >
          <TresMeshStandardMaterial color="#070707" />
        </TresMesh>
        <TresMesh
          name="Renault_(S,_T1)_3"
          :geometry="nodes['Renault_(S,_T1)_3'].geometry"
        >
          <TresMeshBasicMaterial color="lightblue" />
        </TresMesh>
        <TresMesh
          name="Renault_(S,_T1)_4"
          :geometry="nodes['Renault_(S,_T1)_4'].geometry"
        >
          <TresMeshBasicMaterial color="white" />
        </TresMesh>
        <TresMesh
          name="Renault_(S,_T1)_5"
          :geometry="nodes['Renault_(S,_T1)_5'].geometry"
        >
          <TresMeshBasicMaterial color="teal" />
        </TresMesh>
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