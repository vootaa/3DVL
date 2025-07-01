<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three'
import OrbitalSystem from './OrbitalSystem.vue'
import GridControl from './GridControl.vue'

const gl = {
  clearColor: '#000811', // Very dark blue instead of pure black for better depth perception
  shadows: true,
  alpha: false,
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
}

const gridControlRef = ref()
</script>

<template>
  <div class="galaxy-container">
    <TresCanvas v-bind="gl">
      <TresPerspectiveCamera :position="[10, 8, 10]" :fov="60" />
      
      <!-- Subtle ambient lighting for better 3D perception -->
      <TresAmbientLight :intensity="0.05" color="#004488" />
      
      <!-- Conditionally rendered grid helper -->
      <TresGridHelper 
        v-if="gridControlRef?.showGrid"
        :size="20" 
        :divisions="20" 
        color1="#000611" 
        color2="#000611"
        :position="[0, -2, 0]"
      />
      
      <OrbitalSystem />
      <OrbitControls />
    </TresCanvas>
    
    <!-- Grid control HUD -->
    <GridControl ref="gridControlRef" />
  </div>
</template>

<style scoped>
.galaxy-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
