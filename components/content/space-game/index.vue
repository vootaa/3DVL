<!-- eslint-disable no-console -->
<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { SRGBColorSpace, NoToneMapping, PerspectiveCamera } from 'three'
import { onMounted, onUnmounted, provide, shallowRef, ref, watch, nextTick } from 'vue'

import { GameMode } from './store/constants'
import { initializeActions } from './store/actions'
import { ResourceLoader } from './utils/ResourceLoader'

import LaunchScreen from './controls/LaunchScreen.vue'
import SoundControl from './controls/SoundControl.vue'
import InfoTextControl from './controls/InfoTextControl.vue'
import ControlPanel from './controls/ControlPanel.vue'
import ObservationControls from './controls/ObservationControls.vue'
import HudControl from './controls/HudControl.vue'
import Game from './Game.vue'

import { initializeAudio } from './utils/audio'

// eslint-disable-next-line import/namespace
import { gameStore } from './GameStore'

provide('gameStore', gameStore)
const cameraRef = shallowRef(new PerspectiveCamera())

const isMounted = ref(false)
const resourcesLoaded = ref(false)
const loadingProgress = ref(0)
const gameActive = ref(false)

// 添加清理函数数组来管理动态创建的监听器
const cleanupFunctions: (() => void)[] = []

onMounted(async () => {
  isMounted.value = true
  // Start loading resources
  await ResourceLoader.loadAllResources()
})

onUnmounted(() => {
  isMounted.value = false
  // 清理所有动态创建的监听器
  cleanupFunctions.forEach(cleanup => cleanup())
  cleanupFunctions.length = 0
})

// Monitor resource loading progress
watch(() => ResourceLoader.loadingProgress, (newVal) => {
  loadingProgress.value = newVal
})

// Monitor resource loading completion status
watch(() => ResourceLoader.isLoaded, (newVal) => {
  resourcesLoaded.value = newVal
})

const initializeGame = async () => {
  if (!isMounted.value) {
    console.warn('Component is not mounted, skipping game initialization')
    return
  }

  if (cameraRef.value) {
    console.log('Initializing game with camera:', cameraRef.value)

    try {
      const audioSystem = await initializeAudio(cameraRef.value)
      gameStore.audioSystem = audioSystem
    }
    catch (error) {
      console.error('Failed to initialize audio:', error)
      gameStore.audioError = true
      gameStore.sound = false
    }

    if (!isMounted.value) return

    gameStore.actions.init(cameraRef.value)

    // 在同步上下文中设置 gameActive
    if (isMounted.value) {
      gameActive.value = true
      console.log('Game activated')
    }
  }
  else {
    console.error('Cannot start game: No camera reference available')
  }
}

const start = async (mode: 'battle' | 'explore') => {
  console.log('Start function called with mode:', mode)
  console.log('Resources loaded status:', resourcesLoaded.value)

  if (!isMounted.value) {
    console.warn('Component not mounted, cannot start game')
    return
  }

  if (!resourcesLoaded.value) {
    console.warn('Resources not fully loaded yet, waiting...')

    const timeout = setTimeout(() => {
      console.warn('Resource loading timeout, forcing completion')
      ResourceLoader.forceComplete()
    }, 20000)

    try {
      await new Promise<void>((resolve, reject) => {
        // 检查组件是否还在挂载状态
        if (!isMounted.value) {
          clearTimeout(timeout)
          reject(new Error('Component unmounted during resource loading'))
          return
        }

        const unwatch = watch(() => resourcesLoaded.value, (loaded) => {
          if (loaded) {
            clearTimeout(timeout)
            unwatch()
            resolve()
          }
        }, { immediate: true })

        // 将清理函数添加到数组中
        cleanupFunctions.push(() => {
          clearTimeout(timeout)
          unwatch()
        })
      })
      console.log('Resources now loaded, continuing game start')
    }
    catch (error) {
      console.error('Error waiting for resources:', error)
    }
  }

  // 再次检查组件状态
  if (!isMounted.value) {
    console.warn('Component unmounted during initialization')
    return
  }

  console.log('Setting game mode to:', mode)
  if (mode === 'battle') {
    gameStore.gameMode = GameMode.Battle
  }
  else {
    gameStore.gameMode = GameMode.Explore
  }

  // Initialize actions & start game
  initializeActions(gameStore)
  gameStore.actions.startGame(false)

  // 同步初始化游戏，避免异步上下文
  if (isMounted.value) {
    await initializeGame()
  }
}
</script>

<template>
  <div>
    <LaunchScreen v-if="!gameActive" :resources-loaded="resourcesLoaded" :progress="loadingProgress" @launch="start" />
    <div v-if="gameActive" class="full-screen" @pointerdown="gameStore.actions.shoot"
      @pointermove="gameStore.actions.updateMouse">
      <TresCanvas clear-color="#010104" :linear="true" :flat="true" :antialias="false" :tone-mapping="NoToneMapping"
        :output-encoding="SRGBColorSpace">
        <TresPerspectiveCamera ref="cameraRef" :position="[0, 0, 2000]" :near="0.01" :far="10000"
          :fov="gameStore.mutation.fov" />
        <TresFog color="#121225" :near="150" :far="600" />
        <Game />
      </TresCanvas>
      <SoundControl />
      <InfoTextControl />
      <ControlPanel />
      <ObservationControls />
      <HudControl />
    </div>
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
