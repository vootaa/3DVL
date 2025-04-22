<script lang="ts" setup>
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { extend, useLoop, useTres } from '@tresjs/core'
import { shallowRef, watch, onMounted, nextTick } from 'vue'
import { Vector2 } from 'three'

extend({ EffectComposer, RenderPass, ShaderPass, UnrealBloomPass })

const { renderer, scene, camera, sizes } = useTres()
const composer = shallowRef()

onMounted(() => {
  nextTick(() => {
    if (composer.value) {
      composer.value.setSize(sizes.width.value, sizes.height.value)
    }
  })
})

watch([() => sizes.width.value, () => sizes.height.value], () => {
  if (composer.value) {
    composer.value.setSize(sizes.width.value, sizes.height.value)
  }
})

useLoop().render(() => {
  try {
    if (composer.value) {
      composer.value.render()
    }
  }
  catch (error) {
    console.error('Render Error:', error)
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)
    }
  }
})
</script>

<template>
  <TresEffectComposer
    ref="composer"
    :args="[renderer]"
  >
    <TresRenderPass
      :args="[scene, camera]"
      attach="passes-0"
    />
    <TresUnrealBloomPass
      :args="[new Vector2(sizes.width.value, sizes.height.value), 0.5, 0.1, 0]"
      attach="passes-1"
    />
    <TresOutputPass
      attach="passes-2"
      :set-size="[sizes.width.value, sizes.height.value]"
    />
  </TresEffectComposer>
</template>