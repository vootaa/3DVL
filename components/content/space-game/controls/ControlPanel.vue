<script setup lang="ts">
import { inject } from 'vue'
import { GameState } from '../core/constants'
import { gameStateManager } from '../core/GameStateManager'

import { SpeedMode, SPEED_SETTINGS } from '../store/constants'

import type { GameStore } from '../GameStore'
const gameStore = inject('gameStore') as GameStore

const speedBars = computed(() => {
  switch (gameStore.speedMode) {
    case SpeedMode.Slow: return 1
    case SpeedMode.Normal: return 2
    case SpeedMode.Fast: return 3
    default: return 3
  }
})

const currentGameModeLabel = computed(() => {
  const state = gameStateManager.getCurrentState()
  switch (state) {
    case GameState.BATTLE: return 'Battle'
    case GameState.EXPLORE: return 'Explore'
    case GameState.OBSERVATION: return 'Observing'
    default: return 'Launch'
  }
})
</script>

<template>
  <div class="control-panel">
    <div class="control-item game-mode" :class="{ disabled: !gameStateManager.enableGameModeSwitching() }"
      @click="gameStore.actions.switchGameMode()">
      <div class="control-label">
        GAME MODE
      </div>
      <div class="control-value">
        {{ currentGameModeLabel }}
      </div>
      <div v-if="gameStateManager.enableGameModeSwitching()" class="control-hint">
        click to switch
      </div>
      <div v-else class="control-hint warning">
        resume journey first
      </div>
    </div>

    <div class="control-item speed-mode" :class="{ disabled: !gameStateManager.enableGameModeSwitching() }"
      @click="gameStore.actions.switchSpeedMode()">
      <div class="control-label">
        SPEED
      </div>
      <div class="control-value">
        {{ SPEED_SETTINGS[gameStore.speedMode].label) }}
      </div>
      <div v-if="gameStateManager.enableGameModeSwitching()" class="control-hint">
        click to change
      </div>
      <div v-else class="control-hint warning">
        resume journey first
      </div>
      <div class="speed-bars">
        <div class="bar" :class="{ active: speedBars >= 1 }" />
        <div class="bar" :class="{ active: speedBars >= 2 }" />
        <div class="bar" :class="{ active: speedBars >= 3 }" />
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  pointer-events: none;
  z-index: 1000;
}

.control-item {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 10px 15px;
  color: indianred;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-weight: 500;
  text-transform: uppercase;
  text-align: right;
  transform: skew(-3deg, -3deg);
  pointer-events: all;
  cursor: pointer;
  width: 200px;
  min-height: 90px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: background 0.2s;
  box-sizing: border-box;
}

.control-item:hover:not(.disabled) {
  background: rgba(0, 0, 0, 0.7);
}

.control-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  position: relative;
}

.control-label {
  font-size: 1.0em;
  opacity: 0.8;
}

.control-value {
  font-size: 1.8em;
  line-height: 1em;
  margin: 2px 0;
}

.control-hint {
  font-size: 0.85em;
  opacity: 0.6;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.control-hint.warning {
  color: #ffcc00;
  opacity: 0.8;
  font-size: 0.75em;
  letter-spacing: -0.3px;
}

.speed-bars {
  display: flex;
  justify-content: flex-end;
  gap: 3px;
  margin-top: 5px;
}

.bar {
  width: 15px;
  height: 6px;
  background: rgba(205, 92, 92, 0.3);
  border-radius: 2px;
}

.bar.active {
  background: indianred;
}

@media only screen and (max-width: 900px) {
  .control-item {
    min-width: 120px;
    padding: 8px 12px;
  }

  .control-value {
    font-size: 1.5em;
  }
}
</style>