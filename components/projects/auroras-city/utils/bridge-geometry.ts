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
    const faceTypes: number[] = []

    let vertexOffset = 0
    let patchId = 0

    const rowCount = 2 // 2 rows of bricks on the top surface

    bridges.forEach((bridge, bridgeIdx) => {
        const from = bridge.from
        const to = bridge.to
        const length = from.distanceTo(to)
        const segmentCount = Math.max(2, Math.ceil(length / segmentLength))

        // Sample points for the top surface
        const topRows: Vector3[][] = []
        // Sample points for the sides and bottom
        const sideRows: Vector3[][] = []
        const bottomRows: Vector3[][] = []

        for (let i = 0; i <= segmentCount; i++) {
            const t = i / segmentCount
            const center = from.clone().lerp(to, t)
            center.y += archHeight * Math.sin(Math.PI * t)
            const dir = to.clone().sub(from).normalize()
            const up = new Vector3(0, 1, 0)
            const side = new Vector3().crossVectors(dir, up).normalize().multiplyScalar(width / 2)

            // 2 rows on the top surface (can be extended to 3 rows)
            const row: Vector3[] = []
            for (let j = 0; j < rowCount; j++) {
                const offset = side.clone().multiplyScalar((j / (rowCount - 1)) * 2 - 1)
                row.push(center.clone().add(offset))
            }
            topRows.push(row)

            // Sides (two points per side)
            sideRows.push([
                center.clone().add(side),
                center.clone().add(side.clone().negate())
            ])
            // Bottom (two points per side, shifted down by thickness)
            bottomRows.push([
                center.clone().add(side).add(new Vector3(0, -thickness, 0)),
                center.clone().add(side.clone().negate()).add(new Vector3(0, -thickness, 0))
            ])
        }

        // Top surface brick stitching (each patch has independent attributes)
        for (let i = 0; i < segmentCount; i++) {
            for (let j = 0; j < rowCount - 1; j++) {
                // Random brick type
                const patchType = 3 + Math.floor(Math.random() * 4)
                const a = vertexOffset + i * rowCount + j
                const b = vertexOffset + (i + 1) * rowCount + j
                const c = vertexOffset + (i + 1) * rowCount + j + 1
                const d = vertexOffset + i * rowCount + j + 1
                indices.push(a, b, d)
                indices.push(b, c, d)
                // Fill attributes (all four vertices get the same patch attributes)
                for (const idx of [a, b, c, d]) {
                    patchTypes[idx] = patchType
                    patchIds[idx] = patchId
                    colorSeeds[idx] = Math.random()
                    bridgeIds[idx] = bridgeIdx
                    faceTypes[idx] = 0 // Top surface
                }
                patchId++
            }
        }
        // Fill top surface vertices
        for (let i = 0; i <= segmentCount; i++) {
            for (let j = 0; j < rowCount; j++) {
                const v = topRows[i][j]
                positions.push(v.x, v.y, v.z)
            }
        }
        vertexOffset += (segmentCount + 1) * rowCount

        // Sides (treated as a whole, unified attributes)
        const sideStart = vertexOffset
        for (let i = 0; i < segmentCount; i++) {
            for (let j = 0; j < 1; j++) {
                const a = sideStart + i * 2 + j
                const b = sideStart + (i + 1) * 2 + j
                const c = sideStart + (i + 1) * 2 + j + 1
                const d = sideStart + i * 2 + j + 1
                indices.push(a, b, d)
                indices.push(b, c, d)
            }
        }
        for (let i = 0; i <= segmentCount; i++) {
            for (let j = 0; j < 2; j++) {
                const v = sideRows[i][j]
                positions.push(v.x, v.y, v.z)
                patchTypes.push(0)
                patchIds.push(0)
                colorSeeds.push(0)
                bridgeIds.push(bridgeIdx)
                faceTypes.push(1) // Side
            }
        }
        vertexOffset += (segmentCount + 1) * 2

        // Bottom (treated as a whole, unified attributes)
        const bottomStart = vertexOffset
        for (let i = 0; i < segmentCount; i++) {
            for (let j = 0; j < 1; j++) {
                const a = bottomStart + i * 2 + j
                const b = bottomStart + (i + 1) * 2 + j
                const c = bottomStart + (i + 1) * 2 + j + 1
                const d = bottomStart + i * 2 + j + 1
                indices.push(a, d, b)
                indices.push(b, d, c)
            }
        }
        for (let i = 0; i <= segmentCount; i++) {
            for (let j = 0; j < 2; j++) {
                const v = bottomRows[i][j]
                positions.push(v.x, v.y, v.z)
                patchTypes.push(0)
                patchIds.push(0)
                colorSeeds.push(0)
                bridgeIds.push(bridgeIdx)
                faceTypes.push(2) // Bottom
            }
        }
        vertexOffset += (segmentCount + 1) * 2
    })

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    geometry.setAttribute('patchType', new BufferAttribute(new Float32Array(patchTypes), 1))
    geometry.setAttribute('patchId', new BufferAttribute(new Float32Array(patchIds), 1))
    geometry.setAttribute('colorSeed', new BufferAttribute(new Float32Array(colorSeeds), 1))
    geometry.setAttribute('bridgeId', new BufferAttribute(new Float32Array(bridgeIds), 1))
    geometry.setAttribute('faceType', new BufferAttribute(new Float32Array(faceTypes), 1))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
}