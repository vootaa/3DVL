import { BufferGeometry, BufferAttribute, Vector3 } from 'three'

export interface ShaderTVConfig {
    tv: {
        positions: Array<{ x: number, z: number }>
        screenSize: number
        frameThickness: number
        supportHeight: number
        supportRadius: number
    }
}

interface TVStructure {
    screenSize: number
    frameThickness: number
    supportHeight: number
    supportRadius: number
    tvHeight: number
    viewerHeight: number
    viewerWidth: number
}

// Component ID enum
export const ComponentType = {
    SUPPORT: 0,
    FRAME: 1,
    SCREEN: 2,
    BACK: 3,
    VIEWER: 4
} as const

// Surface type enum
export const SurfaceType = {
    TOP: 0,
    SIDE: 1,
    BOTTOM: 2
} as const

export function createShaderTVGeometry(config: ShaderTVConfig): BufferGeometry {
    const { tv } = config
    
    const positions: number[] = []
    const normals: number[] = []
    const indices: number[] = []
    const uvs: number[] = []
    const componentIds: number[] = []
    const surfaceTypes: number[] = []
    const tvIds: number[] = []
    
    let vertexIndex = 0
    
    // Define TV structure parameters
    const structure: TVStructure = {
        screenSize: tv.screenSize,
        frameThickness: tv.frameThickness,
        supportHeight: tv.supportHeight,
        supportRadius: tv.supportRadius,
        tvHeight: tv.supportHeight + tv.screenSize + tv.frameThickness,
        viewerHeight: tv.screenSize * 0.8,
        viewerWidth: tv.screenSize * 0.3
    }
    
    // Helper function to create a quad
    function createQuad(
        v1: Vector3, v2: Vector3, v3: Vector3, v4: Vector3,
        normal: Vector3, componentId: number, surfaceType: number, tvId: number,
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
            surfaceTypes.push(surfaceType)
            tvIds.push(tvId)
        })
        
        // Create two triangles
        indices.push(
            vertexIndex, vertexIndex + 1, vertexIndex + 2,
            vertexIndex, vertexIndex + 2, vertexIndex + 3
        )
        vertexIndex += 4
    }
    
    function createTriangle(
        v1: Vector3, v2: Vector3, v3: Vector3,
        normal: Vector3, componentId: number, surfaceType: number, tvId: number
    ) {
        const vertices = [v1, v2, v3]
        const uvCoords = [[0, 0], [1, 0], [0.5, 1]]
        
        vertices.forEach((v, i) => {
            positions.push(v.x, v.y, v.z)
            normals.push(normal.x, normal.y, normal.z)
            uvs.push(uvCoords[i][0], uvCoords[i][1])
            componentIds.push(componentId)
            surfaceTypes.push(surfaceType)
            tvIds.push(tvId)
        })
        
        indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2)
        vertexIndex += 3
    }
    
    // Create cylinder vertices
    function createCylinderVertices(radius: number, height: number, segments: number, centerX: number, centerZ: number, baseY: number) {
        const bottomVertices: Vector3[] = []
        const topVertices: Vector3[] = []
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            const x = centerX + Math.cos(angle) * radius
            const z = centerZ + Math.sin(angle) * radius
            
            bottomVertices.push(new Vector3(x, baseY, z))
            topVertices.push(new Vector3(x, baseY + height, z))
        }
        
        return { bottomVertices, topVertices }
    }
    
    // Create geometry for each TV position
    tv.positions.forEach((pos, tvIndex) => {
        const centerX = pos.x
        const centerZ = pos.z
        
        // 1. Create support (cylinder)
        const supportSegments = 8
        const support = createCylinderVertices(
            structure.supportRadius, 
            structure.supportHeight, 
            supportSegments, 
            centerX, 
            centerZ, 
            0
        )
        
        // Support side
        for (let i = 0; i < supportSegments; i++) {
            const next = i + 1
            createQuad(
                support.bottomVertices[i],
                support.bottomVertices[next],
                support.topVertices[next],
                support.topVertices[i],
                new Vector3(Math.cos(i / supportSegments * Math.PI * 2), 0, Math.sin(i / supportSegments * Math.PI * 2)),
                ComponentType.SUPPORT,
                SurfaceType.SIDE,
                tvIndex
            )
        }
        
        // Support top
        const supportCenter = new Vector3(centerX, structure.supportHeight, centerZ)
        for (let i = 0; i < supportSegments; i++) {
            const next = (i + 1) % supportSegments
            createTriangle(
                supportCenter,
                support.topVertices[i],
                support.topVertices[next],
                new Vector3(0, 1, 0),
                ComponentType.SUPPORT,
                SurfaceType.TOP,
                tvIndex
            )
        }
        
        // 2. Create TV screen and frame
        const screenY = structure.supportHeight
        const halfScreen = structure.screenSize / 2
        const halfFrame = halfScreen + structure.frameThickness
        const frameDepth = structure.frameThickness
        
        // Screen (front)
        createQuad(
            new Vector3(centerX - halfScreen, screenY, centerZ + frameDepth),
            new Vector3(centerX + halfScreen, screenY, centerZ + frameDepth),
            new Vector3(centerX + halfScreen, screenY + structure.screenSize, centerZ + frameDepth),
            new Vector3(centerX - halfScreen, screenY + structure.screenSize, centerZ + frameDepth),
            new Vector3(0, 0, 1),
            ComponentType.SCREEN,
            SurfaceType.SIDE,
            tvIndex
        )
        
        // Back
        createQuad(
            new Vector3(centerX + halfScreen, screenY, centerZ - frameDepth),
            new Vector3(centerX - halfScreen, screenY, centerZ - frameDepth),
            new Vector3(centerX - halfScreen, screenY + structure.screenSize, centerZ - frameDepth),
            new Vector3(centerX + halfScreen, screenY + structure.screenSize, centerZ - frameDepth),
            new Vector3(0, 0, -1),
            ComponentType.BACK,
            SurfaceType.SIDE,
            tvIndex
        )
        
        // Frame - top
        createQuad(
            new Vector3(centerX - halfFrame, screenY + structure.screenSize, centerZ - frameDepth),
            new Vector3(centerX + halfFrame, screenY + structure.screenSize, centerZ - frameDepth),
            new Vector3(centerX + halfFrame, screenY + structure.screenSize + structure.frameThickness, centerZ + frameDepth),
            new Vector3(centerX - halfFrame, screenY + structure.screenSize + structure.frameThickness, centerZ + frameDepth),
            new Vector3(0, 1, 0),
            ComponentType.FRAME,
            SurfaceType.TOP,
            tvIndex
        )
        
        // Frame - bottom
        createQuad(
            new Vector3(centerX + halfFrame, screenY - structure.frameThickness, centerZ - frameDepth),
            new Vector3(centerX - halfFrame, screenY - structure.frameThickness, centerZ - frameDepth),
            new Vector3(centerX - halfFrame, screenY, centerZ + frameDepth),
            new Vector3(centerX + halfFrame, screenY, centerZ + frameDepth),
            new Vector3(0, -1, 0),
            ComponentType.FRAME,
            SurfaceType.BOTTOM,
            tvIndex
        )
        
        // Frame - left
        createQuad(
            new Vector3(centerX - halfFrame, screenY - structure.frameThickness, centerZ + frameDepth),
            new Vector3(centerX - halfFrame, screenY - structure.frameThickness, centerZ - frameDepth),
            new Vector3(centerX - halfFrame, screenY + structure.screenSize + structure.frameThickness, centerZ - frameDepth),
            new Vector3(centerX - halfFrame, screenY + structure.screenSize + structure.frameThickness, centerZ + frameDepth),
            new Vector3(-1, 0, 0),
            ComponentType.FRAME,
            SurfaceType.SIDE,
            tvIndex
        )
        
        // Frame - right
        createQuad(
            new Vector3(centerX + halfFrame, screenY - structure.frameThickness, centerZ - frameDepth),
            new Vector3(centerX + halfFrame, screenY - structure.frameThickness, centerZ + frameDepth),
            new Vector3(centerX + halfFrame, screenY + structure.screenSize + structure.frameThickness, centerZ + frameDepth),
            new Vector3(centerX + halfFrame, screenY + structure.screenSize + structure.frameThickness, centerZ - frameDepth),
            new Vector3(1, 0, 0),
            ComponentType.FRAME,
            SurfaceType.SIDE,
            tvIndex
        )
        
        // 3. Create viewer (simplified low-poly humanoid)
        const viewerX = centerX + halfFrame + 1.5
        const viewerZ = centerZ
        const viewerY = 0
        
        // Viewer torso (box)
        const torsoWidth = structure.viewerWidth
        const torsoHeight = structure.viewerHeight * 0.6
        const torsoDepth = structure.viewerWidth * 0.6
        
        // Torso front
        createQuad(
            new Vector3(viewerX - torsoWidth/2, viewerY, viewerZ + torsoDepth/2),
            new Vector3(viewerX + torsoWidth/2, viewerY, viewerZ + torsoDepth/2),
            new Vector3(viewerX + torsoWidth/2, viewerY + torsoHeight, viewerZ + torsoDepth/2),
            new Vector3(viewerX - torsoWidth/2, viewerY + torsoHeight, viewerZ + torsoDepth/2),
            new Vector3(0, 0, 1),
            ComponentType.VIEWER,
            SurfaceType.SIDE,
            tvIndex
        )
        
        // Torso back
        createQuad(
            new Vector3(viewerX + torsoWidth/2, viewerY, viewerZ - torsoDepth/2),
            new Vector3(viewerX - torsoWidth/2, viewerY, viewerZ - torsoDepth/2),
            new Vector3(viewerX - torsoWidth/2, viewerY + torsoHeight, viewerZ - torsoDepth/2),
            new Vector3(viewerX + torsoWidth/2, viewerY + torsoHeight, viewerZ - torsoDepth/2),
            new Vector3(0, 0, -1),
            ComponentType.VIEWER,
            SurfaceType.SIDE,
            tvIndex
        )
        
        // Torso left
        createQuad(
            new Vector3(viewerX - torsoWidth/2, viewerY, viewerZ - torsoDepth/2),
            new Vector3(viewerX - torsoWidth/2, viewerY, viewerZ + torsoDepth/2),
            new Vector3(viewerX - torsoWidth/2, viewerY + torsoHeight, viewerZ + torsoDepth/2),
            new Vector3(viewerX - torsoWidth/2, viewerY + torsoHeight, viewerZ - torsoDepth/2),
            new Vector3(-1, 0, 0),
            ComponentType.VIEWER,
            SurfaceType.SIDE,
            tvIndex
        )
        
        // Torso right
        createQuad(
            new Vector3(viewerX + torsoWidth/2, viewerY, viewerZ + torsoDepth/2),
            new Vector3(viewerX + torsoWidth/2, viewerY, viewerZ - torsoDepth/2),
            new Vector3(viewerX + torsoWidth/2, viewerY + torsoHeight, viewerZ - torsoDepth/2),
            new Vector3(viewerX + torsoWidth/2, viewerY + torsoHeight, viewerZ + torsoDepth/2),
            new Vector3(1, 0, 0),
            ComponentType.VIEWER,
            SurfaceType.SIDE,
            tvIndex
        )
        
        // Viewer head (cube)
        const headSize = structure.viewerWidth * 0.4
        const headY = viewerY + torsoHeight
        
        // Head front
        createQuad(
            new Vector3(viewerX - headSize/2, headY, viewerZ + headSize/2),
            new Vector3(viewerX + headSize/2, headY, viewerZ + headSize/2),
            new Vector3(viewerX + headSize/2, headY + headSize, viewerZ + headSize/2),
            new Vector3(viewerX - headSize/2, headY + headSize, viewerZ + headSize/2),
            new Vector3(0, 0, 1),
            ComponentType.VIEWER,
            SurfaceType.SIDE,
            tvIndex
        )
        
        // Head top
        createQuad(
            new Vector3(viewerX - headSize/2, headY + headSize, viewerZ - headSize/2),
            new Vector3(viewerX + headSize/2, headY + headSize, viewerZ - headSize/2),
            new Vector3(viewerX + headSize/2, headY + headSize, viewerZ + headSize/2),
            new Vector3(viewerX - headSize/2, headY + headSize, viewerZ + headSize/2),
            new Vector3(0, 1, 0),
            ComponentType.VIEWER,
            SurfaceType.TOP,
            tvIndex
        )
    })
    
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
    geometry.setAttribute('componentId', new BufferAttribute(new Float32Array(componentIds), 1))
    geometry.setAttribute('surfaceType', new BufferAttribute(new Float32Array(surfaceTypes), 1))
    geometry.setAttribute('tvId', new BufferAttribute(new Float32Array(tvIds), 1))
    geometry.setIndex(indices)
    
    return geometry
}