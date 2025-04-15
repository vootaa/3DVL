<script setup lang="ts">
import { inject } from 'vue'
import type { GameStore } from '../GameStore'

const gameStore = inject('gameStore') as GameStore

const toggleSound = () => {
    gameStore.actions.toggleSound(!gameStore.sound)
}
</script>

<template>
    <div class="sound-control" @click="toggleSound">
        sound
        <br>
        {{ gameStore.sound ? 'turn off' : 'turn on' }}
    </div>
</template>

<style lang="css" scoped>
@import url('https://fonts.googleapis.com/css2?family=Teko:wght@500&display=swap');

.sound-control {
    position: absolute;
    top: 40px;
    left: 50px;
    font-family: 'Teko', sans-serif;
    font-weight: 500;
    font-variant-numeric: slashed-zero tabular-nums;
    text-transform: uppercase;
    line-height: 1em;
    font-size: 2em;
    transform: skew(5deg, 5deg);
    pointer-events: all;
    cursor: pointer;
    color: indianred;
}

@media only screen and (max-width: 900px) {
    .sound-control {
        font-size: 1.5em;
    }
}
</style>