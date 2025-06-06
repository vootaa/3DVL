import type { TubeGeometry, Vector3Tuple } from 'three'
import { Euler, Matrix4, Vector3 } from 'three'
import { INFO_LABELS, TRACK_POSITIONS } from './constants'
import { calculateTrackPositionAndRotation } from './utils'
import type { ObjectData } from './types'

export function randomData(
  count: number, 
  track: TubeGeometry, 
  radius: number, 
  size: number, 
  scale: number | (() => number), 
  guid: number,
): ObjectData[] {
  const results = []
  for (let i = 0; i < count; i++) {
    const t = Math.random()
    const pos = track.parameters.path.getPointAt(t)
    pos.multiplyScalar(15)

    // Modify enemy position generation: limit vertical distance
    // Horizontal direction still maintains omnidirectional randomness
    const horizontalOffset = new Vector3(
      -radius + Math.random() * radius * 2,
      0, // Set to zero first, then add limited vertical offset later
      -radius + Math.random() * radius * 2,
    )

    // Vertical offset is controlled within a smaller range to reduce enemies generated too far below the track
    // Control vertical offset between -radius/2 and radius/2 to reduce distance of enemies below
    const verticalOffset = -radius / 2 + Math.random() * radius
    horizontalOffset.y = verticalOffset

    const offset = pos.clone().add(horizontalOffset)
    const speed = 1.0 + Math.random()

    results.push({
      guid: guid++,
      scale: typeof scale === 'function' ? scale() : scale,
      size,
      offset,
      pos,
      speed,
      radius,
      t,
      hit: new Vector3(),
      distance: 1000,
      rotation: new Euler(Math.random(), Math.random(), Math.random()),
    })
  }

  return results
}

export function generateRings(count: number, track: TubeGeometry, startT: number = TRACK_POSITIONS.RINGS) {
  const temp = []
  let t = startT

  // Two adjustable parameters to control ring size variations
  const baseScale = 15 + Math.random() * 10 // Base scale size (15-25)
  const scaleVariation = 0.5 + Math.random() * 1.5 // Scale variation range (0.5-2)

  // Add random wave parameters
  const waveFactor = 0.05 + Math.random() * 0.15 // Wave factor (0.05-0.2)
  const waveFrequency = 0.05 + Math.random() * 0.25 // Wave frequency (0.05-0.3)

  for (let i = 0; i < count; i++) {
    // Add a small random offset for each ring to make distribution more natural
    t += 0.001

    // Get position and rotation
    const { position, rotation } = calculateTrackPositionAndRotation(track, t)

    // Calculate scale using new parameters, adding randomness and wave effect
    const scale = baseScale
            + (i * scaleVariation * Math.sin(i * waveFrequency) * Math.PI / 2)
            + (Math.random() * waveFactor * baseScale)

    temp.push({
      position: position.toArray(),
      rotation,
      scale,
    })
  }

  return temp
}

export function generateChainweb3D(
  count: number,
  track: TubeGeometry,
  startT: number = TRACK_POSITIONS.Chainweb3D,
  isBattleMode: boolean = true,
) {
  const temp = []
  let t = startT

  const actualCount = isBattleMode ? Math.floor(count / 3) : count
  const stepMultiplier = isBattleMode ? 3 : 1

  for (let i = 0; i < actualCount; i++) {
    t += 0.004 * stepMultiplier
    const { position, rotation } = calculateTrackPositionAndRotation(track, t)

    temp.push({
      position: position.toArray(),
      rotation,
      scale: 100,
    })
  }

  return temp
}

export function generatePetersenGraph(track: TubeGeometry) {
  const temp = []

  for (const t of TRACK_POSITIONS.PETERSEN_GRAPH) {
    const { position, rotation } = calculateTrackPositionAndRotation(track, t)

    temp.push({
      position: position.toArray(),
      rotation,
      scale: 30,
    })
  }

  return temp
}

export function generateInfoLabels(track: TubeGeometry) {
  interface InfoLabel {
    position: Vector3Tuple
    rotation: { x: number; y: number; z: number }
    scale: number
    text: string
    color: string
  }

  const labels: InfoLabel[] = []

  // Process all info labels
  INFO_LABELS.forEach((label) => {
    const t = label.t

    // Get position on the track
    const { position, rotation } = calculateTrackPositionAndRotation(
      track,
      t,
      -10,
      (matrix) => {
        matrix.multiply(new Matrix4().makeRotationY(Math.PI))
        // Add a slight rotation to face labels more toward the camera
        matrix.multiply(new Matrix4().makeRotationX(-Math.PI / 12))
      },
    )

    labels.push({
      position: position.toArray(),
      rotation: {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
      },
      scale: 4.5,
      text: label.text,
      color: label.color,
    })
  })

  return labels
}

export function generateSpaceStationData(track: TubeGeometry, startT: number = TRACK_POSITIONS.SPACE_STATION) {
  const t = startT

  // Get position and rotation with offset
  // Add fourth parameter to make the space station perpendicular to the track
  const { position, rotation } = calculateTrackPositionAndRotation(track, t, 100)

  return {
    position: position.toArray(),
    rotation,
    scale: 8,
  }
}

export function generateSpaceProbeData(track: TubeGeometry, startT: number = TRACK_POSITIONS.SPACE_PROBE) {
  const t = startT

  // Get position and rotation with offset
  const { position, rotation } = calculateTrackPositionAndRotation(track, t, 100)

  return {
    position: position.toArray(),
    rotation,
    scale: 5,
  }
}