import type { PerspectiveCamera } from 'three'
import { Vector3 } from 'three'
import {
  GameMode,
  ObservationMode,
  POINTS_OF_INTEREST,
  SCORE_VALUES,
  SPEED_SETTINGS,
  TRACK_POSITIONS,
  SpeedMode,
} from './constants'
import { checkStardustCollection } from './utils'
import { randomData, generateChainweb3D } from './generators'

export function initializeActions(gameStore: any) {
  const guid = gameStore.guid
  const track = gameStore.mutation.track

  function playSound(name: string, loop = false, volume = 1.0) {
    if (gameStore.audioSystem && gameStore.sound) {
      return gameStore.audioSystem.play(name, loop, volume)
    }
    return null
  }

  gameStore.actions.startGame = (switchMode: boolean) => {
    // Clear entities
    gameStore.enemies = []
    gameStore.rocks = []
    gameStore.explosions = []
    gameStore.lasers = []
    gameStore.observedPoints = []
    gameStore.scoreNotifications = []

    // Reset score
    gameStore.battleScore = 0
    gameStore.stardust = 0
    gameStore.loopCount = 0

    // Reset observationMode
    gameStore.observationMode = ObservationMode.None
    gameStore.currentPointOfInterest = null

    // Reset time
    gameStore.mutation.startTime = Date.now()
    gameStore.timeManager.actions.reset(false)

    // Reset combo system
    gameStore.comboSystem.count = 0
    gameStore.comboSystem.active = false
    gameStore.comboSystem.lastHitTime = 0
    clearTimeout(gameStore.comboSystem.resetTimer)

    // Reset position
    gameStore.mutation.t = 0
    gameStore.mutation.position.set(0, 0, 0)

    const currentIsBattleMode = gameStore.gameMode === GameMode.Battle

    if (switchMode) {
      gameStore.gameMode = currentIsBattleMode ? GameMode.Explore : GameMode.Battle
    }
    
    if (currentIsBattleMode) {
      gameStore.initialEnemyCount = 10
      gameStore.initialRockCount = 100
      gameStore.particlesCount = 500
      gameStore.enemies = randomData(gameStore.initialEnemyCount, track, 20, 15, () => 1 + Math.random() * 1.5, guid)
      gameStore.rocks = randomData(gameStore.initialRockCount, track, 150, 8, () => 1 + Math.random() * 3, guid)
    }
    else {
      gameStore.enemies = []
      gameStore.rocks = []
      gameStore.initialRockCount = 0
      gameStore.initialEnemyCount = 0
      gameStore.particlesCount = 50
    }

    gameStore.mutation.particles = randomData(gameStore.particlesCount,
      track, 100, 1, () => 0.5 + Math.random() * 0.8, guid)

  }

  // Implement modal display method
  gameStore.actions.showModal = (type: string) => {
    gameStore.modal.show = true
    gameStore.modal.type = type

    // Pause game time, but continue total time
    gameStore.timeManager.actions.pause()
  }

  // Implement hide modal method
  gameStore.actions.hideModal = () => {
    gameStore.modal.show = false

    // Ensure game time resumes counting (only if not game over)
    if (gameStore.modal.type === 'switchConfirm') {
      gameStore.timeManager.actions.resume()
    }
  }

  gameStore.actions.addStardust = () => {
    gameStore.stardust++
    gameStore.actions.addScoreNotification('Stardust', 1, false)
  }

  gameStore.actions.addScoreNotification = (text: string, points: number, isBonus = false) => {
    const notification = {
      id: Date.now(),
      text,
      points,
      isBonus,
    }

    gameStore.scoreNotifications = [...gameStore.scoreNotifications, notification]

    // Auto-remove notification after 3 seconds
    setTimeout(() => {
      gameStore.scoreNotifications = gameStore.scoreNotifications.filter(
        (n: { id: number }) => n.id !== notification.id,
      )
    }, 3000)
  }

  gameStore.actions.registerHit = (count: number, type: 'rock' | 'enemy') => {
    const now = Date.now()

    // Only process combos in Battle mode
    if (gameStore.gameMode !== GameMode.Battle) return

    // Base points
    const pointsPerItem = type === 'rock' ? SCORE_VALUES.ROCK : SCORE_VALUES.ENEMY
    const basePoints = count * pointsPerItem

    // Add points
    gameStore.battleScore += basePoints

    // Display base score notification
    const itemText = type === 'rock'
      ? `${count} Stone${count > 1 ? 's' : ''}`
      : `${count} Enem${count > 1 ? 'ies' : 'y'}`

    gameStore.actions.addScoreNotification(`${itemText} +${basePoints}`, basePoints, false)

    // Handle combo
    if (now - gameStore.comboSystem.lastHitTime < gameStore.comboSystem.timeWindow) {
      gameStore.comboSystem.count += count

      // Add combo bonus
      let bonusPoints = 0
      if (gameStore.comboSystem.count >= SCORE_VALUES.COMBO_THRESHOLD_LARGE) {
        bonusPoints = gameStore.comboSystem.count * SCORE_VALUES.COMBO_BONUS_LARGE
        gameStore.actions.addScoreNotification(`${gameStore.comboSystem.count}x COMBO!`, bonusPoints, true)
      }
      else if (gameStore.comboSystem.count >= SCORE_VALUES.COMBO_THRESHOLD_SMALL) {
        bonusPoints = gameStore.comboSystem.count * SCORE_VALUES.COMBO_BONUS_SMALL
        gameStore.actions.addScoreNotification(`${gameStore.comboSystem.count}x Hit!`, bonusPoints, true)
      }

      // Add combo bonus points
      if (bonusPoints > 0) {
        gameStore.battleScore += bonusPoints
      }
    }
    else {
      gameStore.comboSystem.count = count
    }

    gameStore.comboSystem.lastHitTime = now
    gameStore.comboSystem.active = true

    // Reset combo timer
    clearTimeout(gameStore.comboSystem.resetTimer)
    gameStore.comboSystem.resetTimer = setTimeout(() => {
      gameStore.comboSystem.active = false
      gameStore.comboSystem.count = 0
    }, gameStore.comboSystem.timeWindow)
  }

  gameStore.actions.toggleSound = (sound = !gameStore.sound) => {    
    if (!gameStore.audioSystem) {
      console.warn('Audio system not initialized yet, cannot toggle sound')
      return
    }

    gameStore.sound = sound

    if (sound) {
      gameStore.audioSystem.resumeAll()
      if (gameStore.gameMode !== GameMode.None) {
        playSound('bg', true, 0.3)
        playSound('engine', true, 1)
        playSound('engine2', true, 0.3)
      }
    }
    else {
      gameStore.audioSystem.pauseAll()
    }
  }

  gameStore.actions.init = (camera: PerspectiveCamera) => {
    gameStore.sound = false
    gameStore.mutation.clock.start()
    gameStore.camera = camera
    gameStore.camera.far = 10000
  }

  gameStore.actions.shoot = () => {
    // Only allow shooting in Battle mode
    if (gameStore.gameMode === GameMode.Battle) {
      gameStore.lasers = [...gameStore.lasers, Date.now()]
      clearTimeout(gameStore.mutation.cancelLaserTO)
      gameStore.mutation.cancelLaserTO = setTimeout(() => {
        gameStore.lasers = gameStore.lasers.filter((t: number) => Date.now() - t <= 1000)
      }, 1000)
      playSound('zap')
    }
    // In Explore mode, shooting is disabled
  }

  gameStore.actions.test = (data: { size: number; offset: Vector3; scale: number; hit: any; distance: number }) => {
    const halfSize = data.size * data.scale / 2

    gameStore.mutation.box.min.set(
      data.offset.x - halfSize,
      data.offset.y - halfSize,
      data.offset.z - halfSize,
    )

    gameStore.mutation.box.max.set(
      data.offset.x + halfSize,
      data.offset.y + halfSize,
      data.offset.z + halfSize,
    )

    data.hit.set(10000, 10000, 10000)

    const result = gameStore.mutation.ray.intersectBox(gameStore.mutation.box, data.hit)

    if (result) {
      return true
    }

    return false
  }

  gameStore.actions.updateMouse = ({ clientX, clientY }: { clientX: number; clientY: number }) => {
    if (gameStore.gameMode === GameMode.Battle
      || (gameStore.gameMode === GameMode.Explore && gameStore.observationMode === ObservationMode.None)) {
      gameStore.mutation.mouse.x = clientX - window.innerWidth / 2
      gameStore.mutation.mouse.y = clientY - window.innerHeight / 2
    }
  }

  gameStore.actions.update = () => {
    const { observationMode } = gameStore
    const mutation = gameStore.mutation

    if (observationMode === ObservationMode.None) {
      const { rocks, enemies, gameMode, speedMode } = gameStore

      const time = Date.now()
      const t = (mutation.t = ((time - mutation.startTime) % mutation.looptime) / mutation.looptime)

      if (mutation.lastT > 0.9 && t < 0.1) {
        // Track loop completed
        gameStore.loopCount++
      }
      mutation.lastT = t

      mutation.position = track.parameters.path.getPointAt(t)
      mutation.position.multiplyScalar(mutation.scale)

      const speedFactor = SPEED_SETTINGS[speedMode as keyof typeof SPEED_SETTINGS].factor
      gameStore.camera.fov = 70 + (speedFactor - 1.0) * 10
      gameStore.camera.updateProjectionMatrix()

      // test for wormhole/warp
      let warping = false
      if (t > TRACK_POSITIONS.WARP_BEGIN && t < TRACK_POSITIONS.WARP_END) {
        if (!warping) {
          warping = true
          playSound('warp', true, 0.5)
        }
      }
      else if (t > TRACK_POSITIONS.WARP_RESET) {
        warping = false
      }

      // Only process hits and collisions in Battle mode
      if (gameMode === GameMode.Battle) {
        // test for hits
        const rocksHit = rocks.filter((data: any) => gameStore.actions.test(data))
        const enemiesHit = enemies.filter((data: any) => gameStore.actions.test(data))
        const allHit = rocksHit.concat(enemiesHit)
        
        mutation.hits = allHit.length
        const previousHits = mutation.hits || 0
        if (previousHits === 0 && mutation.hits) {
          playSound('click', false, 0.5)
        }
        
        const lasers = gameStore.lasers
        if (mutation.hits && lasers.length && time - lasers[lasers.length - 1] < 100) {
          playSound('explosion', false, 0.5)
          const updates: any[] = []
          
          allHit.forEach((data: any) => {
            updates.push({
              time: Date.now(),
              ...data,
              color: 'white',
              particles: Array.from({ length: 20 }).fill(0).map(() => ({
                position: new Vector3(),
                dPos: new Vector3(
                  -1 + Math.random() * 2,
                  -1 + Math.random() * 2,
                  -1 + Math.random() * 2,
                ).normalize().multiplyScalar(0.40),
              })),
            })
          })
          
          allHit.forEach((data: any) => {
            updates.push({
              time: Date.now(),
              ...data,
              color: 'orange',
              particles: Array.from({ length: 20 }).fill(0).map(() => ({
                position: new Vector3(),
                dPos: new Vector3(
                  -1 + Math.random() * 2,
                  -1 + Math.random() * 2,
                  -1 + Math.random() * 2,
                ).normalize().multiplyScalar(0.40),
              })),
            })
          })
          
          gameStore.explosions = [...gameStore.explosions, ...updates]

          clearTimeout(gameStore.mutation.cancelExplosionTO)
          gameStore.mutation.cancelExplosionTO = setTimeout(() => {
            gameStore.explosions = gameStore.explosions.filter(
              ({ time }: { time: number }) => Date.now() - time <= 1000,
            )
          }, 1000)

          if (rocksHit.length > 0) {
            gameStore.actions.registerHit(rocksHit.length, 'rock')
          }
          
          if (enemiesHit.length > 0) {
            gameStore.actions.registerHit(enemiesHit.length, 'enemy')
          }

          gameStore.rocks = gameStore.rocks.filter((rock: any) => !rocksHit.find((r: any) => r.guid === rock.guid))
          gameStore.enemies = gameStore.enemies.filter(
            (enemy: any) => !enemiesHit.find((e: any) => e.guid === enemy.guid),
          )

          // Check if all enemies are destroyed
          if (enemiesHit.length > 0 && gameStore.enemies.length === 0 && gameStore.initialEnemyCount > 0) {
            // All enemies destroyed, provide bonus reward
            gameStore.battleScore += SCORE_VALUES.ALL_ENEMIES_BONUS
            gameStore.actions.addScoreNotification('No Enemy', SCORE_VALUES.ALL_ENEMIES_BONUS, true)
          }

          // Check if all rocks are destroyed
          if (rocksHit.length > 0 && gameStore.rocks.length === 0 && gameStore.initialRockCount > 0) {
            // All rocks cleared, provide bonus reward
            gameStore.battleScore += SCORE_VALUES.ALL_ROCKS_BONUS
            gameStore.actions.addScoreNotification('No Rock', SCORE_VALUES.ALL_ROCKS_BONUS, true)
          }
        }
      }
      else {
        // In Explore mode, set hits to 0 to avoid targeting UI
        mutation.hits = 0
      }
    }
    else if (observationMode === ObservationMode.Orbiting) {
      // In orbiting mode, update camera position based on orbit parameters

      // Calculate orbit position
      const horizontalRadius = mutation.orbitDistance * Math.cos(gameStore.orbitHeight)
      const x = mutation.orbitCenter.x + horizontalRadius * Math.cos(gameStore.orbitAngle)
      const z = mutation.orbitCenter.z + horizontalRadius * Math.sin(gameStore.orbitAngle)
      const y = mutation.orbitCenter.y + mutation.orbitDistance * Math.sin(gameStore.orbitHeight)

      mutation.position.set(x, y, z)

      // Automatically slowly rotate if mouse input is not controlling it
      gameStore.orbitAngle += mutation.orbitSpeed

      // Point camera at the center point
      gameStore.camera.position.copy(mutation.position)
      gameStore.camera.lookAt(mutation.orbitCenter)

      if (gameStore.currentPointOfInterest) {
        checkStardustCollection(gameStore)
      }
    }

    // Check if total loops reached (ensure check only happens once)
    if (gameStore.loopCount >= gameStore.totalLoops && !gameStore.modal.show) {
      // Show game over dialog
      gameStore.actions.showModal('gameOver')
    }
  }

  // Add the toggle info text function
  gameStore.actions.toggleInfoText = (show?: boolean) => {
    if (show !== false && show !== true) show = !gameStore.showInfoText
    gameStore.showInfoText = show
  }

  gameStore.actions.toggleObservationMode = (pointOfInterestKey: keyof typeof POINTS_OF_INTEREST | null) => {
    // Only available in explore mode
    if (gameStore.gameMode !== GameMode.Explore) return

    const { mutation } = gameStore

    // If already in observation mode or no point specified, reset to normal journey
    if (gameStore.observationMode !== ObservationMode.None || !pointOfInterestKey) {
      return gameStore.actions.resumeJourney()
    }

    // Get point of interest data
    const poi = POINTS_OF_INTEREST[pointOfInterestKey]
    if (!poi) return

    // Store current position and pause time info
    mutation.previousPosition.copy(mutation.position)
    mutation.previousTime = Date.now()
    mutation.isPaused = true

    // Set up orbit parameters
    mutation.orbitCenter.copy(track.parameters.path.getPointAt(poi.trackPosition).multiplyScalar(mutation.scale))
    mutation.orbitDistance = poi.orbitDistance
    mutation.orbitSpeed = poi.orbitSpeed

    // Initialize orbit angle
    gameStore.orbitAngle = 0
    gameStore.orbitHeight = 0

    // Set observation mode and current point of interest
    gameStore.observationMode = ObservationMode.Orbiting
    gameStore.currentPointOfInterest = pointOfInterestKey

    // Force game to pause movement along the track
    mutation.pausedTime = Date.now() - mutation.previousTime

    // Record observation start time for stardust collection
    if (pointOfInterestKey && !gameStore.observedPoints.includes(pointOfInterestKey)) {
      gameStore.mutation.observationStartTime = Date.now()
    }

    // If exiting observation mode, check if can collect Stardust
    if (!pointOfInterestKey && gameStore.mutation.observationStartTime) {
      checkStardustCollection(gameStore)
    }
  }

  gameStore.actions.updateOrbitPosition = (horizontalAngle: number, verticalAngle: number) => {
    if (gameStore.observationMode === ObservationMode.Orbiting) {
      // Update orbit angles based on input
      gameStore.orbitAngle = horizontalAngle
      gameStore.orbitHeight = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, verticalAngle))
    }
  }

  gameStore.actions.resumeJourney = () => {
    const { mutation } = gameStore

    // Only do something if we're in observation mode
    if (gameStore.observationMode === ObservationMode.None) return

    // Reset observation mode
    gameStore.observationMode = ObservationMode.None
    gameStore.currentPointOfInterest = null

    // Resume normal movement
    if (mutation.isPaused) {
      // Update start time to account for the paused duration
      mutation.startTime += (Date.now() - mutation.previousTime)
      mutation.isPaused = false
    }

    // Journey resumed
  }

  // Completely reset all game state when switching modes
  const originalSwitchGameMode = () => {
    const currentIsBattleMode = gameStore.gameMode === GameMode.Battle

    // Toggle between Battle and Explore modes
    gameStore.gameMode = currentIsBattleMode ? GameMode.Explore : GameMode.Battle
    gameStore.chainweb3D = generateChainweb3D(30, track, TRACK_POSITIONS.Chainweb3D, currentIsBattleMode)

    // Reset score,loopCount regardless of mode
    gameStore.battleScore = 0
    gameStore.loopCount = 0

    // Reset time by updating startTime to current time
    gameStore.mutation.startTime = Date.now()

    // Reset timer
    gameStore.timeManager.actions.reset(false)

    // Clear existing entities
    gameStore.lasers = []
    gameStore.explosions = []

    // Clear observed points for stardust collection when switching modes
    gameStore.observedPoints = []

    // Reset combo system
    gameStore.comboSystem.count = 0
    gameStore.comboSystem.active = false
    gameStore.comboSystem.lastHitTime = 0
    clearTimeout(gameStore.comboSystem.resetTimer)

    // Clear score notifications
    gameStore.scoreNotifications = []

    // Reset player position to the start of the track (t=0)
    gameStore.mutation.t = 0

    // Immediately update position to match t=0
    const startPos = track.parameters.path.getPointAt(0)
    gameStore.mutation.position.copy(startPos.multiplyScalar(gameStore.mutation.scale))

    // Regenerate game entities based on mode
    if (gameStore.gameMode === GameMode.Battle) {
      // Full set of rocks and enemies for Battle mode
      gameStore.rocks = randomData(100, track, 150, 8, () => 1 + Math.random() * 2.5, guid)
      gameStore.enemies = randomData(10, track, 20, 15, 1, guid)

      gameStore.initialRockCount = 100
      gameStore.initialEnemyCount = 10

      // Reset particles to full density for Battle mode
      gameStore.mutation.particles = randomData(500, track, 100, 1, () => 0.5 + Math.random() * 0.8, guid)
    }
    else {
      // Empty arrays for Explore mode
      gameStore.rocks = []
      gameStore.enemies = []

      gameStore.initialRockCount = 0
      gameStore.initialEnemyCount = 0

      // Reduce particles to 10% for a cleaner Explore mode
      gameStore.mutation.particles = randomData(50, track, 100, 1, () => 0.5 + Math.random() * 0.8, guid)
    }

    // Mode switch completed
  }

  gameStore.actions.switchGameMode = () => {
    // If game is in progress (loopCount > 0) and modal is not shown
    if (gameStore.loopCount > 0 && !gameStore.modal.show) {
      // Show switch confirmation dialog
      gameStore.actions.showModal('switchConfirm')
    }
    else {
      // Direct switch
      originalSwitchGameMode()
    }
  }

  gameStore.actions.switchSpeedMode = () => {
    // Toggle between speed modes
    if (gameStore.speedMode === SpeedMode.Fast) {
      gameStore.speedMode = SpeedMode.Slow
    }
    else if (gameStore.speedMode === SpeedMode.Slow) {
      gameStore.speedMode = SpeedMode.Normal
    }
    else {
      gameStore.speedMode = SpeedMode.Fast
    }

    const targetLooptime = SPEED_SETTINGS[gameStore.speedMode as keyof typeof SPEED_SETTINGS].looptime
    
    // Preserve current position in the track when changing speed
    const currentTime = Date.now()
    const currentT = gameStore.mutation.t
    gameStore.mutation.startTime = currentTime - (currentT * targetLooptime)
    gameStore.mutation.looptime = targetLooptime

    // Speed has been changed to new setting
  }
}