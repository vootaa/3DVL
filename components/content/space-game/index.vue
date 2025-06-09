<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { SRGBColorSpace, NoToneMapping, PerspectiveCamera } from 'three'
import { onMounted, onUnmounted, provide, shallowRef, ref, watch, nextTick } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import { Logger } from '../logger'
import { ResourceLoader } from './utils/ResourceLoader'
import { initializeAudio } from './utils/audio'
import { GameController } from './core/GameController'
import { mouseEventManager } from './core/MouseEventManager'

import LaunchScreen from './controls/LaunchScreen.vue'
import SoundControl from './controls/SoundControl.vue'
import TrackControl from './controls/TrackControl.vue'
import InfoTextControl from './controls/InfoTextControl.vue'
import HudControl from './controls/HudControl.vue'
import ControlPanel from './controls/ControlPanel.vue'
import ObservationControls from './controls/ObservationControls.vue'
import Game from './Game.vue'

import { gameStore } from './GameStore'

// Provide game store and controller
provide('gameStore', gameStore)

// Provide game controller
const gameController = shallowRef<GameController | null>(null)
provide('gameController', gameController)

const cameraRef = shallowRef(new PerspectiveCamera())
const tresCanvasRef = ref<ComponentPublicInstance | null>(null)

const isMounted = ref(false)
const resourcesLoaded = ref(false)
const loadingProgress = ref(0)
const gameActive = ref(false)

onMounted(async () => {
  Logger.log('SPACE_GAME', 'Component mounted, starting initialization')
  isMounted.value = true
  await ResourceLoader.loadAllResources()
})

onUnmounted(() => {
  Logger.log('SPACE_GAME', 'Component unmounting, cleaning up')
  isMounted.value = false
  if (gameController.value) {
    gameController.value.cleanup()
  }
})

watch(() => gameActive.value, (isActive) => {
  if (isActive) {
    Logger.log('SPACE_GAME', 'Game activated, initializing canvas and mouse events')
    nextTick(() => {
      setTimeout(() => {
        const canvas = tresCanvasRef.value?.$el?.querySelector('canvas')

        if (canvas) {
          Logger.log('SPACE_GAME', 'Canvas element found via ref', { 
            canvasWidth: canvas.width,
            canvasHeight: canvas.height 
          })
          mouseEventManager.setGameStore(gameStore).setCanvasElement(canvas).setActiveState(true)
        } else {
          const canvasBySelector = document.querySelector('.full-screen canvas')

          if (canvasBySelector) {
            Logger.log('SPACE_GAME', 'Canvas element found via selector', {
              canvasWidth: (canvasBySelector as HTMLCanvasElement).width,
              canvasHeight: (canvasBySelector as HTMLCanvasElement).height
            })
            mouseEventManager
              .setGameStore(gameStore)
              .setCanvasElement(canvasBySelector as HTMLCanvasElement)
              .setActiveState(true)
          } else {
            Logger.error('SPACE_GAME', 'Canvas element not found', {
              refExists: !!tresCanvasRef.value,
              hasEl: !!tresCanvasRef.value?.$el,
              fullScreenElementExists: !!document.querySelector('.full-screen')
            })
          }
        }
      }, 500)
    })
  }
})

// Monitor resource loading progress
watch(() => ResourceLoader.loadingProgress, (newVal) => {
  loadingProgress.value = newVal
  Logger.throttle('SPACE_GAME', 'Resource loading progress', {
    progress: newVal,
    isComplete: newVal >= 100
  })
})

// Monitor resource loading completion status
watch(() => ResourceLoader.isLoaded, (newVal) => {
  resourcesLoaded.value = newVal
  if (newVal) {
    Logger.log('SPACE_GAME', 'All resources loaded successfully')
  }
})

const initializeGame = async () => {
  if (!isMounted.value || !cameraRef.value) {
    Logger.error('SPACE_GAME', 'Game initialization failed - missing requirements', {
      isMounted: isMounted.value,
      hasCamera: !!cameraRef.value
    })
    return false
  }

  Logger.log('SPACE_GAME', 'Starting game initialization')

  try {
    // Initialize audio system
    try {
      const audioSystem = await initializeAudio(cameraRef.value)
      gameStore.audioSystem = audioSystem
      Logger.log('SPACE_GAME', 'Audio system initialized successfully')
    } catch (error) {
      Logger.error('SPACE_GAME', 'Failed to initialize audio', { error })
      gameStore.audioError = true
      gameStore.sound = false
    }

    if (!isMounted.value) {
      Logger.error('SPACE_GAME', 'Component unmounted during initialization')
      return false
    }

    await nextTick()

    // Initialize game controller
    gameController.value = new GameController(gameStore)
    Logger.log('SPACE_GAME', 'Game controller created')

    // Initialize camera
    if (cameraRef.value) {
      gameStore.camera = cameraRef.value
      gameStore.camera.far = 10000
      gameStore.actions.init(cameraRef.value)
      Logger.log('SPACE_GAME', 'Camera initialized', {
        far: gameStore.camera.far,
        fov: gameStore.camera.fov
      })
    }

    // Start game clock
    gameStore.mutation.clock.start()
    Logger.log('SPACE_GAME', 'Game clock started')

    if (isMounted.value) {
      gameActive.value = true
      Logger.log('SPACE_GAME', 'Game initialized successfully')
    }
  } catch (error) {
    Logger.error('SPACE_GAME', 'Game initialization failed', { error })
    return false
  }

  return true
}

const start = async (mode: 'battle' | 'explore') => {
  if (!isMounted.value || !resourcesLoaded.value) {
    Logger.error('SPACE_GAME', 'Cannot start game - requirements not met', {
      isMounted: isMounted.value,
      resourcesLoaded: resourcesLoaded.value
    })
    return
  }

  Logger.log('SPACE_GAME', 'Starting game', { mode })

  const success = await initializeGame()
  if (!success || !gameController.value) {
    Logger.error('SPACE_GAME', 'Game start failed - initialization unsuccessful', {
      initSuccess: success,
      hasController: !!gameController.value
    })
    return
  }

  try {
    await nextTick()

    // Start the selected game mode
    if (mode === 'battle') {
      await gameController.value.startBattleMode()
      Logger.log('SPACE_GAME', 'Battle mode started successfully')
    } else {
      await gameController.value.startExploreMode()
      Logger.log('SPACE_GAME', 'Explore mode started successfully')
    }
  } catch (error) {
    Logger.error('SPACE_GAME', `Failed to start ${mode} mode`, { mode, error })
  }
}
</script>

<template>
  <div>
    <LaunchScreen v-if="!gameActive" :resources-loaded="resourcesLoaded" :progress="loadingProgress" @launch="start" />
    <div v-if="gameActive" class="full-screen">
      <TresCanvas ref="tresCanvasRef" clear-color="#010104" :linear="true" :flat="true" :antialias="false"
        :tone-mapping="NoToneMapping" :output-encoding="SRGBColorSpace">
        <TresPerspectiveCamera ref="cameraRef" :position="[0, 0, 2000]" :near="0.01" :far="10000"
          :fov="gameStore.mutation.fov" />
        <TresFog color="#121225" :near="150" :far="600" />
        <Game />
      </TresCanvas>

      <SoundControl />
      <TrackControl />
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