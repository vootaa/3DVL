import { BufferGeometry, BufferAttribute, Vector3 } from 'three'

export function createAllIrregularBridgesGeometry(
    bridges: Array<{ from: Vector3, to: Vector3 }>,
    width: number,
    archHeight: number,
    patchCount: number = 18
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
        let t = 0
        const from = bridge.from
        const to = bridge.to
        const dir = to.clone().sub(from).normalize()
        const up = new Vector3(0, 1, 0)
        const side = new Vector3().crossVectors(dir, up).normalize().multiplyScalar(width / 2)

        while (t < 1.0) {
            const patchType = 3 + Math.floor(Math.random() * 4) // 3~6 sided polygon
            const nextT = Math.min(t + (1 / patchCount) * (0.7 + Math.random() * 0.6), 1.0)
            const colorSeed = Math.random()
            for (let i = 0; i < patchType; i++) {
                const theta = (i / patchType) * Math.PI
                const tt = t * (1 - theta / Math.PI) + nextT * (theta / Math.PI)
                const center = from.clone().lerp(to, tt)
                center.y += archHeight * Math.sin(Math.PI * tt)
                const offset = side.clone().multiplyScalar(Math.cos(theta))
                const pos = center.clone().add(offset)
                positions.push(pos.x, pos.y, pos.z)
                patchTypes.push(patchType)
                patchIds.push(patchId)
                colorSeeds.push(colorSeed)
                bridgeIds.push(bridgeIdx)
            }
            for (let i = 1; i < patchType - 1; i++) {
                indices.push(vertexOffset, vertexOffset + i, vertexOffset + i + 1)
            }
            vertexOffset += patchType
            patchId++
            t = nextT
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