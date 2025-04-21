<script setup lang="ts">
import { computed, inject, ref, onUnmounted } from 'vue'
import { GameMode, type GameStore } from './GameStore'
import { timeManager } from './TimeManager'

const gameStore = inject('gameStore') as GameStore

// Formatted session time and total time
const formattedSessionTime = ref('00:00.0')
const formattedTotalTime = ref('00:00.0')

const enemiesStats = computed(() => {
    const remaining = gameStore.enemies.length;
    const total = gameStore.initialEnemyCount || 10;
    return `${remaining}/${total}`;
})

const rocksStats = computed(() => {
    const remaining = gameStore.rocks.length;
    const total = gameStore.initialRockCount || 100;
    return `${remaining}/${total}`;
})

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

const scoreNotifications = computed(() => gameStore.scoreNotifications)
const comboSystem = computed(() => gameStore.comboSystem)
</script>

<template>
    <div class="score-notifications">
        <transition-group name="notification">
            <div v-for="notification in scoreNotifications" :key="notification.id" class="score-notification">
                <span class="notification-text">{{ notification.text }}</span>
                <span class="notification-points">+{{ notification.points }}</span>
            </div>
        </transition-group>
    </div>

    <div v-if="comboSystem.active && comboSystem.count >= 3" class="combo-indicator">
        <span class="combo-count">{{ comboSystem.count }}x</span>
        <span class="combo-text">COMBO!</span>
    </div>

    <!-- Time and score information -->
    <div class="score-display">
        <div class="control-label">STATS DATA</div>
        <div class="control-value">
            <div class="info-line">Loops: {{ gameStore.loopCount }}</div>
            <div v-if="gameStore.gameMode === GameMode.Battle" class="info-line">Enemies: {{ enemiesStats }}</div>
            <div v-if="gameStore.gameMode === GameMode.Battle" class="info-line">Rocks: {{ rocksStats }}</div>
            <div v-if="gameStore.gameMode === GameMode.Battle" class="info-line">Score: {{ score }}</div>
            <div class="info-line">Current: {{ formattedSessionTime }}</div>
            <div class="info-line">Total: {{ formattedTotalTime }}</div>
        </div>
    </div>
</template>

<style lang="css" scoped>
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
    transform: skew(-3deg, -3deg);
    width: 360px;
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

.score-notifications {
    position: absolute;
    top: 100px;
    left: 20%;
    transform: translateX(-50%);
    width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1000;
    pointer-events: none;
}

.score-notification {
    background: rgba(0, 0, 0, 0.7);
    border-radius: 8px;
    padding: 10px 15px;
    margin-bottom: 10px;
    color: #ffcc00;
    font-family: 'Kode Mono', monospace;
    font-weight: 700;
    font-size: 1.8em;
    display: flex;
    justify-content: space-between;
    width: 100%;
    box-sizing: border-box;
    text-shadow: 0 0 10px rgba(255, 204, 0, 0.6);
}

.notification-text {
    margin-right: 10px;
}

.notification-points {
    color: #ff6600;
}

.combo-indicator {
    position: absolute;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid #ff00ff;
    border-radius: 8px;
    padding: 5px 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
    box-shadow: 0 0 20px #ff00ff;
    animation: pulse 1s infinite alternate;
}

@keyframes pulse {
    from {
        box-shadow: 0 0 15px #ff00ff;
    }

    to {
        box-shadow: 0 0 30px #ff00ff;
    }
}

.combo-count {
    font-family: 'Kode Mono', monospace;
    font-weight: 700;
    font-size: 3em;
    color: #00ffff;
    text-shadow: 0 0 15px #00ffff, 0 0 25px #ffffff;
    letter-spacing: -2px;
}

.combo-text {
    font-family: 'Kode Mono', monospace;
    font-size: 1.4em;
    color: #ffffff;
    font-weight: 700;
    text-shadow: 0 0 10px #ffffff;
    letter-spacing: 1px;
}

/* Animation effects */
.notification-enter-active,
.notification-leave-active {
    transition: all 0.5s;
}

.notification-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.notification-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

@media only screen and (max-width: 900px) {
    .score-display {
        padding: 8px 12px;
    }

    .control-value {
        font-size: 1.5em;
    }

    .score-notifications {
        width: 300px;
    }
}
</style>