import { BufferGeometry, BufferAttribute, Vector3 } from 'three'

export interface ConcentricBaseConfig {
  radii: [number, number, number] // [inner, middle, outer radius]
  sinkDepth: number
  outerHeight: number
  segments?: number
}

export function createConcentricBase(config: ConcentricBaseConfig): BufferGeometry {
  const { radii, sinkDepth, outerHeight, segments = 32 } = config
  
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  const faceTypes: number[] = [] // 0=top, 1=side, 2=bottom
  const faceIds: number[] = []   // unique ID for each face section
  
  let vertexIndex = 0
  let faceId = 0
  
  const [innerRadius, middleRadius, outerRadius] = radii
  
  // Calculate Y positions for each layer
  const baseY = 0
  const outerTop = baseY + outerHeight
  const middleTop = outerTop - sinkDepth
  const innerTop = middleTop - sinkDepth
  
  // Helper function to create a face with consistent attributes
  function createFace(vertices: Vector3[], normal: Vector3, faceType: number, currentFaceId: number) {
    // For quads, create two triangles
    if (vertices.length === 4) {
      const triangles = [
        [vertices[0], vertices[1], vertices[2]],
        [vertices[0], vertices[2], vertices[3]]
      ]
      
      triangles.forEach(triangle => {
        triangle.forEach(vertex => {
          positions.push(vertex.x, vertex.y, vertex.z)
          normals.push(normal.x, normal.y, normal.z)
          faceTypes.push(faceType)
          faceIds.push(currentFaceId)
        })
        
        indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2)
        vertexIndex += 3
      })
    } else if (vertices.length === 3) {
      // Triangle
      vertices.forEach(vertex => {
        positions.push(vertex.x, vertex.y, vertex.z)
        normals.push(normal.x, normal.y, normal.z)
        faceTypes.push(faceType)
        faceIds.push(currentFaceId)
      })
      
      indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2)
      vertexIndex += 3
    }
  }
  
  // Create ring vertices
  const createRingVertices = (radius: number, y: number) => {
    const vertices: Vector3[] = []
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      vertices.push(new Vector3(x, y, z))
    }
    return vertices
  }
  
  // Generate ring vertices
  const outerTopRing = createRingVertices(outerRadius, outerTop)
  const outerBottomRing = createRingVertices(outerRadius, baseY)
  const middleOuterTopRing = createRingVertices(middleRadius, outerTop)
  const middleTopRing = createRingVertices(middleRadius, middleTop)
  const innerMiddleTopRing = createRingVertices(innerRadius, middleTop)
  const innerTopRing = createRingVertices(innerRadius, innerTop)
  
  // 1. Create TOP SURFACES (as continuous surfaces)
  
  // Outer ring top surface (middle to outer radius)
  for (let i = 0; i < segments; i++) {
    const v1 = middleOuterTopRing[i]
    const v2 = outerTopRing[i]
    const v3 = outerTopRing[i + 1]
    const v4 = middleOuterTopRing[i + 1]
    
    createFace([v1, v2, v3, v4], new Vector3(0, 1, 0), 0, faceId)
  }
  faceId++
  
  // Middle ring top surface (inner to middle radius)
  for (let i = 0; i < segments; i++) {
    const v1 = innerMiddleTopRing[i]
    const v2 = middleTopRing[i]
    const v3 = middleTopRing[i + 1]
    const v4 = innerMiddleTopRing[i + 1]
    
    createFace([v1, v2, v3, v4], new Vector3(0, 1, 0), 0, faceId)
  }
  faceId++
  
  // Inner circular top surface
  const innerCenter = new Vector3(0, innerTop, 0)
  for (let i = 0; i < segments; i++) {
    const v1 = innerCenter
    const v2 = innerTopRing[i]
    const v3 = innerTopRing[i + 1]
    
    createFace([v1, v2, v3], new Vector3(0, 1, 0), 0, faceId)
  }
  faceId++
  
  // 2. Create SIDE SURFACES (as continuous surfaces)
  
  // Outer cylinder side
  for (let i = 0; i < segments; i++) {
    const v1 = outerTopRing[i]
    const v2 = outerBottomRing[i]
    const v3 = outerBottomRing[i + 1]
    const v4 = outerTopRing[i + 1]
    
    // Calculate outward normal
    const center = new Vector3(0, 0, 0)
    const surfaceCenter = v1.clone().add(v3).multiplyScalar(0.5)
    const normal = surfaceCenter.clone().sub(center).normalize()
    normal.y = 0 // Keep horizontal
    
    createFace([v1, v2, v3, v4], normal, 1, faceId)
  }
  faceId++
  
  // Middle step outer side (vertical drop from outer top to middle top)
  for (let i = 0; i < segments; i++) {
    const v1 = middleOuterTopRing[i]
    const v2 = middleTopRing[i]
    const v3 = middleTopRing[i + 1]
    const v4 = middleOuterTopRing[i + 1]
    
    const center = new Vector3(0, 0, 0)
    const surfaceCenter = v1.clone().add(v3).multiplyScalar(0.5)
    const normal = surfaceCenter.clone().sub(center).normalize()
    normal.y = 0
    
    createFace([v1, v2, v3, v4], normal, 1, faceId)
  }
  faceId++
  
  // Inner step outer side (vertical drop from middle top to inner top)
  for (let i = 0; i < segments; i++) {
    const v1 = innerMiddleTopRing[i]
    const v2 = innerTopRing[i]
    const v3 = innerTopRing[i + 1]
    const v4 = innerMiddleTopRing[i + 1]
    
    const center = new Vector3(0, 0, 0)
    const surfaceCenter = v1.clone().add(v3).multiplyScalar(0.5)
    const normal = surfaceCenter.clone().sub(center).normalize()
    normal.y = 0
    
    createFace([v1, v2, v3, v4], normal, 1, faceId)
  }
  faceId++
  
  // 3. Create BOTTOM SURFACE (as one continuous surface)
  
  // Outer bottom circular surface
  const bottomCenter = new Vector3(0, baseY, 0)
  for (let i = 0; i < segments; i++) {
    const v1 = bottomCenter
    const v2 = outerBottomRing[i + 1] // Reverse order for bottom face
    const v3 = outerBottomRing[i]
    
    createFace([v1, v2, v3], new Vector3(0, -1, 0), 2, faceId)
  }
  faceId++
  
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('faceType', new BufferAttribute(new Float32Array(faceTypes), 1))
  geometry.setAttribute('faceId', new BufferAttribute(new Float32Array(faceIds), 1))
  geometry.setIndex(indices)
  
  return geometry
}