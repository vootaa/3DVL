<script setup lang="ts">
import { inject } from 'vue'
import { GameMode, type GameStore } from '../GameStore'

const gameStore = inject('gameStore') as GameStore

// Add handler for game mode switching
const switchGameMode = () => {
    gameStore.actions.switchGameMode()
}
</script>

<template>
    <!-- Game mode switch button in top right corner with reset notice -->
    <div class="game-mode-switch" @click="switchGameMode">
        game mode
        <br>
        {{ gameStore.gameMode === GameMode.Battle ? 'switch to explore' : 'switch to battle' }}
        <div class="reset-note">switching will reset game</div>
    </div>
</template>

<style lang="css" scoped>
@import url('https://fonts.googleapis.com/css2?family=Teko:wght@500&display=swap');

.game-mode-switch {
    position: absolute;
    top: 40px;
    right: 50px;
    font-family: 'Teko', sans-serif;
    font-weight: 500;
    font-variant-numeric: slashed-zero tabular-nums;
    text-transform: uppercase;
    line-height: 1em;
    font-size: 2em;
    transform: skew(-5deg, -5deg);
    pointer-events: all;
    cursor: pointer;
    text-align: right;
    color: indianred;
}

/* Style for reset notice */
.reset-note {
    font-size: 0.5em;
    margin-top: 5px;
    color: rgba(205, 92, 92, 0.7);
    /* lighter indianred */
    font-style: italic;
}

@media only screen and (max-width: 900px) {
    .game-mode-switch {
        font-size: 1.5em;
    }
}
</style>