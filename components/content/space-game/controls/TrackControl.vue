<script setup lang="ts">
import { inject } from 'vue'

import type { GameStore } from '../GameStore'
const gameStore = inject('gameStore') as GameStore
</script>

<template>
  <div class="track-control" @click="gameStore.actions.toggleTrack(!gameStore.showTrack)">
    <div class="control-label"> TRACK</div>
    <div class="control-value"> {{ gameStore.showTrack ? 'ON' : 'OFF' }}</div>
  </div>
</template>

<style lang="css" scoped>
.track-control {
  position: absolute;
  top: 90px;
  left: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 10px 15px;
  color: #FF8C00;
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

.track-control:hover {
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
  .track-control {
    padding: 8px 12px;
    width: 100px;
    min-height: 50px;
  }

  .control-value {
    font-size: 1.4em;
  }
}
</style>