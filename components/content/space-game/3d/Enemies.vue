<script setup lang="ts">
import { useLoader, useLoop } from '@tresjs/core'
import { Box3, Vector3, MeshBasicMaterial, Color, MeshPhongMaterial, Group } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { inject, shallowRef } from 'vue'
import type { GameStore } from '../GameStore'

const gameStore = inject('gameStore') as GameStore
const clock = gameStore.mutation.clock

const box = new Box3()
box.setFromCenterAndSize(new Vector3(0, 0, 1), new Vector3(3, 3, 3))
const glowMaterial = new MeshBasicMaterial({ color: new Color('lightblue') })
const bodyMaterial = new MeshPhongMaterial({ color: new Color('black') })

const { nodes, materials } = await useLoader(GLTFLoader as any, '/models/space-game/spacedrone.gltf') as any
const ref = shallowRef([new Group()])

useLoop().onBeforeRender(() => {
  let i = 0
  for (const enemy of ref.value) {
    const data = gameStore.enemies[i]
    if (data) {
      const r = Math.cos((clock.getElapsedTime() / 2) * data.speed) * Math.PI
      enemy.position.copy(data.offset)
      enemy.rotation.set(r, r, r)
    }
    i++
  }
})
</script>

<template>
  <TresGroup
    v-for="enemy, i of gameStore.enemies"
    :key="i"
    ref="ref"
    :scale="[5, 5, 5]"
  >
    <TresMesh
      :position="[0, 0, 50]"
      :rotation="[Math.PI / 2, 0, 0]"
      :material="glowMaterial"
    >
      <TresCylinderGeometry :args="[0.25, 0.25, 100, 4]" />
    </TresMesh>
    <TresMesh
      name="Sphere_DroneGlowmat_0"
      :geometry="nodes.Sphere_DroneGlowmat_0.geometry"
      :material="materials.DroneGlowmat"
    />
    <TresMesh
      name="Sphere_Body_0"
      :geometry="nodes.Sphere_Body_0.geometry"
      :material="bodyMaterial"
    />
  </TresGroup>
</template>