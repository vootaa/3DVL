import { BufferGeometry, BufferAttribute, Vector3 } from 'three'

export function createAllIrregularBridgesGeometry(
    bridges: Array<{ from: Vector3, to: Vector3 }>,
    width: number,
    archHeight: number,
    thickness: number,
    segmentLength: number = 0.5
) {
    const positions: number[] = []
    const normals: number[] = []
    const indices: number[] = []
    const patchTypes: number[] = []
    const patchIds: number[] = []
    const colorSeeds: number[] = []
    const bridgeIds: number[] = []
    const faceTypes: number[] = []

    let vertexIndex = 0
    let patchId = 0

    const rowCount = 3 // 3 rows of irregular patches on top surface

    bridges.forEach((bridge, bridgeIdx) => {
        const from = bridge.from
        const to = bridge.to
        const length = from.distanceTo(to)
        const segmentCount = Math.max(3, Math.ceil(length / segmentLength))

        // Generate path points with arch
        const pathPoints: Vector3[] = []
        for (let i = 0; i <= segmentCount; i++) {
            const t = i / segmentCount
            const center = from.clone().lerp(to, t)
            center.y += archHeight * Math.sin(Math.PI * t)
            pathPoints.push(center)
        }

        // Create cross-section points for each path point
        const topRows: Vector3[][] = []
        const bottomRows: Vector3[][] = []
        
        for (let i = 0; i <= segmentCount; i++) {
            const center = pathPoints[i]
            const dir = i < segmentCount ? 
                pathPoints[i + 1].clone().sub(center).normalize() :
                center.clone().sub(pathPoints[i - 1]).normalize()
            
            const up = new Vector3(0, 1, 0)
            const side = new Vector3().crossVectors(dir, up).normalize()

            // Top surface points (irregular spacing for variety)
            const topRow: Vector3[] = []
            for (let j = 0; j <= rowCount; j++) {
                const t = j / rowCount
                // Add slight randomness to create irregular patches
                const randomOffset = (Math.random() - 0.5) * 0.1 * width
                const offset = side.clone().multiplyScalar((t * 2 - 1) * width / 2 + randomOffset)
                topRow.push(center.clone().add(offset))
            }
            topRows.push(topRow)

            // Bottom surface points
            const bottomRow: Vector3[] = []
            for (let j = 0; j <= rowCount; j++) {
                const t = j / rowCount
                const offset = side.clone().multiplyScalar((t * 2 - 1) * width / 2)
                bottomRow.push(center.clone().add(offset).add(new Vector3(0, -thickness, 0)))
            }
            bottomRows.push(bottomRow)
        }

        // Create top surface patches (irregular quads)
        for (let i = 0; i < segmentCount; i++) {
            for (let j = 0; j < rowCount; j++) {
                const patchType = Math.floor(Math.random() * 8) // More variety
                const colorSeed = Math.random()
                
                // Create independent vertices for this patch (no sharing)
                const v1 = topRows[i][j]
                const v2 = topRows[i + 1][j]
                const v3 = topRows[i + 1][j + 1]
                const v4 = topRows[i][j + 1]

                // Calculate face normal
                const edge1 = v2.clone().sub(v1)
                const edge2 = v4.clone().sub(v1)
                const normal = new Vector3().crossVectors(edge1, edge2).normalize()

                // Add vertices (6 vertices for 2 triangles, no sharing)
                const patchVertices = [v1, v2, v4, v2, v3, v4]
                
                for (const vertex of patchVertices) {
                    positions.push(vertex.x, vertex.y, vertex.z)
                    normals.push(normal.x, normal.y, normal.z)
                    patchTypes.push(patchType)
                    patchIds.push(patchId)
                    colorSeeds.push(colorSeed)
                    bridgeIds.push(bridgeIdx)
                    faceTypes.push(0) // Top face
                }

                // Add indices for two triangles
                const startIdx = vertexIndex
                indices.push(
                    startIdx, startIdx + 1, startIdx + 2,     // First triangle
                    startIdx + 3, startIdx + 4, startIdx + 5  // Second triangle
                )
                
                vertexIndex += 6
                patchId++
            }
        }

        // Create side faces
        for (let i = 0; i < segmentCount; i++) {
            // Left side
            createSideFace(
                topRows[i][0], topRows[i + 1][0], 
                bottomRows[i + 1][0], bottomRows[i][0],
                bridgeIdx, patchId++
            )
            
            // Right side  
            createSideFace(
                topRows[i + 1][rowCount], topRows[i][rowCount],
                bottomRows[i][rowCount], bottomRows[i + 1][rowCount],
                bridgeIdx, patchId++
            )
        }

        // Create end faces
        if (bridgeIdx === 0) { // Only for first segment or as needed
            createEndFace(topRows[0], bottomRows[0], bridgeIdx, patchId++, true)
        }
        createEndFace(topRows[segmentCount], bottomRows[segmentCount], bridgeIdx, patchId++, false)

        // Create bottom surface
        for (let i = 0; i < segmentCount; i++) {
            for (let j = 0; j < rowCount; j++) {
                const v1 = bottomRows[i][j]
                const v2 = bottomRows[i][j + 1]
                const v3 = bottomRows[i + 1][j + 1]
                const v4 = bottomRows[i + 1][j]

                // Calculate face normal (pointing down)
                const edge1 = v2.clone().sub(v1)
                const edge2 = v4.clone().sub(v1)
                const normal = new Vector3().crossVectors(edge2, edge1).normalize()

                // Add vertices (6 vertices for 2 triangles)
                const patchVertices = [v1, v2, v4, v2, v3, v4]
                
                for (const vertex of patchVertices) {
                    positions.push(vertex.x, vertex.y, vertex.z)
                    normals.push(normal.x, normal.y, normal.z)
                    patchTypes.push(0)
                    patchIds.push(patchId)
                    colorSeeds.push(0)
                    bridgeIds.push(bridgeIdx)
                    faceTypes.push(2) // Bottom face
                }

                const startIdx = vertexIndex
                indices.push(
                    startIdx, startIdx + 1, startIdx + 2,
                    startIdx + 3, startIdx + 4, startIdx + 5
                )
                
                vertexIndex += 6
                patchId++
            }
        }

        function createSideFace(v1: Vector3, v2: Vector3, v3: Vector3, v4: Vector3, 
                               bridgeId: number, patchId: number) {
            // Calculate face normal
            const edge1 = v2.clone().sub(v1)
            const edge2 = v4.clone().sub(v1)
            const normal = new Vector3().crossVectors(edge1, edge2).normalize()

            const patchVertices = [v1, v2, v4, v2, v3, v4]
            
            for (const vertex of patchVertices) {
                positions.push(vertex.x, vertex.y, vertex.z)
                normals.push(normal.x, normal.y, normal.z)
                patchTypes.push(0)
                patchIds.push(patchId)
                colorSeeds.push(0)
                bridgeIds.push(bridgeId)
                faceTypes.push(1) // Side face
            }

            const startIdx = vertexIndex
            indices.push(
                startIdx, startIdx + 1, startIdx + 2,
                startIdx + 3, startIdx + 4, startIdx + 5
            )
            
            vertexIndex += 6
        }

        function createEndFace(topRow: Vector3[], bottomRow: Vector3[], 
                              bridgeId: number, patchId: number, isStart: boolean) {
            // Create triangular fan for end face
            for (let j = 0; j < rowCount; j++) {
                const v1 = isStart ? topRow[j] : topRow[j + 1]
                const v2 = isStart ? topRow[j + 1] : topRow[j]
                const v3 = isStart ? bottomRow[j + 1] : bottomRow[j]
                const v4 = isStart ? bottomRow[j] : bottomRow[j + 1]

                // Calculate face normal
                const edge1 = v2.clone().sub(v1)
                const edge2 = v4.clone().sub(v1)
                const normal = new Vector3().crossVectors(edge1, edge2).normalize()

                const patchVertices = [v1, v2, v4, v2, v3, v4]
                
                for (const vertex of patchVertices) {
                    positions.push(vertex.x, vertex.y, vertex.z)
                    normals.push(normal.x, normal.y, normal.z)
                    patchTypes.push(0)
                    patchIds.push(patchId)
                    colorSeeds.push(0)
                    bridgeIds.push(bridgeId)
                    faceTypes.push(3) // End face
                }

                const startIdx = vertexIndex
                indices.push(
                    startIdx, startIdx + 1, startIdx + 2,
                    startIdx + 3, startIdx + 4, startIdx + 5
                )
                
                vertexIndex += 6
            }
        }
    })

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
    geometry.setAttribute('patchType', new BufferAttribute(new Float32Array(patchTypes), 1))
    geometry.setAttribute('patchId', new BufferAttribute(new Float32Array(patchIds), 1))
    geometry.setAttribute('colorSeed', new BufferAttribute(new Float32Array(colorSeeds), 1))
    geometry.setAttribute('bridgeId', new BufferAttribute(new Float32Array(bridgeIds), 1))
    geometry.setAttribute('faceType', new BufferAttribute(new Float32Array(faceTypes), 1))
    geometry.setIndex(indices)
    
    return geometry
}