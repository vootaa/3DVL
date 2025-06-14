<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import type { PerspectiveCamera } from 'three'
import { Group } from 'three'
import { inject, shallowRef } from 'vue'
import type { GameStore } from '../GameStore'

let offset = 0

const groupRef = shallowRef(new Group())
const rig = shallowRef(new Group())
const { mutation } = inject('gameStore') as GameStore
const { scale, binormal, normal, track, mouse } = mutation

useLoop().onAfterRender(({ camera }) => {
  const t = mutation.t
  const pos = mutation.position.clone()
  const segments = track.tangents.length
  const pickt = t * segments
  const pick = Math.floor(pickt)
  const pickNext = (pick + 1) % segments
  binormal.subVectors(track.binormals[pickNext], track.binormals[pick])
  binormal.multiplyScalar(pickt - pick).add(track.binormals[pick])
  const dir = track.parameters.path.getTangentAt(t)
  offset += (Math.max(15, 15 + -mouse.y / 20) - offset) * 0.05
  normal.copy(binormal).cross(dir)
  pos.add(normal.clone().multiplyScalar(offset))
  camera.position.copy(pos)
  const pathOffset = (t + 30 / track.parameters.path.getLength()) % 1
  const lookAt = track.parameters.path.getPointAt(pathOffset).multiplyScalar(scale)
  camera.matrix.lookAt(camera.position, lookAt, normal)
  camera.quaternion.setFromRotationMatrix(camera.matrix);
  (camera as PerspectiveCamera).updateProjectionMatrix()
  const lightPathOffset = (t + 1 / track.parameters.path.getLength()) % 1
  const lightPos = track.parameters.path.getPointAt(lightPathOffset).multiplyScalar(scale)
  groupRef.value.position.copy(lightPos)
  groupRef.value.quaternion.setFromRotationMatrix(camera.matrix)
})
</script>

<template>
  <TresGroup ref="groupRef">
    <TresDirectionalLight
      :intensity="1"
      color="indianred"
    />
    <TresGroup
      ref="rig"
      :position="[0, 0, -50]"
    >
      <slot />
    </TresGroup>
  </TresGroup>
</template>