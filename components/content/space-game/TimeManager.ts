import { reactive } from 'vue'

/**
 * Game time manager
 * Provides real-time timing functionality independent of game speed
 */
export const timeManager = reactive({
  /**
     * Game start time (milliseconds)
     */
  gameStartTime: Date.now(),

  /**
     * Total game time (milliseconds)
     */
  totalGameTime: 0,

  /**
     * Current session start time (milliseconds)
     */
  sessionStartTime: Date.now(),

  /**
     * Current session duration (milliseconds)
     */
  sessionTime: 0,

  /**
     * Pause status
     */
  paused: false,

  /**
     * Total pause time (milliseconds)
     */
  totalPauseTime: 0,

  /**
     * Last pause start time (milliseconds)
     */
  pauseStartTime: 0,

  /**
     * Periodic updater ID
     */
  updateIntervalId: 0 as unknown as NodeJS.Timeout,

  /**
     * Update method list
     */
  updateCallbacks: [] as Array<(dt: number) => void>,

  /**
     * Operation methods
     */
  actions: {
    /**
         * Initialize timer
         */
    init: () => void 0,

    /**
         * Reset timer
         */
    reset: (resetTotal?: boolean) => void 0,

    /**
         * Pause timer
         */
    pause: () => void 0,

    /**
         * Resume timer
         */
    resume: () => void 0,

    /**
         * Get formatted game time (min:sec.ms)
         */
    getFormattedTime: () => '' as string,

    /**
         * Register update callback
         * @param callback Callback function that receives time delta (milliseconds) parameter
         */
    registerUpdateCallback: (callback: (dt: number) => void) => void 0,

    /**
         * Remove update callback
         * @param callback Callback function to remove
         */
    removeUpdateCallback: (callback: (dt: number) => void) => void 0,
  },
})

/**
 * Update timer state
 */
const updateTime = () => {
  if (timeManager.paused) return

  const now = Date.now()
  const previousTime = timeManager.totalGameTime

  // Calculate actual game time (minus all pause time)
  timeManager.totalGameTime = now - timeManager.gameStartTime - timeManager.totalPauseTime
  timeManager.sessionTime = now - timeManager.sessionStartTime - timeManager.totalPauseTime

  // Calculate time delta
  const deltaTime = timeManager.totalGameTime - previousTime

  // Call all registered update callbacks
  timeManager.updateCallbacks.forEach(callback => callback(deltaTime))
}

/**
 * Initialize timer
 */
timeManager.actions.init = () => {
  // Ensure initialization happens only once
  if (timeManager.updateIntervalId) {
    clearInterval(timeManager.updateIntervalId)
  }

  // Set initial time
  const now = Date.now()
  timeManager.gameStartTime = now
  timeManager.sessionStartTime = now
  timeManager.totalGameTime = 0
  timeManager.sessionTime = 0
  timeManager.totalPauseTime = 0
  timeManager.paused = false

  // Start periodic updates (every 16ms ≈ 60fps)
  timeManager.updateIntervalId = setInterval(updateTime, 16)
}

/**
 * Reset timer
 */
timeManager.actions.reset = (resetTotal: boolean = false) => {
  const now = Date.now()

  // Always reset session time
  timeManager.sessionStartTime = now
  timeManager.sessionTime = 0

  // Reset total time only if specified
  if (resetTotal) {
    timeManager.gameStartTime = now
    timeManager.totalGameTime = 0
  }

  // Reset pause-related variables
  timeManager.paused = false
  timeManager.totalPauseTime = 0
  timeManager.pauseStartTime = 0
}

/**
 * Pause timer
 */
timeManager.actions.pause = () => {
  if (!timeManager.paused) {
    timeManager.paused = true
    timeManager.pauseStartTime = Date.now()
  }
}

/**
 * Resume timer
 */
timeManager.actions.resume = () => {
  if (timeManager.paused) {
    // Accumulate pause time
    timeManager.totalPauseTime += Date.now() - timeManager.pauseStartTime
    timeManager.paused = false
  }
}

/**
 * Get formatted time string
 * @returns Formatted time string (min:sec.ms)
 */
timeManager.actions.getFormattedTime = () => {
  const totalSeconds = Math.floor(timeManager.totalGameTime / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const milliseconds = Math.floor((timeManager.totalGameTime % 1000) / 10)

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
}

/**
 * Register update callback
 * @param callback Callback function
 */
timeManager.actions.registerUpdateCallback = (callback: (dt: number) => void) => {
  if (!timeManager.updateCallbacks.includes(callback)) {
    timeManager.updateCallbacks.push(callback)
  }
}

/**
 * Remove update callback
 * @param callback Callback function to remove
 */
timeManager.actions.removeUpdateCallback = (callback: (dt: number) => void) => {
  const index = timeManager.updateCallbacks.indexOf(callback)
  if (index !== -1) {
    timeManager.updateCallbacks.splice(index, 1)
  }
}

// Auto-initialize
timeManager.actions.init()

export type TimeManager = typeof timeManager