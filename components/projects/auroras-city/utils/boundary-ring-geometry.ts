import { BufferGeometry, BufferAttribute, Vector3 } from 'three'

export interface BoundaryRingConfig {
  radius: number
  height: number
  thickness: number
  segments?: number
  gridDivisions?: number
}

export function createBoundaryRingGeometry(config: BoundaryRingConfig): BufferGeometry {
  const { radius, height, thickness, segments = 128, gridDivisions = 32 } = config
  
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  const faceTypes: number[] = [] // 0=top(bright), 1=bottom(dark)
  const gridIds: number[] = []   // Grid cell ID for shader effects
  const faceIds: number[] = []   // Face section ID
  
  let vertexIndex = 0
  let faceId = 0
  
  const innerRadius = radius - thickness / 2
  const outerRadius = radius + thickness / 2
  const topY = height
  const bottomY = 0
  
  // Helper function to create a face with consistent attributes
  function createFace(vertices: Vector3[], normal: Vector3, faceType: number, gridId: number, currentFaceId: number) {
    if (vertices.length === 4) {
      // Create two triangles for quad
      const triangles = [
        [vertices[0], vertices[1], vertices[2]],
        [vertices[0], vertices[2], vertices[3]]
      ]
      
      triangles.forEach(triangle => {
        triangle.forEach(vertex => {
          positions.push(vertex.x, vertex.y, vertex.z)
          normals.push(normal.x, normal.y, normal.z)
          faceTypes.push(faceType)
          gridIds.push(gridId)
          faceIds.push(currentFaceId)
        })
        
        indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2)
        vertexIndex += 3
      })
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
  const innerTopRing = createRingVertices(innerRadius, topY)
  const outerTopRing = createRingVertices(outerRadius, topY)
  const innerBottomRing = createRingVertices(innerRadius, bottomY)
  const outerBottomRing = createRingVertices(outerRadius, bottomY)
  
  // Calculate grid parameters
  const radialDivisions = Math.max(4, Math.floor(thickness / (height / gridDivisions)))
  
  // 1. Create TOP SURFACE (bright grid pattern)
  const radialStep = (outerRadius - innerRadius) / radialDivisions
  
  for (let r = 0; r < radialDivisions; r++) {
    const currentInnerRadius = innerRadius + r * radialStep
    const currentOuterRadius = innerRadius + (r + 1) * radialStep
    
    const currentInnerRing = createRingVertices(currentInnerRadius, topY)
    const currentOuterRing = createRingVertices(currentOuterRadius, topY)
    
    const angularStep = segments / gridDivisions
    
    for (let a = 0; a < gridDivisions; a++) {
      const startAngleIndex = Math.floor(a * angularStep)
      const endAngleIndex = Math.floor((a + 1) * angularStep)
      
      for (let i = startAngleIndex; i < endAngleIndex; i++) {
        const v1 = currentInnerRing[i]
        const v2 = currentOuterRing[i]
        const v3 = currentOuterRing[i + 1]
        const v4 = currentInnerRing[i + 1]
        
        const gridId = r * gridDivisions + a
        createFace([v1, v2, v3, v4], new Vector3(0, 1, 0), 0, gridId, faceId)
      }
    }
    faceId++
  }
  
  // 2. Create BOTTOM SURFACE (dark grid pattern)
  for (let r = 0; r < radialDivisions; r++) {
    const currentInnerRadius = innerRadius + r * radialStep
    const currentOuterRadius = innerRadius + (r + 1) * radialStep
    
    const currentInnerRing = createRingVertices(currentInnerRadius, bottomY)
    const currentOuterRing = createRingVertices(currentOuterRadius, bottomY)
    
    const angularStep = segments / gridDivisions
    
    for (let a = 0; a < gridDivisions; a++) {
      const startAngleIndex = Math.floor(a * angularStep)
      const endAngleIndex = Math.floor((a + 1) * angularStep)
      
      for (let i = startAngleIndex; i < endAngleIndex; i++) {
        const v1 = currentInnerRing[i + 1]
        const v2 = currentOuterRing[i + 1]
        const v3 = currentOuterRing[i]
        const v4 = currentInnerRing[i]
        
        const gridId = r * gridDivisions + a
        createFace([v1, v2, v3, v4], new Vector3(0, -1, 0), 1, gridId, faceId)
      }
    }
    faceId++
  }
  
  // 3. Create SIDE SURFACES (connecting top and bottom)
  
  // Outer edge
  for (let i = 0; i < segments; i++) {
    const v1 = outerTopRing[i]
    const v2 = outerBottomRing[i]
    const v3 = outerBottomRing[i + 1]
    const v4 = outerTopRing[i + 1]
    
    // Calculate outward normal
    const center = new Vector3(0, 0, 0)
    const surfaceCenter = v1.clone().add(v3).multiplyScalar(0.5)
    const normal = surfaceCenter.clone().sub(center).normalize()
    normal.y = 0
    
    const gridId = Math.floor(i / (segments / gridDivisions))
    createFace([v1, v2, v3, v4], normal, 1, gridId, faceId) // Dark like bottom
  }
  faceId++
  
  // Inner edge
  for (let i = 0; i < segments; i++) {
    const v1 = innerTopRing[i + 1]
    const v2 = innerBottomRing[i + 1]
    const v3 = innerBottomRing[i]
    const v4 = innerTopRing[i]
    
    // Calculate inward normal
    const center = new Vector3(0, 0, 0)
    const surfaceCenter = v1.clone().add(v3).multiplyScalar(0.5)
    const normal = center.clone().sub(surfaceCenter).normalize()
    normal.y = 0
    
    const gridId = Math.floor(i / (segments / gridDivisions))
    createFace([v1, v2, v3, v4], normal, 1, gridId, faceId) // Dark like bottom
  }
  faceId++
  
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('faceType', new BufferAttribute(new Float32Array(faceTypes), 1))
  geometry.setAttribute('gridId', new BufferAttribute(new Float32Array(gridIds), 1))
  geometry.setAttribute('faceId', new BufferAttribute(new Float32Array(faceIds), 1))
  geometry.setIndex(indices)
  
  return geometry
}