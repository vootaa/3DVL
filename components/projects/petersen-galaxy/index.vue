<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three'
import OrbitalSystem from './OrbitalSystem.vue'

const gl = {
  clearColor: '#000811', // Very dark blue instead of pure black for better depth perception
  shadows: true,
  alpha: false,
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
}
</script>

<template>
  <TresCanvas v-bind="gl">
    <TresPerspectiveCamera :position="[10, 8, 10]" :fov="60" />
    
    <!-- Subtle ambient lighting for better 3D perception -->
    <TresAmbientLight :intensity="0.05" color="#004488" />
    
    <!-- Very faint grid helper for spatial reference (optional) -->
    <TresGridHelper 
      :size="20" 
      :divisions="20" 
      color1="#001122" 
      color2="#001122"
      :position="[0, -2, 0]"
    />
    
    <OrbitalSystem />
    <OrbitControls />
  </TresCanvas>
</template>
