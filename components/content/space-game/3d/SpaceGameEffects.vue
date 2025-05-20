<script lang="ts" setup>
import { extend, useLoop, useTres } from '@tresjs/core'
import { shallowRef, onMounted, onUnmounted, nextTick, watch } from 'vue'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

extend({ EffectComposer, RenderPass, OutputPass, UnrealBloomPass })

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

onUnmounted(() => {
  if (composer.value) {
    composer.value.dispose()
  }
})

const loop = useLoop()
loop.render(() => {
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
      :args="[undefined, 0.5, 0.1, 0]"
      attach="passes-1"
    />
    <TresOutputPass attach="passes-2" />
  </TresEffectComposer>
</template>