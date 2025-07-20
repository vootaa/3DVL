import { BufferGeometry, BufferAttribute, Vector3 } from 'three'

interface Polygon {
    vertices: Vector3[]
    center: Vector3
    type: number // 3=triangle, 4=quad, 5=pentagon
    id: number
}

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

    bridges.forEach((bridge, bridgeIdx) => {
        const from = bridge.from
        const to = bridge.to
        const length = from.distanceTo(to)
        const segmentCount = Math.max(4, Math.ceil(length / segmentLength))

        // Generate path points with arch
        const pathPoints: Vector3[] = []
        for (let i = 0; i <= segmentCount; i++) {
            const t = i / segmentCount
            const center = from.clone().lerp(to, t)
            center.y += archHeight * Math.sin(Math.PI * t)
            pathPoints.push(center)
        }

        // Create bridge cross-section outline points
        const topOutlines: Vector3[][] = []
        const bottomOutlines: Vector3[][] = []

        for (let i = 0; i <= segmentCount; i++) {
            const center = pathPoints[i]
            const dir = i < segmentCount ?
                pathPoints[i + 1].clone().sub(center).normalize() :
                center.clone().sub(pathPoints[i - 1]).normalize()

            const up = new Vector3(0, 1, 0)
            const side = new Vector3().crossVectors(dir, up).normalize()

            // Create top outline (bridge edges)
            const topOutline: Vector3[] = []
            const outlinePoints = 8 // More points for smoother outline
            for (let j = 0; j <= outlinePoints; j++) {
                const t = j / outlinePoints
                const offset = side.clone().multiplyScalar((t * 2 - 1) * width / 2)
                topOutline.push(center.clone().add(offset))
            }
            topOutlines.push(topOutline)

            // Create bottom outline
            const bottomOutline: Vector3[] = []
            for (let j = 0; j <= outlinePoints; j++) {
                const t = j / outlinePoints
                const offset = side.clone().multiplyScalar((t * 2 - 1) * width / 2)
                bottomOutline.push(center.clone().add(offset).add(new Vector3(0, -thickness, 0)))
            }
            bottomOutlines.push(bottomOutline)
        }

        // Generate irregular polygons for top surface
        const topPolygons = generateIrregularPolygons(topOutlines, segmentCount, width)

        // Create top surface with irregular polygons
        topPolygons.forEach((polygon, polyIdx) => {
            const patchType = polygon.type // Use polygon type as patch type
            const colorSeed = Math.random()

            // Calculate polygon normal
            const edge1 = polygon.vertices[1].clone().sub(polygon.vertices[0])
            const edge2 = polygon.vertices[2].clone().sub(polygon.vertices[0])
            const normal = new Vector3().crossVectors(edge1, edge2).normalize()

            // Triangulate polygon
            const triangles = triangulatePolygon(polygon.vertices)

            triangles.forEach(triangle => {
                for (const vertex of triangle) {
                    positions.push(vertex.x, vertex.y, vertex.z)
                    normals.push(normal.x, normal.y, normal.z)
                    patchTypes.push(patchType)
                    patchIds.push(patchId)
                    colorSeeds.push(colorSeed)
                    bridgeIds.push(bridgeIdx)
                    faceTypes.push(0) // Top face
                }

                // Add triangle indices
                indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2)
                vertexIndex += 3
            })

            patchId++
        })

        // Create continuous side faces (no segmentation)
        createContinuousSideFaces(topOutlines, bottomOutlines, bridgeIdx, patchId)

        // Create continuous bottom surface (no segmentation)
        createContinuousBottomSurface(bottomOutlines, bridgeIdx, patchId + 2)

        // Create end faces
        createEndFace(topOutlines[0], bottomOutlines[0], bridgeIdx, patchId + 4, true)
        createEndFace(topOutlines[segmentCount], bottomOutlines[segmentCount], bridgeIdx, patchId + 5, false)

        patchId += 6 // Reserve IDs for side, bottom, and end faces
        function generateIrregularPolygons(outlines: Vector3[][], segmentCount: number, width: number): Polygon[] {
            const polygons: Polygon[] = []

            for (let i = 0; i < segmentCount; i++) {
                const currentOutline = outlines[i]
                const nextOutline = outlines[i + 1]

                // Create irregular splits in each bridge segment
                const polygonCount = Math.floor(Math.random() * 2) + 2 // 2-3 polygons per segment

                // Create transverse split points
                const widthDivisions: number[] = [0] // Start point
                for (let p = 1; p < polygonCount; p++) {
                    // Add some randomness to split points
                    const baseT = p / polygonCount
                    const randomOffset = (Math.random() - 0.5) * 0.2 / polygonCount
                    widthDivisions.push(Math.max(0.05, Math.min(0.95, baseT + randomOffset)))
                }
                widthDivisions.push(1) // End point
                widthDivisions.sort()

                // Create polygons for each width interval
                for (let w = 0; w < widthDivisions.length - 1; w++) {
                    const leftT = widthDivisions[w]
                    const rightT = widthDivisions[w + 1]

                    // Create irregular length splits between current and next segment
                    const lengthDivisions: number[] = [0]
                    const lengthSegments = Math.floor(Math.random() * 2) + 1 // 1-2 segments in length
                    for (let l = 1; l < lengthSegments; l++) {
                        const baseT = l / lengthSegments
                        const randomOffset = (Math.random() - 0.5) * 0.3 / lengthSegments
                        lengthDivisions.push(Math.max(0.1, Math.min(0.9, baseT + randomOffset)))
                    }
                    lengthDivisions.push(1)
                    lengthDivisions.sort()

                    // Create polygons for each length interval
                    for (let l = 0; l < lengthDivisions.length - 1; l++) {
                        const startLengthT = lengthDivisions[l]
                        const endLengthT = lengthDivisions[l + 1]

                        // Create four corners of the quad
                        const vertices: Vector3[] = []

                        // Calculate positions of the four corners
                        const corners = [
                            [startLengthT, leftT],   // left front
                            [endLengthT, leftT],     // left back
                            [endLengthT, rightT],    // right back
                            [startLengthT, rightT]   // right front
                        ]

                        corners.forEach(([lengthT, widthT]) => {
                            // Interpolate between current and next outline
                            const frontPos = interpolateAlongOutline(currentOutline, widthT)
                            const backPos = interpolateAlongOutline(nextOutline, widthT)
                            const vertex = frontPos.clone().lerp(backPos, lengthT)

                            // Add slight height variation for irregularity
                            const heightVariation = (Math.random() - 0.5) * 0.05
                            vertex.y += heightVariation

                            vertices.push(vertex)
                        })

                        // Randomly decide whether to convert quad to triangle or pentagon
                        const polygonType = Math.random()
                        if (polygonType < 0.3 && vertices.length === 4) {
                            // Convert to triangle (remove one vertex)
                            const removeIndex = Math.floor(Math.random() * 4)
                            vertices.splice(removeIndex, 1)
                        } else if (polygonType > 0.7 && vertices.length === 4) {
                            // Convert to pentagon (add a vertex on one edge)
                            const edgeIndex = Math.floor(Math.random() * 4)
                            const nextIndex = (edgeIndex + 1) % 4
                            const midPoint = vertices[edgeIndex].clone().lerp(vertices[nextIndex], 0.5)

                            // Offset inward to create pentagon
                            const center = vertices.reduce((sum, v) => sum.add(v), new Vector3()).divideScalar(4)
                            const toCenter = center.clone().sub(midPoint).normalize()
                            midPoint.add(toCenter.multiplyScalar(width * 0.1))

                            vertices.splice(nextIndex, 0, midPoint)
                        }

                        const center = vertices.reduce((sum, v) => sum.add(v), new Vector3()).divideScalar(vertices.length)

                        polygons.push({
                            vertices,
                            center,
                            type: vertices.length,
                            id: polygons.length
                        })
                    }
                }
            }

            return polygons
        }

        // Helper function: interpolate along outline
        function interpolateAlongOutline(outline: Vector3[], t: number): Vector3 {
            if (t <= 0) return outline[0].clone()
            if (t >= 1) return outline[outline.length - 1].clone()

            const scaledT = t * (outline.length - 1)
            const index = Math.floor(scaledT)
            const localT = scaledT - index

            if (index >= outline.length - 1) {
                return outline[outline.length - 1].clone()
            }

            return outline[index].clone().lerp(outline[index + 1], localT)
        }

        function triangulatePolygon(vertices: Vector3[]): Vector3[][] {
            const triangles: Vector3[][] = []

            // Simple fan triangulation from first vertex
            for (let i = 1; i < vertices.length - 1; i++) {
                triangles.push([vertices[0], vertices[i], vertices[i + 1]])
            }

            return triangles
        }

        function createContinuousSideFaces(topOutlines: Vector3[][], bottomOutlines: Vector3[][], bridgeId: number, basePatchId: number) {
            // Left side - continuous surface
            for (let i = 0; i < topOutlines.length - 1; i++) {
                const v1 = topOutlines[i][0]
                const v2 = topOutlines[i + 1][0]
                const v3 = bottomOutlines[i + 1][0]
                const v4 = bottomOutlines[i][0]

                createQuadFace([v1, v2, v3, v4], bridgeId, basePatchId, 1) // Side face
            }

            // Right side - continuous surface
            const rightIdx = topOutlines[0].length - 1
            for (let i = 0; i < topOutlines.length - 1; i++) {
                const v1 = topOutlines[i + 1][rightIdx]
                const v2 = topOutlines[i][rightIdx]
                const v3 = bottomOutlines[i][rightIdx]
                const v4 = bottomOutlines[i + 1][rightIdx]

                createQuadFace([v1, v2, v3, v4], bridgeId, basePatchId + 1, 1) // Side face
            }
        }

        function createContinuousBottomSurface(bottomOutlines: Vector3[][], bridgeId: number, basePatchId: number) {
            for (let i = 0; i < bottomOutlines.length - 1; i++) {
                for (let j = 0; j < bottomOutlines[i].length - 1; j++) {
                    const v1 = bottomOutlines[i][j]
                    const v2 = bottomOutlines[i][j + 1]
                    const v3 = bottomOutlines[i + 1][j + 1]
                    const v4 = bottomOutlines[i + 1][j]

                    createQuadFace([v1, v2, v3, v4], bridgeId, basePatchId, 2) // Bottom face
                }
            }
        }

        function createQuadFace(vertices: Vector3[], bridgeId: number, patchId: number, faceType: number) {
            // Calculate face normal
            const edge1 = vertices[1].clone().sub(vertices[0])
            const edge2 = vertices[3].clone().sub(vertices[0])
            const normal = new Vector3().crossVectors(edge1, edge2).normalize()

            // Create two triangles
            const triangles = [
                [vertices[0], vertices[1], vertices[3]],
                [vertices[1], vertices[2], vertices[3]]
            ]

            triangles.forEach(triangle => {
                for (const vertex of triangle) {
                    positions.push(vertex.x, vertex.y, vertex.z)
                    normals.push(normal.x, normal.y, normal.z)
                    patchTypes.push(0)
                    patchIds.push(patchId)
                    colorSeeds.push(0)
                    bridgeIds.push(bridgeId)
                    faceTypes.push(faceType)
                }

                indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2)
                vertexIndex += 3
            })
        }

        function createEndFace(topOutline: Vector3[], bottomOutline: Vector3[],
            bridgeId: number, patchId: number, isStart: boolean) {
            // Create end face by connecting top and bottom outlines
            for (let j = 0; j < topOutline.length - 1; j++) {
                const v1 = isStart ? topOutline[j] : topOutline[j + 1]
                const v2 = isStart ? topOutline[j + 1] : topOutline[j]
                const v3 = isStart ? bottomOutline[j + 1] : bottomOutline[j]
                const v4 = isStart ? bottomOutline[j] : bottomOutline[j + 1]

                createQuadFace([v1, v2, v3, v4], bridgeId, patchId, 3) // End face
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