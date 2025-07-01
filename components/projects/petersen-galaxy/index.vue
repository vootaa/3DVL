<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three'
import { ref, provide} from 'vue'
import OrbitalSystem from './OrbitalSystem.vue'
import StarCluster from './StarCluster.vue'
import StarControl from './StarControl.vue'
import GridControl from './GridControl.vue'
import CameraInfo from './CameraInfo.vue'

const gl = {
  clearColor: '#000811', // Very dark blue instead of pure black for better depth perception
  shadows: true,
  alpha: false,
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
}

const gridControlRef = ref()
const starControlRef = ref()
const cameraRef = ref()

// Provide camera reference to child components
provide('camera', cameraRef)

// OrbitControls configuration with zoom limits
const orbitControlsConfig = {
  enableDamping: true,
  dampingFactor: 0.05,
  minDistance: 2,    // Minimum zoom distance
  maxDistance: 10,   // Maximum zoom distance
  minPolarAngle: Math.PI * 0.1,  // Minimum vertical angle (prevent going below)
  maxPolarAngle: Math.PI * 0.9,  // Maximum vertical angle (prevent going above)
  enablePan: false,  // Disable panning to focus on orbital movement
}
</script>

<template>
  <div class="galaxy-container">
    <TresCanvas v-bind="gl">
      <TresPerspectiveCamera ref="cameraRef" :position="[10, 8, 10]" :fov="60" />
      
      <!-- Subtle ambient lighting for better 3D perception -->
      <TresAmbientLight :intensity="0.05" color="#004488" />

      <TresGridHelper 
        v-if="gridControlRef?.showGrid"
        :size="20" 
        color1="#002244" 
        color2="#001122"
        :position="[0, -3, 0]"
      />
      
      <OrbitalSystem />
      
      <!-- Star cluster component - conditional display -->
      <StarCluster v-if="starControlRef?.showStars" />
      
      <!-- OrbitControls with zoom and angle limits -->
      <OrbitControls 
        v-bind="orbitControlsConfig"
      />
    </TresCanvas>
    
    <!-- Star cluster control panel (top-right) -->
    <StarControl ref="starControlRef" />
    
    <!-- Grid control HUD (top-left) -->
    <GridControl ref="gridControlRef" />
    
    <!-- Camera info HUD (bottom-left) -->
    <CameraInfo />
  </div>
</template>

<style scoped>
.galaxy-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
