import { Color, Euler, Vector3 } from 'three'

let guid = 0

// Based on the PetersenGraph GLSL implementation
const MIDDLE_RADIUS = 0.3
const INNER_RADIUS = 0.15
const OUTER_RADIUS = 0.48

// Node angles in radians (20 nodes as in the shader)
const ANGLES = [
  // Middle circle (chainId 0-4)
  5.0265, 0.0, 1.2566, 2.5133, 3.7699,
  // Inner circle (chainId 5-9)
  5.0265, 0.0, 1.2566, 2.5133, 3.7699,
  // Outer circle (chainId 10-19)
  4.8521, 0.1745, 1.0821, 2.6878, 3.5954, 5.2009, 6.1087, 1.4312, 2.3387, 3.9444,
]

// Connection lookup table (from, to)
const CONNECTIONS = [
  // Middle to inner (+5 pattern)
  [0, 5], [1, 6], [2, 7], [3, 8], [4, 9],
  // Middle to outer (+10 pattern)
  [0, 10], [1, 11], [2, 12], [3, 13], [4, 14],
  // Middle to outer (+15 pattern)
  [0, 15], [1, 16], [2, 17], [3, 18], [4, 19],
  // Inner circle connections
  [5, 7], [6, 8], [7, 9], [8, 5], [9, 6],
  // Outer circle connections
  [10, 11], [11, 12], [12, 13], [13, 14], [14, 15],
  [15, 16], [16, 17], [17, 18], [18, 19], [19, 10],
]

// Connection types for coloring
const CONN_TYPE = [
  // Connection types by group
  0, 0, 0, 0, 0, // Middle to inner
  1, 1, 1, 1, 1, // Middle to outer (+10)
  2, 2, 2, 2, 2, // Middle to outer (+15)
  3, 3, 3, 3, 3, // Inner circle
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, // Outer circle
]

export enum ConnectionType {
  INTRA_LAYER = 0, // Connection within the same layer
  INTER_LAYER = 1, // Connection between different layers
}

export interface ChainNode {
  id: number
  chainId: number
  layerId: number
  position: Vector3
  color: Color
  radius: number
  connections: Connection[]
}

export interface Connection {
  fromNode: number
  toNode: number
  fromLayer: number
  toLayer: number
  type: ConnectionType
  connType: number // Visual style from CONN_TYPE
  color: Color
}

export interface LayerConfiguration {
  z: number
  scale: number
  rings: RingConfiguration[]
}

export interface RingConfiguration {
  radius: number
  color: Color
  thickness: number
}

// Get node position based on chainId
function getNodePosition(chainId: number): Vector3 {
  const angle = ANGLES[chainId]
  let radius

  if (chainId < 5) {
    radius = MIDDLE_RADIUS
  }
  else if (chainId < 10) {
    radius = INNER_RADIUS
  }
  else {
    radius = OUTER_RADIUS
  }

  return new Vector3(
    radius * Math.cos(angle),
    radius * Math.sin(angle),
    0,
  )
}

// Generate node color based on chainId
function getNodeColor(chainId: number): Color {
  if (chainId < 5) {
    return new Color('red')
  }
  else if (chainId < 10) {
    return new Color('blue')
  }
  else {
    return new Color('yellow')
  }
}

// Generate connection color based on connection type
function getConnectionColor(connType: number): Color {
  switch (connType) {
    case 0: return new Color('#ff6648') // Red - Middle to inner circle
    case 1: return new Color('#e5b24d') // Gold - Middle to outer circle (+10)
    case 2: return new Color('#3896f4') // Blue - Middle to outer circle (+15)
    case 3: return new Color('#4de5ff') // Cyan - Inner circle connections
    case 4: return new Color('#ffff35') // Yellow - Outer circle connections
    default: return new Color('gray')
  }
}

// Create a single layer of nodes
export function createLayer(layerId: number, zPosition: number = 0, scale: number = 1): ChainNode[] {
  const nodes: ChainNode[] = []

  for (let chainId = 0; chainId < 20; chainId++) {
    const basePosition = getNodePosition(chainId)
    const position = new Vector3(
      basePosition.x * scale,
      basePosition.y * scale,
      zPosition,
    )

    nodes.push({
      id: guid++,
      chainId,
      layerId,
      position,
      color: getNodeColor(chainId),
      radius: 0.025 * scale,
      connections: [],
    })
  }

  return nodes
}

// Generate intra-layer connections (within the same layer)
export function generateIntraLayerConnections(nodes: ChainNode[]): Connection[] {
  const connections: Connection[] = []
  const layerId = nodes[0].layerId

  for (let i = 0; i < CONNECTIONS.length; i++) {
    const [aId, bId] = CONNECTIONS[i]
    const connType = CONN_TYPE[i]

    connections.push({
      fromNode: aId,
      toNode: bId,
      fromLayer: layerId,
      toLayer: layerId,
      type: ConnectionType.INTRA_LAYER,
      connType,
      color: getConnectionColor(connType),
    })
  }

  return connections
}

// Generate inter-layer connections (between adjacent layers)
export function generateInterLayerConnections(
  sourceLayer: ChainNode[],
  targetLayer: ChainNode[],
): Connection[] {
  const connections: Connection[] = []
  const sourceLayerId = sourceLayer[0].layerId
  const targetLayerId = targetLayer[0].layerId

  // Generate bidirectional cross-chain connections between layers
  for (let i = 0; i < CONNECTIONS.length; i++) {
    const [aId, bId] = CONNECTIONS[i]
    const connType = CONN_TYPE[i]

    // A->B
    connections.push({
      fromNode: aId,
      toNode: bId,
      fromLayer: sourceLayerId,
      toLayer: targetLayerId,
      type: ConnectionType.INTRA_LAYER,
      connType,
      color: getConnectionColor(connType),
    })

    // B->A
    connections.push({
      fromNode: bId,
      toNode: aId,
      fromLayer: sourceLayerId,
      toLayer: targetLayerId,
      type: ConnectionType.INTRA_LAYER,
      connType,
      color: getConnectionColor(connType),
    })
  }

  // Add same-chain connections (one per chain in each direction)
  for (let i = 0; i < 20; i++) {
    connections.push({
      fromNode: i,
      toNode: i,
      fromLayer: sourceLayerId,
      toLayer: targetLayerId,
      type: ConnectionType.INTER_LAYER,
      connType: 5, // Special connType for same-chain connections
      color: new Color('white').lerp(getNodeColor(i), 0.5),
    })
  }

  return connections
}

// Create ring configurations for a layer
export function createRingConfigurations(scale: number = 1): RingConfiguration[] {
  return [
    {
      radius: INNER_RADIUS * scale,
      color: new Color(0x4cc8ff), // Blue tint
      thickness: 0.003 * scale,
    },
    {
      radius: MIDDLE_RADIUS * scale,
      color: new Color(0xff7f4d), // Red tint
      thickness: 0.003 * scale,
    },
    {
      radius: OUTER_RADIUS * scale,
      color: new Color(0xffff66), // Yellow tint
      thickness: 0.003 * scale,
    },
  ]
}

// Generate layer configurations for creating a stack of layers
export function generateLayerConfigurations(layerCount: number, baseScale: number = 1): LayerConfiguration[] {
  const layers: LayerConfiguration[] = []
  const depthStep = 0.2 * baseScale

  for (let i = 0; i < layerCount; i++) {
    // Scale decreases with depth to create perspective
    const layerScale = baseScale * (1 - i * 0.05)
    layers.push({
      z: -i * depthStep,
      scale: layerScale,
      rings: createRingConfigurations(layerScale),
    })
  }

  return layers
}
