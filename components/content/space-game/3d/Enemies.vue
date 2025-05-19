<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { BufferGeometry, Material } from 'three'

import { useLoop } from '@tresjs/core'
import { Box3, Vector3, MeshBasicMaterial, Color, MeshPhongMaterial, Group } from 'three'
import { inject, shallowRef, ref, onMounted } from 'vue'

import type { GameStore } from '../GameStore'
import type { ObjectData } from '../store/types'

import { ResourceLoader } from '../utils/ResourceLoader'

const gameStore = inject('gameStore') as GameStore
const enemiesGroupRef = shallowRef([new Group()])

const box = new Box3()
box.setFromCenterAndSize(new Vector3(0, 0, 1), new Vector3(3, 3, 3))
const glowMaterial = new MeshBasicMaterial({ color: new Color('lightblue') })
const bodyMaterial = new MeshPhongMaterial({ color: new Color('black') })

interface GLTFNode {
  geometry: BufferGeometry
  material: Material | Material[]
}

interface PodModelData {
  props_pod_1?: GLTFNode | null // Main
  props_pod_2?: GLTFNode | null // DarkGrey
  props_pod_3?: GLTFNode | null // DarkAccent
  props_pod_4?: GLTFNode | null // Accent
  props_pod_5?: GLTFNode | null // Glass
  isLoaded: boolean
}

const modelData = ref<PodModelData>({
  isLoaded: false,
})

onMounted(async () => {
  try {
    const result = await ResourceLoader.registerModel('PodModel', '/models/space-game/Pod.glb')
    if (result?.nodes) {
      modelData.value = {
        props_pod_1: result.nodes.Props_Pod_1 as GLTFNode | undefined || null,
        props_pod_2: result.nodes.Props_Pod_2 as GLTFNode | undefined || null,
        props_pod_3: result.nodes.Props_Pod_3 as GLTFNode | undefined || null,
        props_pod_4: result.nodes.Props_Pod_4 as GLTFNode | undefined || null,
        props_pod_5: result.nodes.Props_Pod_5 as GLTFNode | undefined || null,
        isLoaded: true,
      }

      if (!modelData.value.props_pod_1) {
        console.error('Missing main Pod component (Props_Pod_1)')
        modelData.value.isLoaded = false
      }
      else {
        console.log('PodModel loaded successfully')
      }
    }
    else {
      console.error('PodModel model loaded but nodes are missing')
      modelData.value.isLoaded = false
    }
  }
  catch (error) {
    console.error('Failed to load PodModel:', error)
    modelData.value.isLoaded = false
  }
})

const clock = gameStore.mutation.clock

useLoop().onBeforeRender(() => {
  let i = 0
  for (const enemy of enemiesGroupRef.value) {
    const data = gameStore.enemies[i] as ObjectData
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
    :scale="[20, 20, 20]"
  >
    <TresMesh
      :position="[0, 0, 50]"
      :rotation="[Math.PI / 2, 0, 0]"
      :material="glowMaterial"
    >
      <TresCylinderGeometry :args="[0.25, 0.25, 100, 4]" />
    </TresMesh>
    <template v-if="modelData.isLoaded">
      <!-- Main (Props_Pod_1) -->
      <TresMesh
        v-if="modelData.props_pod_1"
        :geometry="modelData.props_pod_1.geometry"
        :material="modelData.props_pod_1.material"
      />

      <!-- DarkGrey (Props_Pod_2) -->
      <TresMesh
        v-if="modelData.props_pod_2"
        :geometry="modelData.props_pod_2.geometry"
        :material="modelData.props_pod_2.material"
      />

      <!-- DarkAccent (Props_Pod_3) -->
      <TresMesh
        v-if="modelData.props_pod_3"
        :geometry="modelData.props_pod_3.geometry"
        :material="modelData.props_pod_3.material"
      />

      <!-- Accent (Props_Pod_4) -->
      <TresMesh
        v-if="modelData.props_pod_4"
        :geometry="modelData.props_pod_4.geometry"
        :material="modelData.props_pod_4.material"
      />

      <!-- Glass (Props_Pod_5) -->
      <TresMesh
        v-if="modelData.props_pod_5"
        :geometry="modelData.props_pod_5.geometry"
        :material="modelData.props_pod_5.material"
      />
    </template>

    <template v-if="!modelData.isLoaded">
      <TresMesh :material="bodyMaterial">
        <TresSphereGeometry :args="[1, 16, 16]" />
      </TresMesh>
    </template>
  </TresGroup>
</template>