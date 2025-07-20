import { BufferGeometry, BufferAttribute, Vector3 } from 'three'

export interface OrbitalRingsConfig {
  rings: {
    inner: { radius: number; width: number }
    middle: { radius: number; width: number }
    outer: { radius: number; width: number }
  }
  height: number
  thickness: number
  segments?: number
}

export function createOrbitalRingsGeometry(config: OrbitalRingsConfig): BufferGeometry {
  const { rings, height, thickness, segments = 64 } = config
  
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  const faceTypes: number[] = [] // 0=top, 1=side, 2=bottom
  const ringIds: number[] = []   // 0=inner, 1=middle, 2=outer
  const faceIds: number[] = []   // unique ID for each face section
  
  let vertexIndex = 0
  let faceId = 0
  
  // Calculate ring boundaries
  const ringData = [
    {
      innerRadius: rings.inner.radius - rings.inner.width / 2,
      outerRadius: rings.inner.radius + rings.inner.width / 2,
      ringId: 0
    },
    {
      innerRadius: rings.middle.radius - rings.middle.width / 2,
      outerRadius: rings.middle.radius + rings.middle.width / 2,
      ringId: 1
    },
    {
      innerRadius: rings.outer.radius - rings.outer.width / 2,
      outerRadius: rings.outer.radius + rings.outer.width / 2,
      ringId: 2
    }
  ]
  
  const topY = height + thickness / 2
  const bottomY = height - thickness / 2
  
  // Helper function to create a face with consistent attributes
  function createFace(vertices: Vector3[], normal: Vector3, faceType: number, ringId: number, currentFaceId: number) {
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
          ringIds.push(ringId)
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
        ringIds.push(ringId)
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
  
  // Generate all ring vertices
  const topInnerRings: Vector3[][] = []
  const topOuterRings: Vector3[][] = []
  const bottomInnerRings: Vector3[][] = []
  const bottomOuterRings: Vector3[][] = []
  
  ringData.forEach((ring) => {
    topInnerRings.push(createRingVertices(ring.innerRadius, topY))
    topOuterRings.push(createRingVertices(ring.outerRadius, topY))
    bottomInnerRings.push(createRingVertices(ring.innerRadius, bottomY))
    bottomOuterRings.push(createRingVertices(ring.outerRadius, bottomY))
  })
  
  // 1. Create TOP SURFACES for each ring
  ringData.forEach((ring, ringIndex) => {
    const topInner = topInnerRings[ringIndex]
    const topOuter = topOuterRings[ringIndex]
    
    for (let i = 0; i < segments; i++) {
      const v1 = topInner[i]
      const v2 = topOuter[i]
      const v3 = topOuter[i + 1]
      const v4 = topInner[i + 1]
      
      createFace([v1, v2, v3, v4], new Vector3(0, 1, 0), 0, ring.ringId, faceId)
    }
    faceId++
  })
  
  // 2. Create SIDE SURFACES for each ring
  ringData.forEach((ring, ringIndex) => {
    const topInner = topInnerRings[ringIndex]
    const topOuter = topOuterRings[ringIndex]
    const bottomInner = bottomInnerRings[ringIndex]
    const bottomOuter = bottomOuterRings[ringIndex]
    
    // Outer side wall
    for (let i = 0; i < segments; i++) {
      const v1 = topOuter[i]
      const v2 = bottomOuter[i]
      const v3 = bottomOuter[i + 1]
      const v4 = topOuter[i + 1]
      
      // Calculate outward normal
      const center = new Vector3(0, 0, 0)
      const surfaceCenter = v1.clone().add(v3).multiplyScalar(0.5)
      const normal = surfaceCenter.clone().sub(center).normalize()
      normal.y = 0 // Keep horizontal
      
      createFace([v1, v2, v3, v4], normal, 1, ring.ringId, faceId)
    }
    faceId++
    
    // Inner side wall
    for (let i = 0; i < segments; i++) {
      const v1 = topInner[i + 1]
      const v2 = bottomInner[i + 1]
      const v3 = bottomInner[i]
      const v4 = topInner[i]
      
      // Calculate inward normal
      const center = new Vector3(0, 0, 0)
      const surfaceCenter = v1.clone().add(v3).multiplyScalar(0.5)
      const normal = center.clone().sub(surfaceCenter).normalize()
      normal.y = 0 // Keep horizontal
      
      createFace([v1, v2, v3, v4], normal, 1, ring.ringId, faceId)
    }
    faceId++
  })
  
  // 3. Create BOTTOM SURFACES for each ring
  ringData.forEach((ring, ringIndex) => {
    const bottomInner = bottomInnerRings[ringIndex]
    const bottomOuter = bottomOuterRings[ringIndex]
    
    for (let i = 0; i < segments; i++) {
      const v1 = bottomInner[i + 1]
      const v2 = bottomOuter[i + 1]
      const v3 = bottomOuter[i]
      const v4 = bottomInner[i]
      
      createFace([v1, v2, v3, v4], new Vector3(0, -1, 0), 2, ring.ringId, faceId)
    }
    faceId++
  })
  
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('faceType', new BufferAttribute(new Float32Array(faceTypes), 1))
  geometry.setAttribute('ringId', new BufferAttribute(new Float32Array(ringIds), 1))
  geometry.setAttribute('faceId', new BufferAttribute(new Float32Array(faceIds), 1))
  geometry.setIndex(indices)
  
  return geometry
}