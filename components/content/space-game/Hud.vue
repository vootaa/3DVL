<script setup lang="ts">
import { computed, inject, ref, watch, onUnmounted } from 'vue'
import { GameMode, type GameStore } from './GameStore'

const gameStore = inject('gameStore') as GameStore

// Use ref instead of shallowRef for better reactivity
const startTime = ref(Date.now())
const seconds = ref('0')

// Create a computed prop to track the mutation startTime
const gameStartTime = computed(() => gameStore.mutation.startTime)

// Watch for changes to game start time and reset our timer
watch(gameStartTime, (newStartTime) => {
    startTime.value = newStartTime
    seconds.value = '0'
})

// Update the timer with respect to the current startTime
const updateTimer = () => {
    seconds.value = ((Date.now() - startTime.value) / 1000).toFixed(1)
}

// Set up interval to update the timer
const timerInterval = setInterval(updateTimer, 100)

// Clean up interval when component is unmounted
onUnmounted(() => {
    clearInterval(timerInterval)
})

const score = computed(() => (gameStore.points >= 1000 ? `${(gameStore.points / 1000).toFixed(1)}K` : gameStore.points))
</script>

<template>
    <!-- Time and score information in bottom left -->
    <div class="base LowerLeft">
        <div class="info-line">Time: {{ seconds }} s</div>
        <div class="info-line">Score: {{ gameStore.gameMode === GameMode.Battle ? score : 0 }}</div>
    </div>

    <div class="base Global" />
</template>

<style lang="css" scoped>
@import url('https://fonts.googleapis.com/css2?family=Teko:wght@500&display=swap');

.base {
    position: absolute;
    font-family: 'Teko', sans-serif;
    font-weight: 500;
    font-variant-numeric: slashed-zero tabular-nums;
    text-transform: uppercase;
    line-height: 1em;
    pointer-events: none;
    color: indianred;
}

.LowerLeft {
    bottom: 40px;
    left: 50px;
    transform: skew(5deg, 5deg);
    font-size: 2em;

    /* Consistent style for info lines */
    .info-line {
        margin: 0;
        line-height: 1.2em;
        text-align: left;
    }

    @media only screen and (max-width: 900px) {
        font-size: 1.5em;
    }
}

.Global {
    box-sizing: border-box;
}

html,
body,
#root {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    user-select: none;
    overflow: hidden;
}

body {
    position: fixed;
    overflow: hidden;
    overscroll-behavior-y: none;
}
</style>