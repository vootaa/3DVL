<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three'
import gsap from 'gsap'
import OrbitalSystem from './OrbitalSystem.vue'

const gl = {
  clearColor: 'black',
  shadows: true,
  alpha: false,
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
}

onMounted(() => {
  gsap.to('.title', {
    delay: 0.5,
    opacity: 1,
    y: 2,
    display: 'block',
    duration: 0.5,
    ease: 'expo.out',
  })
})
</script>

<template>
  <h1
    class="title font-title text-6xl text-white fixed top-8 transform w-full text-center display-none opacity-0 z-10 pointer-events-none"
  >
    Petersen Galaxy Evolution 🌌
  </h1>
  <TresCanvas v-bind="gl">
    <TresPerspectiveCamera :position="[8, 6, 8]" />
    <OrbitalSystem />
    <OrbitControls />
  </TresCanvas>
</template>
