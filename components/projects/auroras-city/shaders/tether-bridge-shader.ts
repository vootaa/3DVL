export const tetherBridgeIrregularVertexShader = `
  attribute float patchType;
  attribute float patchId;
  attribute float colorSeed;
  attribute float bridgeId;
  attribute float faceType;

  // Use flat interpolation for patch attributes
  flat varying float vPatchType;
  flat varying float vPatchId;
  flat varying float vColorSeed;
  flat varying float vBridgeId;
  flat varying float vFaceType;
  
  // Smooth interpolation for lighting and effects
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying vec3 vLocalPosition;

  void main() {
    vPatchType = patchType;
    vPatchId = patchId;
    vColorSeed = colorSeed;
    vBridgeId = bridgeId;
    vFaceType = faceType;
    
    vNormal = normalize(normalMatrix * normal);
    vLocalPosition = position;
    
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
  varying vec3 vLocalPosition;

  // Glass-like color palette for top surface
  vec3 getGlassColor(float patchId, float patchType, float time) {
    vec3 glassPalette[8];
    glassPalette[0] = vec3(0.8, 0.2, 0.2);   // Ruby Glass
    glassPalette[1] = vec3(0.2, 0.4, 0.8);   // Sapphire Glass
    glassPalette[2] = vec3(0.2, 0.7, 0.3);   // Emerald Glass
    glassPalette[3] = vec3(0.9, 0.6, 0.1);   // Amber Glass
    glassPalette[4] = vec3(0.5, 0.2, 0.7);   // Amethyst Glass
    glassPalette[5] = vec3(0.1, 0.6, 0.7);   // Aqua Glass
    glassPalette[6] = vec3(0.8, 0.4, 0.1);   // Topaz Glass
    glassPalette[7] = vec3(0.7, 0.1, 0.5);   // Rose Glass

    // Color cycling based on time and patch type
    float flowSpeed = 1.5;
    float cycle = time * flowSpeed;
    
    // Different flow directions for different patch types
    float direction = mod(vPatchType, 2.0) < 1.0 ? 1.0 : -1.0;
    
    // Calculate color index with smooth transitions
    float colorIndex = mod(vPatchId + direction * cycle, 8.0);
    int index1 = int(floor(colorIndex));
    int index2 = int(mod(floor(colorIndex) + 1.0, 8.0));
    float blend = fract(colorIndex);
    
    return mix(glassPalette[index1], glassPalette[index2], blend);
  }

  // Glass effect with fresnel and reflection
  vec3 calculateGlassEffect(vec3 baseColor, vec3 normal, vec3 viewDir) {
    // Fresnel effect
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
    
    // Glass transparency simulation
    vec3 glassColor = baseColor * (0.3 + 0.7 * fresnel);
    
    // Add glass highlights
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    vec3 reflectDir = reflect(-lightDir, normal);
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), 64.0);
    
    // Glass shimmer effect
    float shimmer = sin(vWorldPosition.x * 10.0 + uTime * 3.0) * 
                   sin(vWorldPosition.z * 8.0 + uTime * 2.0) * 0.1 + 0.9;
    
    return glassColor * shimmer + vec3(specular * 0.8);
  }

  // Gradient effect for sides and bottom
  vec3 getGradientColor(vec3 worldPos, float bridgeId, float faceType, float time) {
    // Base color variations per bridge
    vec3 gradientColors[4];
    gradientColors[0] = vec3(0.1, 0.2, 0.4);  // Deep Blue
    gradientColors[1] = vec3(0.3, 0.1, 0.3);  // Deep Purple
    gradientColors[2] = vec3(0.2, 0.3, 0.1);  // Deep Green
    gradientColors[3] = vec3(0.4, 0.2, 0.1);  // Deep Brown
    
    int baseIdx = int(mod(bridgeId, 4.0));
    vec3 baseColor = gradientColors[baseIdx];
    
    // Create gradient based on position and time
    float gradientFactor;
    
    if (faceType < 1.5) {
      // Side faces: vertical gradient
      gradientFactor = (worldPos.y + sin(worldPos.x * 2.0 + time) * 0.2) * 0.5 + 0.5;
    } else {
      // Bottom faces: radial gradient from center
      vec2 center = vec2(0.0, 0.0); // Bridge center
      float distance = length(worldPos.xz - center);
      gradientFactor = sin(distance * 3.0 + time * 2.0) * 0.3 + 0.7;
    }
    
    // Apply gradient
    vec3 lightColor = baseColor * 2.0;
    vec3 darkColor = baseColor * 0.3;
    
    return mix(darkColor, lightColor, gradientFactor);
  }

  // Enhanced lighting calculation
  vec3 calculateLighting(vec3 color, vec3 normal, vec3 viewPos, float faceType) {
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    vec3 viewDir = normalize(-viewPos);
    
    // Diffuse lighting
    float diffuse = max(dot(normal, lightDir), 0.0);
    
    // Ambient lighting
    float ambient = faceType < 0.5 ? 0.4 : 0.2; // Brighter ambient for top faces
    
    // Specular lighting (stronger for glass surfaces)
    vec3 reflectDir = reflect(-lightDir, normal);
    float specularPower = faceType < 0.5 ? 32.0 : 16.0;
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), specularPower);
    float specularStrength = faceType < 0.5 ? 0.6 : 0.3;
    
    return color * (ambient + diffuse * 0.8) + vec3(specular * specularStrength);
  }

  void main() {
    vec3 color;
    vec3 viewDir = normalize(-vViewPosition);
    
    if (vFaceType < 0.5) {
      // Top face: Glass effect with color cycling
      vec3 baseColor = getGlassColor(vPatchId, vPatchType, uTime);
      color = calculateGlassEffect(baseColor, vNormal, viewDir);
      color = calculateLighting(color, vNormal, vViewPosition, vFaceType);
      
    } else if (vFaceType < 2.5) {
      // Side and bottom faces: Gradient effects
      color = getGradientColor(vWorldPosition, vBridgeId, vFaceType, uTime);
      color = calculateLighting(color, vNormal, vViewPosition, vFaceType);
      
    } else {
      // End faces: Solid medium tone
      color = vec3(0.2, 0.15, 0.1);
      color = calculateLighting(color, vNormal, vViewPosition, vFaceType);
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;