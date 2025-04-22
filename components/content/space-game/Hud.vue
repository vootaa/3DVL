<script setup lang="ts">
import { computed, inject, ref, onUnmounted } from 'vue'
import { GameMode, type GameStore } from './GameStore'
import { timeManager } from './TimeManager'
import ModalDialog from './controls/ModalDialog.vue'

const gameStore = inject('gameStore') as GameStore

// Formatted session time and total time
const formattedSessionTime = ref('00:00.0')
const formattedTotalTime = ref('00:00.0')

// Helper function to format time consistently
const formatTime = (timeMs: number) => {
  const seconds = Math.floor(timeMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const deciseconds = Math.floor((timeMs % 1000) / 100)
  const minPrefix = minutes > 0 ? `${minutes}:` : ''
  const secSuffix = minutes > 0 ? '' : 's'
  return `${minPrefix}${secs}${secSuffix}.${deciseconds}`
}

const enemiesStats = computed(() => {
  const remaining = gameStore.enemies.length
  const total = gameStore.initialEnemyCount
  return `${remaining}/${total}`
})

const rocksStats = computed(() => {
  const remaining = gameStore.rocks.length
  const total = gameStore.initialRockCount
  return `${remaining}/${total}`
})

const destroyedEnemies = computed(() => gameStore.initialEnemyCount - gameStore.enemies.length)
const destroyedRocks = computed(() => gameStore.initialRockCount - gameStore.rocks.length)

// Function to update display time
const updateDisplayTime = () => {
  formattedSessionTime.value = formatTime(timeManager.sessionTime)
  formattedTotalTime.value = formatTime(timeManager.totalGameTime)
}

const displayInterval = setInterval(updateDisplayTime, 100)

// Format battle score with K suffix for thousands
const formattedBattleScore = computed(() => 
  gameStore.battleScore >= 1000 
    ? `${(gameStore.battleScore / 1000).toFixed(1)}K` 
    : gameStore.battleScore.toString(),
)

// Clean up interval when component is unmounted
onUnmounted(() => {
  clearInterval(displayInterval)
})

// Notification system
const scoreNotifications = computed(() => gameStore.scoreNotifications)
const regularNotifications = computed(() => 
  scoreNotifications.value.filter(notification => !notification.isBonus),
)
const bonusNotifications = computed(() => 
  scoreNotifications.value.filter(notification => notification.isBonus),
)
const comboSystem = computed(() => gameStore.comboSystem)
</script>

<template>
  <!-- Regular notifications (left side) -->
  <div class="score-notifications score-notifications-left">
    <transition-group name="notification">
      <div
        v-for="notification in regularNotifications"
        :key="notification.id"
        class="score-notification"
      >
        <span class="notification-text">
          {{ notification.text }}
        </span>
        <span class="notification-points">+{{ notification.points }}</span>
      </div>
    </transition-group>
  </div>

  <!-- Bonus notifications (right side) -->
  <div class="score-notifications score-notifications-right">
    <transition-group name="notification">
      <div
        v-for="notification in bonusNotifications"
        :key="notification.id"
        class="score-notification bonus-notification"
      >
        <span class="notification-text">
          {{ notification.text }}
        </span>
        <span class="notification-points">+{{ notification.points }}</span>
      </div>
    </transition-group>
  </div>

  <!-- Combo indicator -->
  <div
    v-if="comboSystem.active && comboSystem.count >= 3"
    class="combo-indicator"
  >
    <span class="combo-count">{{ comboSystem.count }}x</span>
    <span class="combo-text">COMBO!</span>
  </div>

  <!-- Time and score information -->
  <div class="score-display">
    <div class="control-label">
      STATISTICS DATA
    </div>
    <div class="control-value">
      <div class="info-line">
        Loops: {{ gameStore.loopCount }} / {{ gameStore.totalLoops }}
      </div>
      <div
        v-if="gameStore.gameMode === GameMode.Battle"
        class="info-line"
      >
        Enemies: {{ enemiesStats }}
      </div>
      <div
        v-if="gameStore.gameMode === GameMode.Battle"
        class="info-line"
      >
        Rocks: {{ rocksStats }}
      </div>
      <div
        v-if="gameStore.gameMode === GameMode.Battle"
        class="info-line"
      >
        Score: {{ formattedBattleScore }}
      </div>
      <div
        v-if="gameStore.gameMode === GameMode.Explore"
        class="info-line"
      >
        Stardust: {{ gameStore.stardust }} <span class="stardust-icon">✧</span> 
      </div>
      <div class="info-line">
        Current: {{ formattedSessionTime }}
      </div>
      <div class="info-line">
        Total: {{ formattedTotalTime }}
      </div>
    </div>
  </div>

  <!-- Game over/mode switch dialog -->
  <ModalDialog
    v-if="gameStore.modal.show"
    :type="gameStore.modal.type"
    :current-mode="gameStore.gameMode"
    :battle-score="gameStore.battleScore"
    :destroyed-enemies="destroyedEnemies"
    :destroyed-rocks="destroyedRocks"
    :stardust="gameStore.stardust"
    :time="formattedSessionTime"
    :total-loops="gameStore.totalLoops"
    :total-enemies="gameStore.initialEnemyCount"
    :total-rocks="gameStore.initialRockCount"
  />
</template>

<style lang="css" scoped>
/* Stats display panel */
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
    width: 320px;
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

.stardust-icon {
    color: #ffde87;
    text-shadow: 0 0 5px #ffaa00;
    display: inline-block;
    margin-right: 5px;
}

/* Notification system styles */
.score-notifications {
    position: absolute;
    top: 100px;
    width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1000;
    pointer-events: none;
}

.score-notifications-left {
    left: 20px;
    align-items: flex-start;
}

.score-notifications-right {
    right: 20px;
    align-items: flex-end;
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
    width: calc(100% - 40px);
    box-sizing: border-box;
    text-shadow: 0 0 10px rgba(255, 204, 0, 0.6);
}

/* Bonus notification styling */
.bonus-notification {
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 218, 135, 0.3);
  box-shadow: 0 0 15px rgba(255, 218, 135, 0.3);
}

.bonus-notification .notification-text {
  color: #ffde87;
}

.bonus-notification .notification-points {
  color: #ffaa00;
}

.notification-text {
    margin-right: 10px;
}

.notification-points {
    color: #ff6600;
}

/* Combo indicator styles */
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

.score-notifications-left .notification-enter-from {
    opacity: 0;
    transform: translateX(-20px);
}

.score-notifications-left .notification-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}

.score-notifications-right .notification-enter-from {
    opacity: 0;
    transform: translateX(20px);
}

.score-notifications-right .notification-leave-to {
    opacity: 0;
    transform: translateX(20px);
}

/* Responsive design */
@media only screen and (max-width: 900px) {
    .score-notifications {
        width: 300px;
    }
    
    .score-notifications-left {
        left: 10px;
    }
    
    .score-notifications-right {
        right: 10px;
    }
    
    .score-notification {
        font-size: 1.5em;
        padding: 8px 12px;
    }
}
</style>