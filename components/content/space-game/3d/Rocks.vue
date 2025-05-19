<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { BufferGeometry, Material } from 'three'

import { useLoop } from '@tresjs/core'
import { Group, MeshStandardMaterial, Color } from 'three'
import { inject, shallowRef, ref, onMounted } from 'vue'

import type { ObjectData } from '../store/types'
import type { GameStore } from '../GameStore'

import { ResourceLoader } from '../utils/ResourceLoader'

const gameStore: GameStore = inject('gameStore') as GameStore
const rocksGroupRef = shallowRef(new Group())

const fallbackMaterial = new MeshStandardMaterial({
  color: new Color(0x888888),
  roughness: 1,
  metalness: 0.2,
})

interface GLTFNode {
  geometry: BufferGeometry
  material: Material | Material[]
}

const modelData = ref({
  stoneNode: null as GLTFNode | null,
  isLoaded: false,
})

onMounted(async () => {
  try {
    const result = await ResourceLoader.registerModel('RockModel', '/models/space-game/Stone.glb')
    if (result?.nodes?.Stone) {
      modelData.value.stoneNode = result.nodes.Stone as GLTFNode
      modelData.value.isLoaded = true
      console.log('RockModel loaded successfully')
    }
    else {
      console.error('RockModel missing Stone node')
    }
  }
  catch (error) {
    console.error('Failed to load RockModel:', error)
  }
})

const { clock } = gameStore.mutation

useLoop().onBeforeRender(() => {
  let i = 0
  for (const data of gameStore.rocks as ObjectData[]) {
    const rock = rocksGroupRef.value.children[i] 
    if (rock) {
      const r = clock.elapsedTime * data.speed
      rock.rotation.set(r, r, r)
    }
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
      :scale="[data.scale, data.scale, data.scale]"
    >
      <TresGroup
        :position="[-0.016, -0.012, 0.24]"
        :rotation="[3.00, 0.27, -0.22]"
        :scale="[1, 1, 1]"
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