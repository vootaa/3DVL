import { Euler, Matrix4, Vector3 } from 'three'
import type { TubeGeometry } from 'three'
import { GrannyKnot } from 'three/examples/jsm/curves/CurveExtras.js'

import { gameStateManager } from '../core/GameStateManager'
import type { GameStore } from '../GameStore'

export class WiderGrannyKnot extends GrannyKnot {
  override getPoint(t: number) {
    const original = super.getPoint(t)
    return new Vector3(
      original.x * 1.6,
      original.y * 1.3,
      original.z * 1.15,
    )
  }
}

/**
 * Calculate position and rotation at a specific point on the track
 * @param track Track geometry
 * @param t Track parameter t (0-1)
 * @param offsetDistance Vertical offset distance (optional)
 * @param rotationAdjustment Rotation adjustment function (optional)
 * @returns Position and rotation information
 */
export function calculateTrackPositionAndRotation(
  track: TubeGeometry,
  t: number,
  offsetDistance: number = 0,
  rotationAdjustment: ((matrix: Matrix4) => void) | null = null,
) {
  const pos = track.parameters.path.getPointAt(t)
  pos.multiplyScalar(15)

  const segments = track.tangents.length
  const pickt = t * segments
  const pick = Math.floor(pickt)

  const lookAt = track.parameters.path.getPointAt(
    (t + 1 / track.parameters.path.getLength()) % 1,
  ).multiplyScalar(15)

  // Create orientation matrix
  const matrix = new Matrix4().lookAt(pos, lookAt, track.binormals[pick])

  // Apply custom rotation adjustment (if provided)
  if (rotationAdjustment) {
    rotationAdjustment(matrix)
  }

  // Extract rotation
  const rotation = new Euler().setFromRotationMatrix(matrix)

  // Add offset if needed
  if (offsetDistance !== 0) {
    const offset = track.binormals[pick].clone().multiplyScalar(offsetDistance)
    pos.add(offset)
  }

  return { position: pos, rotation }
}

export function checkStardustCollection(gameStore: GameStore) {
  // Safety check for currentPointOfInterest
  const poi = gameStore.currentPointOfInterest
  if (!poi) return

  if (gameStateManager.isObservationMode() && !gameStore.observedPoints.includes(poi)) {

    const observationStartTime = gameStore.mutation.observationStartTime || 0
    const observationTime = Date.now() - observationStartTime

    if (observationTime >= 20000) { // 20 seconds
      gameStore.observedPoints.push(poi)
      gameStore.actions.addStardust()
    }
  }
}