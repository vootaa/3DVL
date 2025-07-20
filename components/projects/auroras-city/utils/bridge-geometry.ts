import { BufferGeometry, BufferAttribute, Vector3 } from 'three'

interface BridgePatch {
    top: Vector3[]
    bottom: Vector3[]
    patchType: number
    patchId: number
    colorSeed: number
    bridgeId: number
}

function createPatch(
    from: Vector3,
    to: Vector3,
    width: number,
    archHeight: number,
    thickness: number,
    t0: number,
    t1: number,
    patchType: number,
    patchId: number,
    bridgeId: number
): BridgePatch {
    const dir = to.clone().sub(from).normalize()
    const up = new Vector3(0, 1, 0)
    const side = new Vector3().crossVectors(dir, up).normalize().multiplyScalar(width / 2)
    const top: Vector3[] = []
    const bottom: Vector3[] = []
    for (let i = 0; i < patchType; i++) {
        const theta = (i / patchType) * Math.PI
        const tt = t0 * (1 - theta / Math.PI) + t1 * (theta / Math.PI)
        const center = from.clone().lerp(to, tt)
        center.y += archHeight * Math.sin(Math.PI * tt)
        const offset = side.clone().multiplyScalar(Math.cos(theta))
        const posTop = center.clone().add(offset)
        const posBottom = posTop.clone().add(new Vector3(0, -thickness, 0))
        top.push(posTop)
        bottom.push(posBottom)
    }
    return {
        top,
        bottom,
        patchType,
        patchId,
        colorSeed: Math.random(),
        bridgeId
    }
}

export function createAllIrregularBridgesGeometry(
    bridges: Array<{ from: Vector3, to: Vector3 }>,
    width: number,
    archHeight: number,
    thickness: number,
    minEdge: number = 0.5,
    maxEdge: number = 1.2
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
        let t = 0
        while (t < 1.0) {
            const patchType = 3 + Math.floor(Math.random() * 4)
            const edgeLen = minEdge + Math.random() * (maxEdge - minEdge)
            const dt = Math.min(edgeLen / length, 1.0 - t)
            const t1 = t + dt
            const patch = createPatch(
                from, to, width, archHeight, thickness,
                t, t1, patchType, patchId, bridgeIdx
            )

            for (let v of patch.top) {
                positions.push(v.x, v.y, v.z)
                patchTypes.push(patch.patchType)
                patchIds.push(patch.patchId)
                colorSeeds.push(patch.colorSeed)
                bridgeIds.push(patch.bridgeId)
            }
            for (let v of patch.bottom) {
                positions.push(v.x, v.y, v.z)
                patchTypes.push(patch.patchType)
                patchIds.push(patch.patchId)
                colorSeeds.push(patch.colorSeed)
                bridgeIds.push(patch.bridgeId)
            }
            for (let i = 1; i < patchType - 1; i++) {
                indices.push(vertexOffset, vertexOffset + i, vertexOffset + i + 1)
            }
            for (let i = 1; i < patchType - 1; i++) {
                indices.push(
                    vertexOffset + patchType,
                    vertexOffset + patchType + i + 1,
                    vertexOffset + patchType + i
                )
            }
            for (let i = 0; i < patchType; i++) {
                const next = (i + 1) % patchType
                const a = vertexOffset + i
                const b = vertexOffset + next
                const c = vertexOffset + patchType + next
                const d = vertexOffset + patchType + i
                indices.push(a, b, c)
                indices.push(a, c, d)
            }
            vertexOffset += patchType * 2
            patchId++
            t = t1
        }
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