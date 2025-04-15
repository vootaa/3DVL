<script setup lang="ts">
import { inject, computed } from 'vue'
import { SpeedMode, SPEED_SETTINGS, type GameStore } from '../GameStore'

const gameStore = inject('gameStore') as GameStore

const speedLabel = computed(() => {
    return SPEED_SETTINGS[gameStore.speedMode].label
})

const speedBars = computed(() => {
    switch (gameStore.speedMode) {
        case SpeedMode.Slow: return 1
        case SpeedMode.Normal: return 2
        case SpeedMode.Fast: return 3
        default: return 3
    }
})
</script>

<template>
    <div class="speed-control">
        <div class="speed-indicator">
            <div class="speed-label">SPEED: {{ speedLabel }}</div>
            <div class="speed-bars">
                <div class="bar" :class="{ active: speedBars >= 1 }"></div>
                <div class="bar" :class="{ active: speedBars >= 2 }"></div>
                <div class="bar" :class="{ active: speedBars >= 3 }"></div>
            </div>
        </div>
        <button @click="gameStore.actions.switchSpeedMode" class="speed-button">
            SWITCH SPEED
        </button>
    </div>
</template>

<style scoped>
.speed-control {
    position: absolute;
    right: 20px;
    top: 20px;
    background: rgba(0, 0, 0, 0.5);
    color: indianred;
    padding: 10px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1000;
    font-family: 'Teko', sans-serif;
    font-weight: 500;
    text-transform: uppercase;
}

.speed-indicator {
    margin-bottom: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.speed-label {
    font-size: 1.5em;
    margin-bottom: 5px;
}

.speed-bars {
    display: flex;
    gap: 3px;
}

.bar {
    width: 15px;
    height: 8px;
    background: rgba(205, 92, 92, 0.3);
    border-radius: 2px;
}

.bar.active {
    background: indianred;
}

.speed-button {
    background: rgba(205, 92, 92, 0.8);
    border: none;
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
    font-family: 'Teko', sans-serif;
    transition: background 0.2s;
}

.speed-button:hover {
    background: indianred;
}
</style>