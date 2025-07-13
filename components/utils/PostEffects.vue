<script setup lang="ts">
import { extend, useLoop, useTres } from '@tresjs/core'
import { shallowRef, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Logger } from './logger'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

extend({ EffectComposer, RenderPass, UnrealBloomPass, OutputPass })

interface Props {
  bloomStrength?: number
  bloomRadius?: number
  bloomThreshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  bloomStrength: 0.3,
  bloomRadius: 0.4,
  bloomThreshold: 0.1
})

const { renderer, scene, camera, sizes } = useTres()
const composer = shallowRef<EffectComposer>()

onMounted(() => {
  nextTick(() => {
    if (composer.value) {
      composer.value.setSize(sizes.width.value, sizes.height.value)
      Logger.log('PostEffects', 'Composer setSize onMounted', { width: sizes.width.value, height: sizes.height.value })
    }
  })
})

watch([() => sizes.width.value, () => sizes.height.value], () => {
  if (composer.value) {
    composer.value.setSize(sizes.width.value, sizes.height.value)
    Logger.log('PostEffects', 'Composer setSize on resize', { width: sizes.width.value, height: sizes.height.value })
  }
})

onUnmounted(() => {
  if (composer.value) {
    composer.value.dispose()
    Logger.log('PostEffects', 'Composer disposed')
  }
})

useLoop().render(() => {
  try {
    if (composer.value) {
      composer.value.render()
    }
  }
  catch (error) {
    Logger.error('PostEffects', 'Render Error', error)
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)
      Logger.warn('PostEffects', 'Fallback to renderer.render')
    }
  }
})
</script>

<template>
  <TresEffectComposer ref="composer" :args="[renderer]" :set-size="[sizes.width.value, sizes.height.value]">
    <TresRenderPass :args="[scene, camera]" attach="passes-0" />
    <TresUnrealBloomPass :args="[undefined, props.bloomStrength, props.bloomRadius, props.bloomThreshold]"
      attach="passes-1" />
    <TresOutputPass attach="passes-2" />
  </TresEffectComposer>
</template>