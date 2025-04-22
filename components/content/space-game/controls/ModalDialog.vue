<script setup lang="ts">
import { inject, computed } from 'vue'
import { GameMode, type GameStore } from '../GameStore'
import { timeManager } from '../TimeManager'

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value: string) => ['gameOver', 'switchConfirm'].includes(value)
    },
    currentMode: {
        type: Number as unknown as () => GameMode,
        required: true,
        validator: (value: number) => Object.values(GameMode).includes(value as unknown as GameMode)
    },
    battleScore: {
        type: Number,
        default: 0
    },
    stardust: {
        type: Number,
        default: 0
    },
    time: {
        type: String,
        default: '00:00.0'
    },
    totalLoops: {
        type: Number,
        default: 7
    }
})

const gameStore = inject('gameStore') as GameStore

const restartGame = () => {
    // Restart game, keep current mode
    gameStore.actions.restartGame(false);
    gameStore.actions.hideModal();
}

const switchMode = () => {
    // Switch game mode and restart
    // If switching from game over dialog, need complete reset
    if (props.type === 'gameOver') {
        gameStore.actions.restartGame(true); // true means switch mode
    } else {
        gameStore.actions.switchGameMode();
    }
    gameStore.actions.hideModal();
}

const continueGame = () => {
    // Cancel, continue current game
    gameStore.actions.hideModal();
    // Resume game time
    timeManager.actions.resume();
}

// Check if current mode is battle mode
const isBattleMode = computed(() => props.currentMode === GameMode.Battle)

const getOppositeMode = () => {
    return isBattleMode.value ? 'Explore' : 'Battle';
}

const getTitleText = () => {
    if (props.type === 'gameOver') {
        return isBattleMode.value ? 'BATTLE COMPLETE' : 'EXPLORATION COMPLETE';
    } else {
        return 'SWITCH MODE?';
    }
}
</script>

<template>
    <div class="modal-backdrop">
        <div class="modal-container">
            <div class="modal-header">{{ getTitleText() }}</div>

            <!-- Game over prompt -->
            <div v-if="type === 'gameOver'" class="modal-content">
                <!-- Battle mode ended -->
                <template v-if="isBattleMode">
                    <div class="stats-row">
                        <span class="label">FINAL SCORE:</span>
                        <span class="value">{{ battleScore }}</span>
                    </div>
                    <div class="stats-row">
                        <span class="label">TIME:</span>
                        <span class="value">{{ time }}</span>
                    </div>
                    <div class="stats-row">
                        <span class="label">LOOPS COMPLETED:</span>
                        <span class="value">{{ totalLoops }}/{{ totalLoops }}</span>
                    </div>
                </template>

                <!-- Exploration mode ended -->
                <template v-else>
                    <div class="stats-row">
                        <span class="label">STARDUST COLLECTED:</span>
                        <span class="value">
                            <span class="stardust-icon">✧</span> {{ stardust }}
                        </span>
                    </div>
                    <div class="stats-row">
                        <span class="label">TIME:</span>
                        <span class="value">{{ time }}</span>
                    </div>
                    <div class="stats-row">
                        <span class="label">LOOPS COMPLETED:</span>
                        <span class="value">{{ totalLoops }}/{{ totalLoops }}</span>
                    </div>
                </template>
            </div>

            <!-- Switch mode confirmation -->
            <div v-else class="modal-content">
                <div class="warning-message">
                    <template v-if="isBattleMode">
                        Your current battle score will be lost if you switch to Explore mode.
                    </template>
                    <template v-else>
                        Your collected stardust will be lost if you switch to Battle mode.
                    </template>
                </div>
                <div class="question">Do you want to continue?</div>
            </div>

            <div class="modal-footer">
                <!-- Game over buttons -->
                <template v-if="type === 'gameOver'">
                    <button class="modal-btn primary" @click="restartGame">
                        PLAY AGAIN
                    </button>
                    <button class="modal-btn secondary" @click="switchMode">
                        SWITCH TO {{ getOppositeMode().toUpperCase() }}
                    </button>
                </template>

                <!-- Switch confirmation buttons -->
                <template v-else>
                    <button class="modal-btn primary" @click="continueGame">
                        CONTINUE
                    </button>
                    <button class="modal-btn warning" @click="switchMode">
                        SWITCH TO {{ getOppositeMode().toUpperCase() }}
                    </button>
                </template>
            </div>
        </div>
    </div>
</template>

<style lang="css" scoped>
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    backdrop-filter: blur(5px);
}

.modal-container {
    background-color: rgba(20, 20, 20, 0.9);
    border: 2px solid #666;
    border-radius: 10px;
    width: 460px;
    max-width: 90%;
    box-shadow: 0 0 30px rgba(255, 204, 0, 0.3);
    font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
    animation: modal-appear 0.4s ease-out;
}

@keyframes modal-appear {
    from {
        opacity: 0;
        transform: translateY(-30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-header {
    background: linear-gradient(to right, #333, #111);
    color: #ff6600;
    font-size: 1.8em;
    font-weight: 700;
    padding: 15px 20px;
    border-bottom: 1px solid #444;
    border-radius: 8px 8px 0 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: 0 0 10px rgba(255, 102, 0, 0.5);
}

.modal-content {
    padding: 25px 20px;
    color: white;
    font-size: 1.1em;
}

.stats-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stats-row:last-child {
    border-bottom: none;
}

.label {
    font-weight: 500;
    opacity: 0.9;
    color: #aaa;
}

.value {
    font-weight: 700;
    font-size: 1.2em;
    color: #ffcc00;
}

.warning-message {
    color: #ff6600;
    font-weight: 500;
    margin-bottom: 20px;
    line-height: 1.4;
    text-align: center;
    padding: 10px;
    border: 1px solid rgba(255, 102, 0, 0.3);
    border-radius: 5px;
    background-color: rgba(255, 102, 0, 0.1);
}

.stardust-icon {
    color: #ffde87;
    text-shadow: 0 0 5px #ffaa00;
    display: inline-block;
    margin-right: 5px;
}

.question {
    text-align: center;
    font-weight: 700;
    margin-top: 15px;
    font-size: 1.2em;
}

.modal-footer {
    padding: 15px 20px 20px;
    display: flex;
    justify-content: space-between;
    gap: 15px;
    border-top: 1px solid #444;
}

.modal-btn {
    flex: 1;
    padding: 12px 15px;
    font-family: 'Kode Mono', monospace;
    font-size: 1em;
    font-weight: 700;
    text-transform: uppercase;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
}

.modal-btn.primary {
    background-color: #2980b9;
    color: white;
}

.modal-btn.primary:hover {
    background-color: #3498db;
    box-shadow: 0 0 15px rgba(52, 152, 219, 0.5);
}

.modal-btn.secondary {
    background-color: #27ae60;
    color: white;
}

.modal-btn.secondary:hover {
    background-color: #2ecc71;
    box-shadow: 0 0 15px rgba(46, 204, 113, 0.5);
}

.modal-btn.warning {
    background-color: #c0392b;
    color: white;
}

.modal-btn.warning:hover {
    background-color: #e74c3c;
    box-shadow: 0 0 15px rgba(231, 76, 60, 0.5);
}
</style>