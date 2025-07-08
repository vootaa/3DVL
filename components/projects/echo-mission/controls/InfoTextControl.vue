<script setup lang="ts">
import { inject } from 'vue'
import { gameStateManager } from '../core/GameStateManager'

import type { GameStore } from '../GameStore'
const gameStore = inject('gameStore') as GameStore
</script>

<template>
  <div class="info-text-control" v-if="gameStateManager.isExploreOrObservationMode()"
    @click="gameStore.actions.toggleInfoText(!gameStore.showInfoText)">
    <div class="control-label">LABELS</div>
    <div class="control-value"> {{ gameStore.showInfoText ? 'ON' : 'OFF' }}</div>
  </div>
</template>

<style lang="css" scoped>
.info-text-control {
  position: absolute;
  top: 160px;
  left: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 10px 15px;
  color: #4286f4;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-weight: 500;
  font-variant-numeric: slashed-zero tabular-nums;
  text-transform: uppercase;
  line-height: 1em;
  transform: skew(3deg, 3deg);
  pointer-events: all;
  cursor: pointer;
  width: 120px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  transition: background 0.2s;
}

.info-text-control:hover {
  background: rgba(0, 0, 0, 0.7);
}

.control-label {
  font-size: 0.9em;
  opacity: 0.8;
}

.control-value {
  font-size: 1.6em;
  line-height: 1em;
  margin: 2px 0;
  text-align: right;
}

@media only screen and (max-width: 900px) {
  .info-text-control {
    padding: 8px 12px;
    width: 100px;
    min-height: 50px;
  }

  .control-value {
    font-size: 1.4em;
  }
}
</style>