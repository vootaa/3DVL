<script setup lang="ts">
import { inject } from 'vue'

import type { GameStore } from '../GameStore'
const gameStore = inject('gameStore') as GameStore
</script>

<template>
  <div class="sound-control" :class="{ 'audio-error': gameStore.audioError }"
    @click="gameStore.actions.toggleSound(!gameStore.sound)">
    <div class="control-label"> SOUND </div>
    <div class="control-value">
      <span v-if="!gameStore.audioError">{{ gameStore.sound ? 'ON' : 'OFF' }}</span>
      <span v-else class="error-text">ERROR</span>
    </div>
  </div>
</template>

<style lang="css" scoped>
.sound-control {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 10px 15px;
  color: indianred;
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

.sound-control:hover {
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
  .sound-control {
    padding: 8px 12px;
    width: 100px;
    min-height: 50px;
  }

  .control-value {
    font-size: 1.4em;
  }
}

.audio-error {
  border: 1px solid rgba(255, 0, 0, 0.5);
}

.error-text {
  color: #ff4444;
}
</style>