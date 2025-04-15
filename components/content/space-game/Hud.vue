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
    <div class="score-display">
        <div class="control-label">STATS</div>
        <div class="control-value">
            <div class="info-line">Time: {{ seconds }}s</div>
            <div class="info-line">Score: {{ gameStore.gameMode === GameMode.Battle ? score : 0 }}</div>
        </div>
    </div>
</template>

<style lang="css" scoped>
@import url('https://fonts.googleapis.com/css2?family=Teko:wght@500&display=swap');

.score-display {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 8px;
    padding: 10px 15px;
    color: indianred;
    font-family: 'Teko', sans-serif;
    font-weight: 500;
    font-variant-numeric: slashed-zero tabular-nums;
    text-transform: uppercase;
    transform: skew(5deg, -5deg);
    min-width: 160px;
}

.control-label {
    font-size: 0.9em;
    opacity: 0.8;
}

.control-value {
    font-size: 1.8em;
    line-height: 1.1em;
    margin-top: 2px;
}

.info-line {
    margin: 0;
}

@media only screen and (max-width: 900px) {
    .score-display {
        padding: 8px 12px;
    }

    .control-value {
        font-size: 1.5em;
    }
}
</style>