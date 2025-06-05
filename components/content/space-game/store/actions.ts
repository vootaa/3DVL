import type { PerspectiveCamera } from 'three'
import { Vector3 } from 'three'
import {
  SCORE_VALUES,
  SPEED_SETTINGS,
  TRACK_POSITIONS,
  SpeedMode,
  ModalType,
} from './constants'

import { checkStardustCollection } from './utils'
import { randomData } from './generators'

import { GameState } from '../core/constants'
import { gameStateManager } from '../core/GameStateManager'

import type { HitType } from './types'
import type { GameStore } from '../GameStore'

export function initializeActions(gameStore: GameStore) {
  let gameController: any = null

  function setGameController(controller: any) {
    gameController = controller
  }

  gameStore.actions.setGameController = setGameController

  function playSound(name: string, loop = false, volume = 1.0) {
    if (gameStore.audioSystem && gameStore.sound) {
      return gameStore.audioSystem.play(name, loop, volume)
    }
    return null
  }

  // Initialize game with specific mode
  gameStore.actions.startGame = (mode: GameState) => {
    const track = gameStore.mutation.track
    const guid = gameStore.guid

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

    // Reset observation state
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

    // Setup entities based on game state
    if (mode === GameState.BATTLE) {
      gameStore.initialEnemyCount = 10
      gameStore.initialRockCount = 100
      gameStore.particlesCount = 500
      gameStore.enemies = randomData(gameStore.initialEnemyCount, track, 20, 15, () => 1 + Math.random() * 1.5, guid)
      gameStore.rocks = randomData(gameStore.initialRockCount, track, 150, 8, () => 1 + Math.random() * 3, guid)
    } else if (mode === GameState.EXPLORE) {
      gameStore.enemies = []
      gameStore.rocks = []
      gameStore.initialRockCount = 0
      gameStore.initialEnemyCount = 0
      gameStore.particlesCount = 50
    }

    gameStore.mutation.particles = randomData(gameStore.particlesCount,
      track, 100, 1, () => 0.5 + Math.random() * 0.8, guid)
  }

  // Modal display methods
  gameStore.actions.showModal = (type: ModalType) => {
    gameStore.modal.show = true
    gameStore.modal.type = type

    // Pause game time, but continue total time
    gameStore.timeManager.actions.pause()
  }

  // Implement hide modal method
  gameStore.actions.hideModal = () => {
    gameStore.modal.show = false

    // Ensure game time resumes counting (only if not game over)
    if (gameStore.modal.type === ModalType.SWITCH_CONFIRM) {
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

  // Combat system
  gameStore.actions.registerHit = (count: number, type: HitType) => {
    const now = Date.now()

    // Only process combos in Battle mode
    if (gameStateManager.getCurrentState() !== GameState.BATTLE) return

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

  // Audio control
  gameStore.actions.toggleSound = (sound = !gameStore.sound) => {
    if (!gameStore.audioSystem) {
      console.warn('Audio system not initialized yet, cannot toggle sound')
      return
    }

    gameStore.sound = sound

    if (sound) {
      gameStore.audioSystem.resumeAll()
      const currentState = gameController ? gameController.getCurrentState() : gameStateManager.getCurrentState()
      if (currentState !== GameState.LAUNCH) {
        playSound('bg', true, 0.3)

        if (currentState !== GameState.OBSERVATION) {
          playSound('engine', true, 0.7)
          playSound('engine2', true, 0.3)
        }
      }
    }
    else {
      gameStore.audioSystem.stopAll()
    }
  }

  // Initialize camera and game
  gameStore.actions.init = (camera: PerspectiveCamera) => {
    gameStore.sound = false
    gameStore.mutation.clock.start()
    gameStore.camera = camera
    gameStore.camera.far = 10000
  }

  // Shooting system
  gameStore.actions.shoot = () => {
    // Only allow shooting in Battle mode
    const canShoot = gameController ? gameController.canShoot() : gameStateManager.canShoot()
    if (canShoot) {
      gameStore.lasers = [...gameStore.lasers, Date.now()]
      clearTimeout(gameStore.mutation.cancelLaserTO)
      gameStore.mutation.cancelLaserTO = setTimeout(() => {
        gameStore.lasers = gameStore.lasers.filter((t: number) => Date.now() - t <= 1000)
      }, 1000)
      playSound('zap')
    }
  }

  // Collision detection
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

    return !!result
  }

  // Main update loop
  gameStore.actions.update = () => {
    const currentState = gameController ? gameController.getCurrentState() : gameStateManager.getCurrentState()
    const mutation = gameStore.mutation

    if (currentState === GameState.OBSERVATION) {
      // In observation mode, update camera position based on orbit parameters
      const horizontalRadius = mutation.orbitDistance * Math.cos(gameStore.orbitHeight)
      const x = mutation.orbitCenter.x + horizontalRadius * Math.cos(gameStore.orbitAngle)
      const z = mutation.orbitCenter.z + horizontalRadius * Math.sin(gameStore.orbitAngle)
      const y = mutation.orbitCenter.y + mutation.orbitDistance * Math.sin(gameStore.orbitHeight)

      mutation.position.set(x, y, z)

      // Automatically slowly rotate if mouse input is not controlling it
      gameStore.orbitAngle += mutation.orbitSpeed

      // Point camera at the center point
      if (gameStore.camera) {
        gameStore.camera.position.copy(mutation.position)
        gameStore.camera.lookAt(mutation.orbitCenter)
      }

      if (gameStore.currentPointOfInterest) {
        checkStardustCollection(gameStore)
      }
      return
    }

    // Normal gameplay update (BATTLE or EXPLORE states)
    if (currentState === GameState.BATTLE || currentState === GameState.EXPLORE) {
      const { rocks, enemies, speedMode } = gameStore

      const time = Date.now()
      const t = (mutation.t = ((time - mutation.startTime) % mutation.looptime) / mutation.looptime)

      if (mutation.lastT > 0.9 && t < 0.1) {
        gameStore.loopCount++
      }
      mutation.lastT = t

      mutation.position = gameStore.spline.getPointAt(t)
      mutation.position.multiplyScalar(mutation.scale)

      const speedFactor = SPEED_SETTINGS[speedMode as keyof typeof SPEED_SETTINGS].factor
      if (gameStore.camera) {
        gameStore.camera.fov = 70 + (speedFactor - 1.0) * 10
        gameStore.camera.updateProjectionMatrix()
      }

      // Test for wormhole/warp
      let warping = false
      if (t > TRACK_POSITIONS.WARP_BEGIN && t < TRACK_POSITIONS.WARP_END) {
        if (!warping) {
          warping = true
          playSound('warp', true, 0.5)
        }
      } else if (t > TRACK_POSITIONS.WARP_RESET) {
        warping = false
      }

      // Only process hits and collisions in Battle mode
      if (currentState === GameState.BATTLE) {
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

          // Create explosion particles
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

          // Check completion bonuses
          if (enemiesHit.length > 0 && gameStore.enemies.length === 0 && gameStore.initialEnemyCount > 0) {
            gameStore.battleScore += SCORE_VALUES.ALL_ENEMIES_BONUS
            gameStore.actions.addScoreNotification('No Enemy', SCORE_VALUES.ALL_ENEMIES_BONUS, true)
          }

          if (rocksHit.length > 0 && gameStore.rocks.length === 0 && gameStore.initialRockCount > 0) {
            gameStore.battleScore += SCORE_VALUES.ALL_ROCKS_BONUS
            gameStore.actions.addScoreNotification('No Rock', SCORE_VALUES.ALL_ROCKS_BONUS, true)
          }
        }
      } else {
        // In Explore mode, set hits to 0 to avoid targeting UI
        mutation.hits = 0
      }
    }

    // Check if total loops reached
    if (gameStore.loopCount >= gameStore.totalLoops && !gameStore.modal.show) {
      gameStore.actions.showModal(ModalType.GAME_OVER)
    }
  }

  // Info text toggle
  gameStore.actions.toggleInfoText = (show?: boolean) => {
    if (show !== false && show !== true) show = !gameStore.showInfoText
    gameStore.showInfoText = show
  }

  // Mode switching - now delegates to GameController
  gameStore.actions.switchGameMode = () => {
    // If game is in progress and modal is not shown
    if (!gameStore.modal.show) {
      gameStore.actions.showModal(ModalType.SWITCH_CONFIRM)
    } else {
      if (gameController) {
        gameController.switchGameMode();
      } else {
        if (gameStateManager.isBattleMode()) {
          gameStateManager.setState(GameState.EXPLORE);
          gameStore.actions.startGame(GameState.EXPLORE);
        } else if (gameStateManager.isExploreMode()) {
          gameStateManager.setState(GameState.BATTLE);
          gameStore.actions.startGame(GameState.BATTLE);
        }
      }

      // Close the confirmation modal
      gameStore.actions.hideModal()
    }
  }

  // Speed mode switching
  gameStore.actions.switchSpeedMode = () => {
    if (gameStore.speedMode === SpeedMode.Fast) {
      gameStore.speedMode = SpeedMode.Slow
    } else if (gameStore.speedMode === SpeedMode.Slow) {
      gameStore.speedMode = SpeedMode.Normal
    } else {
      gameStore.speedMode = SpeedMode.Fast
    }

    const targetLooptime = SPEED_SETTINGS[gameStore.speedMode as keyof typeof SPEED_SETTINGS].looptime

    const currentTime = Date.now()
    const currentT = gameStore.mutation.t
    gameStore.mutation.startTime = currentTime - (currentT * targetLooptime)
    gameStore.mutation.looptime = targetLooptime
  }
}