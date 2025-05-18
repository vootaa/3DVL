<script setup lang="ts">
import { inject } from 'vue'

import { GameMode } from '../store/constants'

// eslint-disable-next-line import/namespace
import type { GameStore } from '../GameStore'

const gameStore = inject('gameStore') as GameStore

const toggleInfoText = () => {
  gameStore.actions.toggleInfoText(!gameStore.showInfoText)
}
</script>

<template>
  <div
    v-if="gameStore.gameMode === GameMode.Explore"
    class="info-text-control"
    @click="toggleInfoText"
  >
    <div class="control-label">
      INFO Labels
    </div>
    <div class="control-value">
      {{ gameStore.showInfoText ? 'ON' : 'OFF' }}
    </div>
    <div class="control-hint">
      click to toggle
    </div>
  </div>
</template>

<style lang="css" scoped>
.info-text-control {
    position: absolute;
    top: 130px;
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
    width: 180px;
    min-height: 90px;
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
}

@media only screen and (max-width: 900px) {
    .info-text-control {
        padding: 8px 12px;
    }

    .control-value {
        font-size: 1.5em;
    }
}
</style>
