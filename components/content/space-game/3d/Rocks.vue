<script setup lang="ts">
import { inject, shallowRef } from 'vue'
import { useLoop, useLoader } from '@tresjs/core'
import { Group } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GameStore } from '../GameStore'

const gameStore: GameStore = inject('gameStore') as GameStore
const rocksGroupRef = shallowRef(new Group())

const { nodes, materials } = await useLoader(GLTFLoader as any, '/models/space-game/rock.gltf') as any
const { clock } = gameStore.mutation

useLoop().onBeforeRender(() => {
  let i = 0
  for (const data of gameStore.rocks) {
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
      v-for="data of gameStore.rocks"
      :key="data.guid"
      :position="data.offset"
      :scale="[data.scale, data.scale, data.scale]"
    >
      <TresGroup
        :position="[-0.016298329457640648, -0.012838120572268963, 0.24073271453380585]"
        :rotation="[3.0093872578726644, 0.27444228385461117, -0.22745113653772078]"
        :scale="[20, 20, 20]"
      >
        <TresMesh
          :geometry="nodes.node_id4_Material_52_0.geometry"
          :material="materials.Material_52"
          :material-roughness="1"
          :material-metalness="1"
        />
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>