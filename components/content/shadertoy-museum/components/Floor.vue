<script setup lang="ts">
import { useTexture } from '@tresjs/core'
import { Euler, Vector3, Color } from 'three'
import MeshReflectionMaterial from '../meshReflectionMaterial/index.vue'

import type { State } from '../index.vue'

const normalMapSrc = '/textures/shadertoy-museum/normal.jpg'
const normalMap = await useTexture([normalMapSrc])

const roughnessMapSrc = '/textures/shadertoy-museum/roughness.jpg'
const roughnessMap = await useTexture([roughnessMapSrc])

const displacementMapSrc = '/textures/shadertoy-museum/displacement.png'
const displacementMap = await useTexture([displacementMapSrc])

const state = inject('state') as State
const position = shallowRef(new Vector3())
const rotation = shallowRef(new Euler())
const scale = shallowRef(new Vector3())

watch(() => state.i, () => {
  const targetInfo = state.shaderToyTargets[state.i] ?? {}

  if (targetInfo.floor) {
    position.value = targetInfo.floor.position
    rotation.value = targetInfo.floor.rotation
    scale.value = targetInfo.floor.scale
  }
})
</script>

<template>
  <TresMesh :position="position" :scale="scale" :rotation="rotation">
    <TresPlaneGeometry />
    <MeshReflectionMaterial :mix="0.4" :sharpMix="0.9" :blurMixSmooth="0.3" :normal-map="normalMap"
      :roughness-map="roughnessMap" :displacement-map="displacementMap" :color="new Color('#989898')" :roughness="0.2"
      :metalness="0.05" />
  </TresMesh>
</template>