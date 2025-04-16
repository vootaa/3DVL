<script setup>
import { computed } from 'vue';
import { gameStore, GameMode, ObservationMode, POINTS_OF_INTEREST } from '../GameStore';

// Calculate if player is near a point of interest (within 0.05 of track position)
const isNearPointOfInterest = (poiKey) => {
    const poi = POINTS_OF_INTEREST[poiKey];
    const t = gameStore.mutation.t;
    const poiT = poi.trackPosition;

    // Handle array of positions
    if (Array.isArray(poiT)) {
        return poiT.some(position => Math.abs(t - position) < 0.05);
    }

    // Handle single position
    return Math.abs(t - poiT) < 0.05;
};

const observePointOfInterest = (poiKey) => {
    gameStore.actions.toggleObservationMode(poiKey);
};

const currentPoiName = computed(() => {
    if (!gameStore.currentPointOfInterest) return '';
    return POINTS_OF_INTEREST[gameStore.currentPointOfInterest].name;
});

// Mouse handling for orbit controls
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

const handleMouseDown = (e) => {
    if (gameStore.observationMode === ObservationMode.Orbiting) {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }
};

const handleMouseMove = (e) => {
    if (isDragging && gameStore.observationMode === ObservationMode.Orbiting) {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        // Update orbit angle based on mouse movement
        gameStore.orbitAngle -= deltaX * 0.005;
        gameStore.orbitHeight -= deltaY * 0.005;

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }
};

const handleMouseUp = () => {
    isDragging = false;
};

const handleWheel = (e) => {
    if (gameStore.observationMode === ObservationMode.Orbiting) {
        // Adjust orbit distance with mouse wheel
        const delta = e.deltaY > 0 ? 5 : -5;
        gameStore.mutation.orbitDistance = Math.max(30, Math.min(200, gameStore.mutation.orbitDistance + delta));
    }
};

// Add event listeners
onMounted(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);
});

onUnmounted(() => {
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('wheel', handleWheel);
});
</script>

<template>
    <div v-if="gameStore.gameMode === GameMode.Explore" class="observation-controls">
        <div v-if="gameStore.observationMode === ObservationMode.None">
            <!-- Points of Interest Buttons -->
            <div class="poi-buttons">
                <button v-for="(poi, key) in POINTS_OF_INTEREST" :key="key" @click="observePointOfInterest(key)"
                    :disabled="!isNearPointOfInterest(key)" class="poi-button">
                    Observe {{ poi.name }}
                </button>
            </div>
        </div>

        <div v-else class="orbit-controls">
            <div class="orbit-info">
                <span>Observing: {{ currentPoiName }}</span>
                <button @click="gameStore.actions.resumeJourney()" class="resume-button">
                    Resume Journey
                </button>
            </div>

            <!-- Orbit control instructions -->
            <div class="orbit-instructions">
                Drag mouse to orbit • Scroll to zoom
            </div>
        </div>
    </div>
</template>

<style>
.observation-controls {
    position: absolute;
    top: 250px;
    right: 20px;
    z-index: 100;
}

.poi-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.poi-button {
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 180px;
    text-align: left;
}

.poi-button:hover:not([disabled]) {
    background: rgba(30, 30, 30, 0.9);
    border-color: rgba(255, 255, 255, 0.5);
}

.poi-button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
}

.orbit-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: rgba(0, 0, 0, 0.7);
    padding: 15px;
    border-radius: 8px;
    color: white;
    min-width: 180px;
}

.orbit-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.resume-button {
    padding: 5px 10px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 4px;
    color: white;
    cursor: pointer;
    margin-left: 10px;
}

.orbit-instructions {
    font-size: 0.8em;
    opacity: 0.8;
}
</style>