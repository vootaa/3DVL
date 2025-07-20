export const tetherBridgeIrregularVertexShader = `
  attribute float patchType;
  attribute float patchId;
  attribute float colorSeed;
  attribute float bridgeId;
  attribute float faceType;

  // Use flat interpolation to avoid color mixing within triangles
  flat varying float vPatchType;
  flat varying float vPatchId;
  flat varying float vColorSeed;
  flat varying float vBridgeId;
  flat varying float vFaceType;
  
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;

  void main() {
    vPatchType = patchType;
    vPatchId = patchId;
    vColorSeed = colorSeed;
    vBridgeId = bridgeId;
    vFaceType = faceType;
    
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = viewPos.xyz;
    
    gl_Position = projectionMatrix * viewPos;
  }
`;

export const tetherBridgeIrregularFragmentShader = `
  uniform float uTime;
  
  flat varying float vPatchType;
  flat varying float vPatchId;
  flat varying float vColorSeed;
  flat varying float vBridgeId;
  flat varying float vFaceType;
  
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;

  // Enhanced color palette
  vec3 getPatchColor(float patchId, float patchType, float colorSeed, float bridgeId, float time) {
    vec3 palette[8];
    palette[0] = vec3(0.9, 0.3, 0.3);   // Bright Red
    palette[1] = vec3(0.3, 0.6, 0.9);   // Bright Blue
    palette[2] = vec3(0.3, 0.9, 0.4);   // Bright Green
    palette[3] = vec3(1.0, 0.8, 0.2);   // Golden Yellow
    palette[4] = vec3(0.7, 0.3, 0.9);   // Purple
    palette[5] = vec3(0.2, 0.9, 0.9);   // Cyan
    palette[6] = vec3(0.9, 0.5, 0.2);   // Orange
    palette[7] = vec3(0.9, 0.2, 0.7);   // Magenta

    // Bidirectional flow based on patchType
    float flowSpeed = 2.0; // Adjust flow speed
    float cycle = time * flowSpeed;
    
    // Alternate direction based on patchType
    float direction = mod(vPatchType, 2.0) < 1.0 ? 1.0 : -1.0;
    
    // Calculate color index with flow
    float baseIndex = mod(vPatchId + direction * cycle, 8.0);
    int colorIndex = int(floor(baseIndex));
    
    return palette[colorIndex];
  }

  // Side face coloring with depth and lighting
  vec3 getSideColor(float bridgeId, vec3 worldPos, float faceType, float time) {
    // Base color variations per bridge
    float t = mod(bridgeId, 3.0) / 3.0;
    vec3 baseColors[3];
    baseColors[0] = vec3(0.2, 0.3, 0.5);  // Blue-gray
    baseColors[1] = vec3(0.4, 0.3, 0.2);  // Brown
    baseColors[2] = vec3(0.3, 0.4, 0.3);  // Green-gray
    
    int baseIdx = int(mod(bridgeId, 3.0));
    vec3 baseColor = baseColors[baseIdx];
    
    // Add subtle variation based on position
    float variation = 0.5 + 0.5 * sin(worldPos.y * 0.5 + worldPos.x * 0.3 + time * 0.1);
    
    return mix(baseColor * 0.6, baseColor * 1.2, variation);
  }

  // Simple lighting calculation
  vec3 calculateLighting(vec3 color, vec3 normal, vec3 viewPos) {
    // Main light direction
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    
    // Diffuse lighting
    float diffuse = max(dot(normal, lightDir), 0.0);
    
    // Ambient lighting
    float ambient = 0.3;
    
    // Simple specular (for sides only)
    vec3 viewDir = normalize(-viewPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), 16.0) * 0.2;
    
    return color * (ambient + diffuse * 0.7) + vec3(specular);
  }

  void main() {
    vec3 color;
    
    if (vFaceType < 0.5) {
      // Top face: solid color blocks with flow animation
      color = getPatchColor(vPatchId, vPatchType, vColorSeed, vBridgeId, uTime);
      
      // Add subtle lighting to top faces
      color = calculateLighting(color, vNormal, vViewPosition);
      
    } else if (vFaceType < 1.5) {
      // Side faces: textured with lighting
      color = getSideColor(vBridgeId, vWorldPosition, vFaceType, uTime);
      color = calculateLighting(color, vNormal, vViewPosition);
      
    } else if (vFaceType < 2.5) {
      // Bottom faces: dark
      color = vec3(0.1, 0.1, 0.15);
      color = calculateLighting(color, vNormal, vViewPosition);
      
    } else {
      // End faces: medium tone
      color = vec3(0.3, 0.25, 0.2);
      color = calculateLighting(color, vNormal, vViewPosition);
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;