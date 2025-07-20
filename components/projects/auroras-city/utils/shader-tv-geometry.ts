import { BufferGeometry, BufferAttribute, Vector3 } from 'three'

export interface ShaderTVConfig {
  tv: {
    positions: Array<{ x: number, z: number }>
    screenSize: number
    baseWidth: number
    baseHeight: number
  }
}

export const ComponentType = {
  SCREEN: 0,
  BASE: 1
} as const

export function createShaderTVGeometry(config: ShaderTVConfig): BufferGeometry {
  const { tv } = config
  
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  const uvs: number[] = []
  const componentIds: number[] = []
  const tvIds: number[] = []
  
  let vertexIndex = 0
  
  function createQuad(
    v1: Vector3, v2: Vector3, v3: Vector3, v4: Vector3,
    normal: Vector3, componentId: number, tvId: number,
    uv1: [number, number] = [0, 0], uv2: [number, number] = [1, 0],
    uv3: [number, number] = [1, 1], uv4: [number, number] = [0, 1]
  ) {
    const vertices = [v1, v2, v3, v4]
    const uvCoords = [uv1, uv2, uv3, uv4]
    
    vertices.forEach((v, i) => {
      positions.push(v.x, v.y, v.z)
      normals.push(normal.x, normal.y, normal.z)
      uvs.push(uvCoords[i][0], uvCoords[i][1])
      componentIds.push(componentId)
      tvIds.push(tvId)
    })
    
    indices.push(
      vertexIndex, vertexIndex + 1, vertexIndex + 2,
      vertexIndex, vertexIndex + 2, vertexIndex + 3
    )
    vertexIndex += 4
  }
  
  tv.positions.forEach((pos, tvIndex) => {
    const centerX = pos.x
    const centerZ = pos.z
    
    const screenSize = tv.screenSize
    const baseWidth = tv.baseWidth
    const baseHeight = tv.baseHeight
    const screenThickness = 0.02
    
    const screenHalf = screenSize / 2
    const baseHalfLength = screenSize / 2
    const baseHalfWidth = baseWidth / 2
    
    // 1. Create the screen (vertical square, very thin)
    const screenBottom = baseHeight
    const screenTop = baseHeight + screenSize
    const screenOffset = screenThickness / 2

    // Screen
    createQuad(
      new Vector3(centerX - screenHalf, screenTop, centerZ + screenOffset),
      new Vector3(centerX + screenHalf, screenTop, centerZ + screenOffset),
      new Vector3(centerX + screenHalf, screenBottom, centerZ + screenOffset),
      new Vector3(centerX - screenHalf, screenBottom, centerZ + screenOffset),
      new Vector3(0, 0, 1),
      ComponentType.SCREEN,
      tvIndex
    )

    // 2. Create the rectangular base
    // Base top
    createQuad(
      new Vector3(centerX - baseHalfLength, baseHeight, centerZ - baseHalfWidth),
      new Vector3(centerX + baseHalfLength, baseHeight, centerZ - baseHalfWidth),
      new Vector3(centerX + baseHalfLength, baseHeight, centerZ + baseHalfWidth),
      new Vector3(centerX - baseHalfLength, baseHeight, centerZ + baseHalfWidth),
      new Vector3(0, 1, 0),
      ComponentType.BASE,
      tvIndex
    )

    // Base bottom
    createQuad(
      new Vector3(centerX - baseHalfLength, 0, centerZ + baseHalfWidth),
      new Vector3(centerX + baseHalfLength, 0, centerZ + baseHalfWidth),
      new Vector3(centerX + baseHalfLength, 0, centerZ - baseHalfWidth),
      new Vector3(centerX - baseHalfLength, 0, centerZ - baseHalfWidth),
      new Vector3(0, -1, 0),
      ComponentType.BASE,
      tvIndex
    )

    // Base front
    createQuad(
      new Vector3(centerX - baseHalfLength, 0, centerZ + baseHalfWidth),
      new Vector3(centerX - baseHalfLength, baseHeight, centerZ + baseHalfWidth),
      new Vector3(centerX + baseHalfLength, baseHeight, centerZ + baseHalfWidth),
      new Vector3(centerX + baseHalfLength, 0, centerZ + baseHalfWidth),
      new Vector3(0, 0, 1),
      ComponentType.BASE,
      tvIndex
    )

    // Base back
    createQuad(
      new Vector3(centerX + baseHalfLength, 0, centerZ - baseHalfWidth),
      new Vector3(centerX + baseHalfLength, baseHeight, centerZ - baseHalfWidth),
      new Vector3(centerX - baseHalfLength, baseHeight, centerZ - baseHalfWidth),
      new Vector3(centerX - baseHalfLength, 0, centerZ - baseHalfWidth),
      new Vector3(0, 0, -1),
      ComponentType.BASE,
      tvIndex
    )

    // Base left side
    createQuad(
      new Vector3(centerX - baseHalfLength, 0, centerZ - baseHalfWidth),
      new Vector3(centerX - baseHalfLength, baseHeight, centerZ - baseHalfWidth),
      new Vector3(centerX - baseHalfLength, baseHeight, centerZ + baseHalfWidth),
      new Vector3(centerX - baseHalfLength, 0, centerZ + baseHalfWidth),
      new Vector3(-1, 0, 0),
      ComponentType.BASE,
      tvIndex
    )

    // Base right side
    createQuad(
      new Vector3(centerX + baseHalfLength, 0, centerZ + baseHalfWidth),
      new Vector3(centerX + baseHalfLength, baseHeight, centerZ + baseHalfWidth),
      new Vector3(centerX + baseHalfLength, baseHeight, centerZ - baseHalfWidth),
      new Vector3(centerX + baseHalfLength, 0, centerZ - baseHalfWidth),
      new Vector3(1, 0, 0),
      ComponentType.BASE,
      tvIndex
    )
  })
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
  geometry.setAttribute('componentId', new BufferAttribute(new Float32Array(componentIds), 1))
  geometry.setAttribute('tvId', new BufferAttribute(new Float32Array(tvIds), 1))
  geometry.setIndex(indices)
  
  return geometry
}