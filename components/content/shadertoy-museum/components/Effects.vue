<script lang="ts" setup>
import { extend, useLoop, useTres } from '@tresjs/core'
import { shallowRef } from 'vue'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

extend({ EffectComposer, RenderPass, UnrealBloomPass, OutputPass })

const { renderer, scene, camera, sizes } = useTres()
const composer = shallowRef<EffectComposer>()

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
  <TresEffectComposer ref="composer" :args="[renderer]" :set-size="[sizes.width.value, sizes.height.value]">
    <TresRenderPass :args="[scene, camera]" attach="passes-0" />
    <TresUnrealBloomPass :args="[undefined, 0.4, 0.3, 0.2]" attach="passes-1" />
    <TresOutputPass attach="passes-2" :set-size="[sizes.width.value, sizes.height.value]" />
  </TresEffectComposer>
</template>