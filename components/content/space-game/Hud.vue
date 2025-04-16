<script setup lang="ts">
import { computed, inject, ref, onUnmounted } from 'vue'
import { GameMode, type GameStore } from './GameStore'
import { timeManager } from './TimeManager'

const gameStore = inject('gameStore') as GameStore

// Formatted session time and total time
const formattedSessionTime = ref('00:00.0')
const formattedTotalTime = ref('00:00.0')

// Function to update display time
const updateDisplayTime = () => {
    // Session time formatting (simplified mode)
    const sessionSeconds = Math.floor(timeManager.sessionTime / 1000);
    const sessionMinutes = Math.floor(sessionSeconds / 60);
    const sessionSecs = sessionSeconds % 60;
    const sessionDeciseconds = Math.floor((timeManager.sessionTime % 1000) / 100);
    formattedSessionTime.value = `${sessionMinutes > 0 ? sessionMinutes + ':' : ''}${sessionSecs}${sessionMinutes > 0 ? '' : 's'}.${sessionDeciseconds}`;

    // Total time formatting (simplified mode)
    const totalSeconds = Math.floor(timeManager.totalGameTime / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalSecs = totalSeconds % 60;
    const totalDeciseconds = Math.floor((timeManager.totalGameTime % 1000) / 100);
    formattedTotalTime.value = `${totalMinutes > 0 ? totalMinutes + ':' : ''}${totalSecs}${totalMinutes > 0 ? '' : 's'}.${totalDeciseconds}`;
}

const displayInterval = setInterval(updateDisplayTime, 100)

// Clean up interval when component is unmounted
onUnmounted(() => {
    clearInterval(displayInterval)
})

const score = computed(() => (gameStore.points >= 1000 ? `${(gameStore.points / 1000).toFixed(1)}K` : gameStore.points))
</script>

<template>
    <!-- Time and score information in bottom left -->
    <div class="score-display">
        <div class="control-label">STATS DATA</div>
        <div class="control-value">
            <div class="info-line">Loops: {{ gameStore.loopCount }}</div>
            <div class="info-line">Time: {{ formattedSessionTime }}</div>
            <div class="info-line">Total: {{ formattedTotalTime }}</div>
            <div class="info-line">Score: {{ gameStore.gameMode === GameMode.Battle ? score : 0 }}</div>
        </div>
    </div>
</template>

<style lang="css" scoped>
@import url('https://fonts.googleapis.com/css2?family=Teko:wght@500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Kode+Mono:wght@400;500;700&display=swap');

.score-display {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 8px;
    padding: 10px 15px;
    color: indianred;
    font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
    font-weight: 500;
    font-variant-numeric: slashed-zero tabular-nums;
    text-transform: uppercase;
    transform: skew(3deg, -3deg);
    width: 280px;
    min-height: 105px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
}

.control-label {
    font-size: 1.0em;
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