<script setup lang="ts">
import { inject } from 'vue'

// eslint-disable-next-line import/namespace
import type { GameStore } from '../GameStore'

const gameStore = inject('gameStore') as GameStore

const toggleSound = () => {
  gameStore.actions.toggleSound(!gameStore.sound)
}
</script>

<template>
  <div
    class="sound-control"
    @click="toggleSound"
  >
    <div class="control-label">
      SOUND
    </div>
    <div class="control-value">
      {{ gameStore.sound ? 'ON' : 'OFF' }}
    </div>
    <div class="control-hint">
      click to toggle
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
    width: 180px;
    min-height: 90px;
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
    .sound-control {
        padding: 8px 12px;
    }

    .control-value {
        font-size: 1.5em;
    }
}
</style>