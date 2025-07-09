import { BufferGeometry, BufferAttribute } from 'three'

export interface ConcentricBaseConfig {
  radii: [number, number, number] // [inner, middle, outer radius]
  sinkDepth: number
  outerHeight: number
  segments?: number
}

export function createConcentricBase(config: ConcentricBaseConfig): BufferGeometry {
  const { radii, sinkDepth, outerHeight, segments = 32 } = config
  
  const geo = new BufferGeometry()
  
  const vertices: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  
  let vertexIndex = 0
  const [innerRadius, middleRadius, outerRadius] = radii
  
  // Calculate Y positions for each layer (sinking design)
  const baseY = 0 // bottom base
  const outerTop = baseY + outerHeight
  const outerBottom = baseY
  const middleTop = outerTop - sinkDepth // middle ring sinks down from outer top
  const innerTop = middleTop - sinkDepth // inner ring sinks down from middle top
  
  // Helper function to add vertex
  function addVertex(x: number, y: number, z: number, nx: number, ny: number, nz: number, u: number, v: number): number {
    vertices.push(x, y, z)
    normals.push(nx, ny, nz)
    uvs.push(u, v)
    return vertexIndex++
  }
  
  // Store vertex indices for different rings at different heights
  const rings = {
    outerTop: [] as number[],
    outerBottom: [] as number[],
    middleTop: [] as number[],
    middleAtOuterBottom: [] as number[], // middle ring at outer bottom level
    innerTop: [] as number[],
    innerBottom: [] as number[]
  }
  
  // Create all ring vertices first
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    
    // Outer ring at top
    const outerX = Math.cos(angle) * outerRadius
    const outerZ = Math.sin(angle) * outerRadius
    rings.outerTop.push(addVertex(outerX, outerTop, outerZ, 0, 1, 0, (outerX / outerRadius + 1) / 2, (outerZ / outerRadius + 1) / 2))
    
    // Outer ring at bottom
    rings.outerBottom.push(addVertex(outerX, outerBottom, outerZ, 0, -1, 0, (outerX / outerRadius + 1) / 2, (outerZ / outerRadius + 1) / 2))
    
    // Middle ring at outer top level
    const middleX = Math.cos(angle) * middleRadius
    const middleZ = Math.sin(angle) * middleRadius
    rings.middleTop.push(addVertex(middleX, outerTop, middleZ, 0, 1, 0, (middleX / outerRadius + 1) / 2, (middleZ / outerRadius + 1) / 2))
    
    // Middle ring at middle level (sunk down)
    rings.middleAtOuterBottom.push(addVertex(middleX, middleTop, middleZ, 0, 1, 0, (middleX / outerRadius + 1) / 2, (middleZ / outerRadius + 1) / 2))
    
    // Inner ring at middle level
    const innerX = Math.cos(angle) * innerRadius
    const innerZ = Math.sin(angle) * innerRadius
    rings.innerTop.push(addVertex(innerX, middleTop, innerZ, 0, 1, 0, (innerX / outerRadius + 1) / 2, (innerZ / outerRadius + 1) / 2))
    
    // Inner ring at inner level (sunk down further)
    rings.innerBottom.push(addVertex(innerX, innerTop, innerZ, 0, -1, 0, (innerX / outerRadius + 1) / 2, (innerZ / outerRadius + 1) / 2))
  }
  
  // Add center vertices for circles
  const centerOuterBottom = addVertex(0, outerBottom, 0, 0, -1, 0, 0.5, 0.5) // center of outer bottom (full circle)
  const centerInnerBottom = addVertex(0, innerTop, 0, 0, -1, 0, 0.5, 0.5) // center of inner bottom (full circle)
  
  // Create faces
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % (segments + 1)
    
    // 1. Outer top ring face (middle to outer radius at outer height)
    indices.push(rings.middleTop[i], rings.outerTop[i], rings.middleTop[next])
    indices.push(rings.middleTop[next], rings.outerTop[i], rings.outerTop[next])
    
    // 2. Outer cylinder side (outer radius from top to bottom)
    indices.push(rings.outerTop[i], rings.outerBottom[i], rings.outerTop[next])
    indices.push(rings.outerTop[next], rings.outerBottom[i], rings.outerBottom[next])
    
    // 3. Middle step side (middle radius from outer top to middle level)
    indices.push(rings.middleTop[i], rings.middleAtOuterBottom[next], rings.middleTop[next])
    indices.push(rings.middleTop[i], rings.middleAtOuterBottom[i], rings.middleAtOuterBottom[next])
    
    // 4. Middle ring face (inner to middle radius at middle height) - ring surface
    indices.push(rings.innerTop[i], rings.middleAtOuterBottom[i], rings.innerTop[next])
    indices.push(rings.innerTop[next], rings.middleAtOuterBottom[i], rings.middleAtOuterBottom[next])
    
    // 5. Inner step side (inner radius from middle to inner level)
    indices.push(rings.innerTop[i], rings.innerBottom[next], rings.innerTop[next])
    indices.push(rings.innerTop[i], rings.innerBottom[i], rings.innerBottom[next])
    
    // 6. Inner bottom face (center to inner radius) - full circle
    indices.push(centerInnerBottom, rings.innerBottom[i], rings.innerBottom[next])
    
    // 7. Outer bottom face (center to outer radius) - full circle
    indices.push(centerOuterBottom, rings.outerBottom[next], rings.outerBottom[i])
  }
  
  geo.setIndex(indices)
  geo.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
  geo.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
  
  geo.computeVertexNormals()
  
  return geo
}