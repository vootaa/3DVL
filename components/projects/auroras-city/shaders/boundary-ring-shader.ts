export const boundaryRingVertexShader = `
  attribute float faceType;
  attribute float gridId;
  attribute float faceId;
  
  flat varying float vFaceType;
  flat varying float vGridId;
  flat varying float vFaceId;
  
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying vec2 vUv;
  
  void main() {
    vFaceType = faceType;
    vGridId = gridId;
    vFaceId = faceId;
    
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = viewPos.xyz;
    
    // Calculate UV coordinates for grid effects
    float radius = length(position.xz);
    float angle = atan(position.z, position.x) / (2.0 * 3.14159) + 0.5;
    vUv = vec2(angle, radius);
    
    gl_Position = projectionMatrix * viewPos;
  }
`;

export const boundaryRingFragmentShader = `
  uniform float uTime;
  
  flat varying float vFaceType;
  flat varying float vGridId;
  flat varying float vFaceId;
  
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying vec2 vUv;
  
  // Grid pattern generation
  float createGridPattern(vec2 uv, float time) {
    // Scale UV for grid density
    vec2 gridUV = uv * vec2(32.0, 8.0); // 32 angular divisions, 8 radial divisions
    
    // Create grid lines
    vec2 gridLines = abs(fract(gridUV) - 0.5);
    float grid = 1.0 - min(gridLines.x, gridLines.y);
    
    // Make grid lines thinner and more defined
    grid = smoothstep(0.0, 0.1, grid);
    grid = 1.0 - grid;
    
    // Add animated pulse effect
    float pulse = sin(time * 2.0 + vGridId * 0.5) * 0.3 + 0.7;
    
    return grid * pulse;
  }
  
  // Energy flow effect for grid lines
  float createEnergyFlow(vec2 uv, float time) {
    // Radial flow
    float radialFlow = sin(uv.y * 10.0 - time * 3.0) * 0.5 + 0.5;
    
    // Angular flow
    float angularFlow = sin(uv.x * 20.0 + time * 2.0) * 0.5 + 0.5;
    
    // Combine flows
    return radialFlow * angularFlow;
  }
  
  // Top surface colors (bright, matching other components' top surfaces)
  vec3 getTopColor(float gridId, float time) {
    vec3 palette[6];
    palette[0] = vec3(0.8, 0.4, 0.2);   // Warm Orange (matches temples)
    palette[1] = vec3(0.2, 0.6, 0.9);   // Cool Blue (matches rings)
    palette[2] = vec3(0.4, 0.8, 0.3);   // Fresh Green (matches rings)
    palette[3] = vec3(0.9, 0.7, 0.2);   // Golden Yellow (matches base)
    palette[4] = vec3(0.7, 0.3, 0.8);   // Purple (matches temples)
    palette[5] = vec3(0.3, 0.8, 0.8);   // Cyan (matches bridges)
    
    // Slow color cycling
    float cycle = time * 0.4;
    float colorIndex = mod(vGridId + cycle, 6.0);
    
    int index1 = int(floor(colorIndex));
    int index2 = int(mod(floor(colorIndex) + 1.0, 6.0));
    float blend = fract(colorIndex);
    
    return mix(palette[index1], palette[index2], blend);
  }
  
  // Bottom surface colors (dark, matching other components' side/bottom surfaces)
  vec3 getBottomColor(float gridId, float time) {
    vec3 palette[4];
    palette[0] = vec3(0.15, 0.2, 0.3);   // Deep Blue (matches base sides)
    palette[1] = vec3(0.2, 0.15, 0.25);  // Deep Purple (matches temples)
    palette[2] = vec3(0.15, 0.25, 0.15); // Deep Green (matches rings)
    palette[3] = vec3(0.25, 0.2, 0.1);   // Deep Brown (matches temples)
    
    float cycle = time * 0.2;
    float colorIndex = mod(vGridId + cycle, 4.0);
    
    int index1 = int(floor(colorIndex));
    int index2 = int(mod(floor(colorIndex) + 1.0, 4.0));
    float blend = fract(colorIndex);
    
    return mix(palette[index1], palette[index2], blend);
  }
  
  // Boundary warning effect
  vec3 addBoundaryWarning(vec3 color, vec2 uv, float time) {
    // Pulsing warning effect
    float warning = sin(time * 4.0) * 0.5 + 0.5;
    
    // Distance-based intensity (stronger at edges)
    float edgeDistance = min(uv.y - 0.3, 0.7 - uv.y); // Assuming normalized radial coordinate
    float edgeIntensity = 1.0 - smoothstep(0.0, 0.2, edgeDistance);
    
    // Warning color (subtle red tint)
    vec3 warningColor = vec3(1.0, 0.3, 0.2);
    
    return color + warningColor * warning * edgeIntensity * 0.1;
  }
  
  // Enhanced lighting calculation
  vec3 calculateLighting(vec3 color, vec3 normal, vec3 viewPos, float faceType) {
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    vec3 viewDir = normalize(-viewPos);
    
    // Diffuse lighting
    float diffuse = max(dot(normal, lightDir), 0.0);
    
    // Ambient lighting (brighter for top surfaces)
    float ambient = vFaceType < 0.5 ? 0.4 : 0.2;
    
    // Specular lighting (stronger for top surfaces)
    vec3 reflectDir = reflect(-lightDir, normal);
    float specularPower = vFaceType < 0.5 ? 32.0 : 16.0;
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), specularPower);
    float specularStrength = vFaceType < 0.5 ? 0.5 : 0.2;
    
    return color * (ambient + diffuse * 0.7) + vec3(specular * specularStrength);
  }
  
  void main() {
    vec3 color;
    vec3 viewDir = normalize(-vViewPosition);
    
    // Create grid pattern
    float gridPattern = createGridPattern(vUv, uTime);
    float energyFlow = createEnergyFlow(vUv, uTime);
    
    if (vFaceType < 0.5) {
      // Top surface: Bright colors with grid pattern
      color = getTopColor(vGridId, uTime);
      
      // Apply grid pattern with energy flow
      color = mix(color * 0.3, color * 1.2, gridPattern);
      color *= (0.8 + energyFlow * 0.4);
      
    } else {
      // Bottom/side surfaces: Dark colors with subtle grid
      color = getBottomColor(vGridId, uTime);
      
      // Subtle grid pattern for dark surfaces
      color = mix(color * 0.6, color * 1.0, gridPattern * 0.5);
      color *= (0.9 + energyFlow * 0.2);
    }
    
    // Add boundary warning effect
    color = addBoundaryWarning(color, vUv, uTime);
    
    // Apply lighting
    color = calculateLighting(color, vNormal, vViewPosition, vFaceType);
    
    // Add holographic effect for top surface
    if (vFaceType < 0.5) {
      float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
      color += vec3(0.4, 0.7, 1.0) * fresnel * 0.2;
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;