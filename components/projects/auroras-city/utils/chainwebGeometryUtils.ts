import { BufferGeometry, BufferAttribute, Vector3 } from 'three'

export interface ChainwebConfig {
    layerCount: number
    layerSpacing: number
    radiusScale: number
    nodeSize: number
    ringThickness: number
    segments?: number
    nodeShape?: 'cube' | 'sphere'
}

export interface ChainwebGeometry {
    rings: BufferGeometry[]
    nodes: BufferGeometry[]
    sameChainConnections: BufferGeometry[]
    crossChainConnections: BufferGeometry[]
}

// Polar coordinate configuration based on Chainweb3D_Building.md
const CHAINWEB_NODE_CONFIG = {
    nodes: [
        // Middle ring (chain IDs 0-4) - radius 0.6
        { id: 0, r: 0.6, theta: 288.0, ring: 'middle', type: 'middle-node' },
        { id: 1, r: 0.6, theta: 0.0, ring: 'middle', type: 'middle-node' },
        { id: 2, r: 0.6, theta: 72.0, ring: 'middle', type: 'middle-node' },
        { id: 3, r: 0.6, theta: 144.0, ring: 'middle', type: 'middle-node' },
        { id: 4, r: 0.6, theta: 216.0, ring: 'middle', type: 'middle-node' },

        // Inner ring (chain IDs 5-9) - radius 0.3
        { id: 5, r: 0.3, theta: 288.0, ring: 'inner', type: 'inner-node' },
        { id: 6, r: 0.3, theta: 0.0, ring: 'inner', type: 'inner-node' },
        { id: 7, r: 0.3, theta: 72.0, ring: 'inner', type: 'inner-node' },
        { id: 8, r: 0.3, theta: 144.0, ring: 'inner', type: 'inner-node' },
        { id: 9, r: 0.3, theta: 216.0, ring: 'inner', type: 'inner-node' },

        // Outer ring (chain IDs 10-19) - radius 0.96
        { id: 10, r: 0.96, theta: 278.0, ring: 'outer', type: 'outer-node' },
        { id: 11, r: 0.96, theta: 10.0, ring: 'outer', type: 'outer-node' },
        { id: 12, r: 0.96, theta: 62.0, ring: 'outer', type: 'outer-node' },
        { id: 13, r: 0.96, theta: 154.0, ring: 'outer', type: 'outer-node' },
        { id: 14, r: 0.96, theta: 206.0, ring: 'outer', type: 'outer-node' },
        { id: 15, r: 0.96, theta: 298.0, ring: 'outer', type: 'outer-node' },
        { id: 16, r: 0.96, theta: 350.0, ring: 'outer', type: 'outer-node' },
        { id: 17, r: 0.96, theta: 82.0, ring: 'outer', type: 'outer-node' },
        { id: 18, r: 0.96, theta: 134.0, ring: 'outer', type: 'outer-node' },
        { id: 19, r: 0.96, theta: 226.0, ring: 'outer', type: 'outer-node' }
    ],

    // Five-fold symmetry configuration
    symmetry: {
        rotationalSymmetry: 5,
        baseAngles: [0, 72, 144, 216, 288], // 72° intervals for 5-fold symmetry
        ringRadii: {
            inner: 0.3,
            middle: 0.6,
            outer: 0.96
        }
    }
}

// Ring configuration based on polar coordinates
const RING_CONFIG = {
    inner: { radius: 0.3, nodeCount: 5, chainIds: [5, 6, 7, 8, 9] },
    middle: { radius: 0.6, nodeCount: 5, chainIds: [0, 1, 2, 3, 4] },
    outer: { radius: 0.96, nodeCount: 10, chainIds: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19] }
}

// Cross-chain connections matrix
const CONNECTIONS = [
    [0, 5], [1, 6], [2, 7], [3, 8], [4, 9],   // Middle to Inner
    [0, 10], [1, 11], [2, 12], [3, 13], [4, 14], // Middle to Outer (group 1)
    [0, 15], [1, 16], [2, 17], [3, 18], [4, 19], // Middle to Outer (group 2)
    [5, 7], [6, 8], [7, 9], [8, 5], [9, 6],   // Inner circular
    [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], // Outer circular (group 1)
    [15, 16], [16, 17], [17, 18], [18, 19], [19, 10]  // Outer circular (group 2)
]

// Convert degrees to radians
function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
}

// Get node position using polar coordinates
function getNodePolarPosition(chainId: number, radiusScale: number): { x: number, z: number, radius: number } {
    const nodeConfig = CHAINWEB_NODE_CONFIG.nodes.find(node => node.id === chainId)
    if (!nodeConfig) {
        throw new Error(`Node configuration not found for chain ID: ${chainId}`)
    }

    const radius = nodeConfig.r * radiusScale
    const angleRad = degreesToRadians(nodeConfig.theta)

    const x = radius * Math.cos(angleRad)
    const z = radius * Math.sin(angleRad)

    return { x, z, radius }
}

export function createChainwebGeometry(config: ChainwebConfig): ChainwebGeometry {
    const { layerCount, layerSpacing, radiusScale, nodeSize, ringThickness, segments = 64, nodeShape = 'cube' } = config

    const rings: BufferGeometry[] = []
    const nodes: BufferGeometry[] = []
    const sameChainConnections: BufferGeometry[] = []
    const crossChainConnections: BufferGeometry[] = []

    // Generate node positions for all layers using polar coordinates
    const nodePositions = generateNodePositionsPolar(layerCount, layerSpacing, radiusScale)

    // Create ring geometries
    for (let layer = 0; layer < layerCount; layer++) {
        const layerY = layer * layerSpacing

        // Inner ring
        rings.push(createRingGeometry(
            RING_CONFIG.inner.radius * radiusScale,
            ringThickness,
            layerY,
            segments
        ))

        // Middle ring  
        rings.push(createRingGeometry(
            RING_CONFIG.middle.radius * radiusScale,
            ringThickness,
            layerY,
            segments
        ))

        // Outer ring
        rings.push(createRingGeometry(
            RING_CONFIG.outer.radius * radiusScale,
            ringThickness,
            layerY,
            segments
        ))
    }

    // Create node geometries with shape selection
    for (let layer = 0; layer < layerCount; layer++) {
        for (let chainId = 0; chainId < 20; chainId++) {
            const position = nodePositions[layer][chainId]
            nodes.push(createNodeGeometry(position, nodeSize, nodeShape))
        }
    }

    // Create same-chain connections (vertical)
    for (let layer = 0; layer < layerCount - 1; layer++) {
        for (let chainId = 0; chainId < 20; chainId++) {
            const startPos = nodePositions[layer][chainId]
            const endPos = nodePositions[layer + 1][chainId]
            sameChainConnections.push(createConnectionGeometry(startPos, endPos))
        }
    }

    // Create cross-chain connections (diagonal)
    for (let layer = 0; layer < layerCount - 1; layer++) {
        // Forward connections
        for (const [fromId, toId] of CONNECTIONS) {
            const startPos = nodePositions[layer][fromId]
            const endPos = nodePositions[layer + 1][toId]
            crossChainConnections.push(createConnectionGeometry(startPos, endPos))
        }

        // Reverse connections (bidirectional)
        for (const [fromId, toId] of CONNECTIONS) {
            const startPos = nodePositions[layer][toId]
            const endPos = nodePositions[layer + 1][fromId]
            crossChainConnections.push(createConnectionGeometry(startPos, endPos))
        }
    }

    return {
        rings,
        nodes,
        sameChainConnections,
        crossChainConnections
    }
}

function generateNodePositionsPolar(layerCount: number, layerSpacing: number, radiusScale: number): Vector3[][] {
    const positions: Vector3[][] = []

    for (let layer = 0; layer < layerCount; layer++) {
        const layerPositions: Vector3[] = []
        const layerY = layer * layerSpacing

        for (let chainId = 0; chainId < 20; chainId++) {
            const { x, z } = getNodePolarPosition(chainId, radiusScale)
            layerPositions.push(new Vector3(x, layerY, z))
        }

        positions.push(layerPositions)
    }

    return positions
}

function createRingGeometry(radius: number, thickness: number, y: number, segments: number): BufferGeometry {
    const geometry = new BufferGeometry()
    const vertices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    // Create ring vertices
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2

        // Inner edge
        const innerX = Math.cos(angle) * radius
        const innerZ = Math.sin(angle) * radius
        vertices.push(innerX, y, innerZ)
        normals.push(0, 1, 0)
        uvs.push(0, i / segments)

        // Outer edge
        const outerX = Math.cos(angle) * (radius + thickness)
        const outerZ = Math.sin(angle) * (radius + thickness)
        vertices.push(outerX, y, outerZ)
        normals.push(0, 1, 0)
        uvs.push(1, i / segments)

        // Create faces
        if (i < segments) {
            const current = i * 2
            const next = (i + 1) * 2

            // Two triangles per segment
            indices.push(current, current + 1, next)
            indices.push(current + 1, next + 1, next)
        }
    }

    geometry.setIndex(indices)
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))

    return geometry
}

function createNodeGeometry(position: Vector3, size: number, shape: 'cube' | 'sphere' = 'cube'): BufferGeometry {
    const geometry = new BufferGeometry()
    const vertices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    const { x, y, z } = position

    if (shape === 'cube') {
        // Create cube geometry
        const halfSize = size / 2

        // Define 8 vertices of a cube
        const cubeVertices = [
            // Front face
            x - halfSize, y - halfSize, z + halfSize,  // 0
            x + halfSize, y - halfSize, z + halfSize,  // 1
            x + halfSize, y + halfSize, z + halfSize,  // 2
            x - halfSize, y + halfSize, z + halfSize,  // 3

            // Back face
            x - halfSize, y - halfSize, z - halfSize,  // 4
            x + halfSize, y - halfSize, z - halfSize,  // 5
            x + halfSize, y + halfSize, z - halfSize,  // 6
            x - halfSize, y + halfSize, z - halfSize,  // 7
        ]

        vertices.push(...cubeVertices)

        // Define normals for each vertex (pointing outward)
        const cubeNormals = [
            // Front face
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            // Back face
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        ]

        normals.push(...cubeNormals)

        // Define UV coordinates
        const cubeUVs = [
            // Front face
            0, 0, 1, 0, 1, 1, 0, 1,
            // Back face
            0, 0, 1, 0, 1, 1, 0, 1,
        ]

        uvs.push(...cubeUVs)

        // Define faces using indices
        const cubeIndices = [
            // Front face
            0, 1, 2, 0, 2, 3,
            // Back face
            4, 6, 5, 4, 7, 6,
            // Top face
            3, 2, 6, 3, 6, 7,
            // Bottom face
            0, 4, 5, 0, 5, 1,
            // Right face
            1, 5, 6, 1, 6, 2,
            // Left face
            0, 3, 7, 0, 7, 4,
        ]

        indices.push(...cubeIndices)

    } else if (shape === 'sphere') {
        // Create sphere geometry using icosahedron approach
        const radius = size / 2
        const recursionLevel = 1 // Simple sphere subdivision

        // Create icosahedron vertices
        const t = (1.0 + Math.sqrt(5.0)) / 2.0

        const icosahedronVertices = [
            // 12 vertices of icosahedron
            x - 1, y + t, z + 0, x + 1, y + t, z + 0, x - 1, y - t, z + 0, x + 1, y - t, z + 0,
            x + 0, y - 1, z + t, x + 0, y + 1, z + t, x + 0, y - 1, z - t, x + 0, y + 1, z - t,
            x + t, y + 0, z - 1, x + t, y + 0, z + 1, x - t, y + 0, z - 1, x - t, y + 0, z + 1,
        ]

        // Normalize vertices to sphere radius and position
        for (let i = 0; i < icosahedronVertices.length; i += 3) {
            const vx = icosahedronVertices[i] - x
            const vy = icosahedronVertices[i + 1] - y
            const vz = icosahedronVertices[i + 2] - z

            const length = Math.sqrt(vx * vx + vy * vy + vz * vz)
            const normalizedX = (vx / length) * radius + x
            const normalizedY = (vy / length) * radius + y
            const normalizedZ = (vz / length) * radius + z

            vertices.push(normalizedX, normalizedY, normalizedZ)

            // Normal is the same as the normalized vertex direction
            normals.push((vx / length), (vy / length), (vz / length))

            // Simple UV mapping
            const u = Math.atan2(vz, vx) / (2 * Math.PI) + 0.5
            const v = Math.asin(vy / length) / Math.PI + 0.5
            uvs.push(u, v)
        }

        // Define icosahedron faces
        const icosahedronIndices = [
            // 20 triangular faces
            0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
            1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
            3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
            4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
        ]

        indices.push(...icosahedronIndices)
    }

    geometry.setIndex(indices)
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))

    return geometry
}

function createConnectionGeometry(start: Vector3, end: Vector3): BufferGeometry {
    const geometry = new BufferGeometry()
    const vertices = new Float32Array([
        start.x, start.y, start.z,
        end.x, end.y, end.z
    ])

    geometry.setAttribute('position', new BufferAttribute(vertices, 3))
    return geometry
}

// Helper function to get connection count statistics
export function getConnectionStats(layerCount: number): {
    totalNodes: number
    totalRings: number
    sameChainConnections: number
    crossChainConnections: number
} {
    const totalNodes = layerCount * 20
    const totalRings = layerCount * 3
    const sameChainConnections = (layerCount - 1) * 20
    const crossChainConnections = (layerCount - 1) * 60 // 30 forward + 30 reverse

    return {
        totalNodes,
        totalRings,
        sameChainConnections,
        crossChainConnections
    }
}

// Export polar coordinate utilities
export function getNodeConfig(chainId: number) {
    return CHAINWEB_NODE_CONFIG.nodes.find(node => node.id === chainId)
}

export function getSymmetryConfig() {
    return CHAINWEB_NODE_CONFIG.symmetry
}

export { CHAINWEB_NODE_CONFIG, degreesToRadians, getNodePolarPosition }