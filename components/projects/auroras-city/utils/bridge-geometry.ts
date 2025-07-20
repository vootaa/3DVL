import { BufferGeometry, BufferAttribute, Vector3 } from 'three'

export function createAllIrregularBridgesGeometry(
    bridges: Array<{ from: Vector3, to: Vector3 }>,
    width: number,
    archHeight: number,
    thickness: number,
    segmentLength: number = 0.5
) {
    const positions: number[] = []
    const indices: number[] = []
    const patchTypes: number[] = []
    const patchIds: number[] = []
    const colorSeeds: number[] = []
    const bridgeIds: number[] = []

    let vertexOffset = 0
    let patchId = 0

    bridges.forEach((bridge, bridgeIdx) => {
        const from = bridge.from
        const to = bridge.to
        const length = from.distanceTo(to)
        const segmentCount = Math.max(2, Math.ceil(length / segmentLength))
        // Sample points
        const topRows: Vector3[][] = []
        const bottomRows: Vector3[][] = []
        for (let i = 0; i <= segmentCount; i++) {
            const t = i / segmentCount
            const center = from.clone().lerp(to, t)
            center.y += archHeight * Math.sin(Math.PI * t)
            // Cross-section rectangle 4 points (can be changed to polygon)
            const dir = to.clone().sub(from).normalize()
            const up = new Vector3(0, 1, 0)
            const side = new Vector3().crossVectors(dir, up).normalize().multiplyScalar(width / 2)
            const cross = [
                side.clone(),
                side.clone().negate()
            ]
            // Top and bottom surfaces
            const topRow = cross.map(s => center.clone().add(s))
            const bottomRow = cross.map(s => center.clone().add(s).add(new Vector3(0, -thickness, 0)))
            topRows.push(topRow)
            bottomRows.push(bottomRow)
        }
        // Generate faces
        for (let i = 0; i < segmentCount; i++) {
            // Top face
            for (let j = 0; j < 1; j++) {
                const a = vertexOffset + i * 2 + j
                const b = vertexOffset + (i + 1) * 2 + j
                const c = vertexOffset + (i + 1) * 2 + j + 1
                const d = vertexOffset + i * 2 + j + 1
                indices.push(a, b, d)
                indices.push(b, c, d)
            }
            // Bottom face (reversed)
            for (let j = 0; j < 1; j++) {
                const a = vertexOffset + (segmentCount + 1) * 2 + i * 2 + j
                const b = vertexOffset + (segmentCount + 1) * 2 + (i + 1) * 2 + j
                const c = vertexOffset + (segmentCount + 1) * 2 + (i + 1) * 2 + j + 1
                const d = vertexOffset + (segmentCount + 1) * 2 + i * 2 + j + 1
                indices.push(a, d, b)
                indices.push(b, d, c)
            }
            // Side faces
            for (let j = 0; j < 2; j++) {
                const a = vertexOffset + i * 2 + j
                const b = vertexOffset + (i + 1) * 2 + j
                const c = vertexOffset + (segmentCount + 1) * 2 + (i + 1) * 2 + j
                const d = vertexOffset + (segmentCount + 1) * 2 + i * 2 + j
                indices.push(a, b, d)
                indices.push(b, c, d)
            }
        }
        // Fill attributes and vertices
        for (let i = 0; i <= segmentCount; i++) {
            for (let j = 0; j < 2; j++) {
                // Top face
                const v = topRows[i][j]
                positions.push(v.x, v.y, v.z)
                patchTypes.push(4)
                patchIds.push(patchId + i)
                colorSeeds.push(Math.random())
                bridgeIds.push(bridgeIdx)
            }
        }
        for (let i = 0; i <= segmentCount; i++) {
            for (let j = 0; j < 2; j++) {
                // Bottom face
                const v = bottomRows[i][j]
                positions.push(v.x, v.y, v.z)
                patchTypes.push(4)
                patchIds.push(patchId + i)
                colorSeeds.push(Math.random())
                bridgeIds.push(bridgeIdx)
            }
        }
        vertexOffset += (segmentCount + 1) * 2 * 2
        patchId += segmentCount + 1
    })

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    geometry.setAttribute('patchType', new BufferAttribute(new Float32Array(patchTypes), 1))
    geometry.setAttribute('patchId', new BufferAttribute(new Float32Array(patchIds), 1))
    geometry.setAttribute('colorSeed', new BufferAttribute(new Float32Array(colorSeeds), 1))
    geometry.setAttribute('bridgeId', new BufferAttribute(new Float32Array(bridgeIds), 1))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
}