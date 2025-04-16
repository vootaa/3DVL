<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { SRGBColorSpace, NoToneMapping } from 'three'
import { onMounted, provide, shallowRef } from 'vue'
import Game from './Game.vue'
import { gameStore } from './GameStore'
import Hud from './Hud.vue'
import SoundControl from './controls/SoundControl.vue'
import ControlPanel from './controls/ControlPanel.vue'
import ObservationControls from './controls/ObservationControls.vue';

provide('gameStore', gameStore)
const camera = shallowRef()
onMounted(() => { gameStore.actions.init(camera.value) })
</script>

<template>
  <div class="full-screen" @pointermove="gameStore.actions.updateMouse" @pointerdown="gameStore.actions.shoot">
    <TresCanvas clear-color="#010104" :linear="true" :flat="true" :antialias="false" :tone-mapping="NoToneMapping"
      :output-encoding="SRGBColorSpace">
      <TresPerspectiveCamera ref="camera" :position="[0, 0, 2000]" :near="0.01" :far="20000"
        :fov="gameStore.mutation.fov" />
      <TresFog color="#121225" :near="150" :far="600" />
      <Game />
    </TresCanvas>
    <Hud />
    <SoundControl />
    <ControlPanel />
    <ObservationControls />
  </div>
</template>

<style scoped>
.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
