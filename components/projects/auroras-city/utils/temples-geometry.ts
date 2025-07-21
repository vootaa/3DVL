import { BufferGeometry, BufferAttribute, Vector3 } from 'three'

export interface TemplesConfig {
  temples: {
    positions: Array<{ x: number, z: number }>
    height: number
    baseSize: number
  }
}

interface TempleStructure {
  // Pentagon base (large/short)
  baseRadius: number
  baseHeight: number
  // Decagon pillar (thin/tall)
  pillarRadius: number
  pillarHeight: number
  // Hexadecagon top plate (medium/short)
  plateRadius: number
  plateHeight: number
  // Cone cap (medium/medium)
  coneRadius: number
  coneHeight: number
}

export function createTemplesGeometry(config: TemplesConfig): BufferGeometry {
  const { temples } = config
  
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  const faceTypes: number[] = [] // 0=top, 1=side, 2=bottom
  const templeIds: number[] = []  // ID of each temple
  const componentIds: number[] = [] // 0=base, 1=pillar, 2=plate, 3=cone
  const faceIds: number[] = []    // unique ID for each face section
  
  let vertexIndex = 0
  let faceId = 0
  
  // Define temple structure proportions
  const structure: TempleStructure = {
    baseRadius: temples.baseSize * 1.2,     // Pentagon base
    baseHeight: temples.height * 0.25,
    pillarRadius: temples.baseSize * 0.5,   // Decagon pillar
    pillarHeight: temples.height * 0.3,
    plateRadius: temples.baseSize * 0.75,    // Hexadecagon plate
    plateHeight: temples.height * 0.08,
    coneRadius: temples.baseSize * 0.6,     // Cone cap
    coneHeight: temples.height * 0.35
  }
  
  // Helper function to create a face with consistent attributes
  function createFace(vertices: Vector3[], normal: Vector3, faceType: number, 
                     templeId: number, componentId: number, currentFaceId: number) {
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
          templeIds.push(templeId)
          componentIds.push(componentId)
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
        templeIds.push(templeId)
        componentIds.push(componentId)
        faceIds.push(currentFaceId)
      })
      
      indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2)
      vertexIndex += 3
    }
  }
  
  // Create polygon vertices
  const createPolygonVertices = (sides: number, radius: number, y: number, centerX: number, centerZ: number) => {
    const vertices: Vector3[] = []
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2
      const x = centerX + Math.cos(angle) * radius
      const z = centerZ + Math.sin(angle) * radius
      vertices.push(new Vector3(x, y, z))
    }
    return vertices
  }
  
  // Create each temple
  temples.positions.forEach((pos, templeIndex) => {
    const centerX = pos.x
    const centerZ = pos.z
    
    // Calculate Y positions for each component
    const baseY = 0
    const baseTop = baseY + structure.baseHeight
    const pillarTop = baseTop + structure.pillarHeight
    const plateTop = pillarTop + structure.plateHeight
    const coneTop = plateTop + structure.coneHeight
    
    // 1. PENTAGON BASE (5 sides)
    const baseBottomVertices = createPolygonVertices(5, structure.baseRadius, baseY, centerX, centerZ)
    const baseTopVertices = createPolygonVertices(5, structure.baseRadius, baseTop, centerX, centerZ)
    
    // Base top surface
    const baseCenter = new Vector3(centerX, baseTop, centerZ)
    for (let i = 0; i < 5; i++) {
      createFace([baseCenter, baseTopVertices[i], baseTopVertices[i + 1]], 
                new Vector3(0, 1, 0), 0, templeIndex, 0, faceId)
    }
    faceId++
    
    // Base side surfaces
    for (let i = 0; i < 5; i++) {
      const v1 = baseTopVertices[i]
      const v2 = baseBottomVertices[i]
      const v3 = baseBottomVertices[i + 1]
      const v4 = baseTopVertices[i + 1]
      
      const center = new Vector3(centerX, 0, centerZ)
      const surfaceCenter = v1.clone().add(v3).multiplyScalar(0.5)
      const normal = surfaceCenter.clone().sub(center).normalize()
      normal.y = 0
      
      createFace([v1, v2, v3, v4], normal, 1, templeIndex, 0, faceId)
    }
    faceId++
    
    // Base bottom surface
    const baseBottomCenter = new Vector3(centerX, baseY, centerZ)
    for (let i = 0; i < 5; i++) {
      createFace([baseBottomCenter, baseBottomVertices[i + 1], baseBottomVertices[i]], 
                new Vector3(0, -1, 0), 2, templeIndex, 0, faceId)
    }
    faceId++
    
    // 2. DECAGON PILLAR (10 sides)
    const pillarBottomVertices = createPolygonVertices(10, structure.pillarRadius, baseTop, centerX, centerZ)
    const pillarTopVertices = createPolygonVertices(10, structure.pillarRadius, pillarTop, centerX, centerZ)
    
    // Pillar top surface
    const pillarCenter = new Vector3(centerX, pillarTop, centerZ)
    for (let i = 0; i < 10; i++) {
      createFace([pillarCenter, pillarTopVertices[i], pillarTopVertices[i + 1]], 
                new Vector3(0, 1, 0), 0, templeIndex, 1, faceId)
    }
    faceId++
    
    // Pillar side surfaces
    for (let i = 0; i < 10; i++) {
      const v1 = pillarTopVertices[i]
      const v2 = pillarBottomVertices[i]
      const v3 = pillarBottomVertices[i + 1]
      const v4 = pillarTopVertices[i + 1]
      
      const center = new Vector3(centerX, 0, centerZ)
      const surfaceCenter = v1.clone().add(v3).multiplyScalar(0.5)
      const normal = surfaceCenter.clone().sub(center).normalize()
      normal.y = 0
      
      createFace([v1, v2, v3, v4], normal, 1, templeIndex, 1, faceId)
    }
    faceId++
    
    // 3. HEXADECAGON PLATE (16 sides)
    const plateBottomVertices = createPolygonVertices(16, structure.plateRadius, pillarTop, centerX, centerZ)
    const plateTopVertices = createPolygonVertices(16, structure.plateRadius, plateTop, centerX, centerZ)
    
    // Plate top surface
    const plateCenter = new Vector3(centerX, plateTop, centerZ)
    for (let i = 0; i < 16; i++) {
      createFace([plateCenter, plateTopVertices[i], plateTopVertices[i + 1]], 
                new Vector3(0, 1, 0), 0, templeIndex, 2, faceId)
    }
    faceId++
    
    // Plate side surfaces
    for (let i = 0; i < 16; i++) {
      const v1 = plateTopVertices[i]
      const v2 = plateBottomVertices[i]
      const v3 = plateBottomVertices[i + 1]
      const v4 = plateTopVertices[i + 1]
      
      const center = new Vector3(centerX, 0, centerZ)
      const surfaceCenter = v1.clone().add(v3).multiplyScalar(0.5)
      const normal = surfaceCenter.clone().sub(center).normalize()
      normal.y = 0
      
      createFace([v1, v2, v3, v4], normal, 1, templeIndex, 2, faceId)
    }
    faceId++
    
    // 4. CONE CAP
    const coneBottomVertices = createPolygonVertices(16, structure.coneRadius, plateTop, centerX, centerZ)
    const coneApex = new Vector3(centerX, coneTop, centerZ)
    
    // Cone sides (triangular faces)
    for (let i = 0; i < 16; i++) {
      const v1 = coneBottomVertices[i]
      const v2 = coneBottomVertices[i + 1]
      const v3 = coneApex
      
      // Calculate cone surface normal
      const edge1 = v2.clone().sub(v1)
      const edge2 = v3.clone().sub(v1)
      const normal = new Vector3().crossVectors(edge1, edge2).normalize()
      
      createFace([v1, v2, v3], normal, 1, templeIndex, 3, faceId)
    }
    faceId++
  })
  
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('faceType', new BufferAttribute(new Float32Array(faceTypes), 1))
  geometry.setAttribute('templeId', new BufferAttribute(new Float32Array(templeIds), 1))
  geometry.setAttribute('componentId', new BufferAttribute(new Float32Array(componentIds), 1))
  geometry.setAttribute('faceId', new BufferAttribute(new Float32Array(faceIds), 1))
  geometry.setIndex(indices)
  
  return geometry
}