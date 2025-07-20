export const orbitalRingsVertexShader = `
  attribute float faceType;
  attribute float ringId;
  attribute float faceId;
  
  flat varying float vFaceType;
  flat varying float vRingId;
  flat varying float vFaceId;
  
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying vec2 vUv;
  
  void main() {
    vFaceType = faceType;
    vRingId = ringId;
    vFaceId = faceId;
    
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = viewPos.xyz;
    
    // Calculate UV coordinates for effects
    vUv = vec2(
      atan(position.z, position.x) / (2.0 * 3.14159) + 0.5,
      length(position.xz)
    );
    
    gl_Position = projectionMatrix * viewPos;
  }
`;

export const orbitalRingsFragmentShader = `
  uniform float uTime;
  uniform float uEnergyIntensity;
  
  flat varying float vFaceType;
  flat varying float vRingId;
  flat varying float vFaceId;
  
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying vec2 vUv;
  
  // Enhanced color palettes for different rings
  vec3 getTopColor(float ringId, float faceId, float time) {
    vec3 innerPalette[4];
    innerPalette[0] = vec3(0.9, 0.2, 0.3);   // Bright Red
    innerPalette[1] = vec3(0.9, 0.5, 0.1);   // Orange
    innerPalette[2] = vec3(0.9, 0.8, 0.1);   // Yellow
    innerPalette[3] = vec3(0.8, 0.1, 0.5);   // Magenta
    
    vec3 middlePalette[4];
    middlePalette[0] = vec3(0.2, 0.6, 0.9);  // Bright Blue
    middlePalette[1] = vec3(0.1, 0.8, 0.6);  // Cyan
    middlePalette[2] = vec3(0.4, 0.2, 0.8);  // Purple
    middlePalette[3] = vec3(0.1, 0.7, 0.9);  // Sky Blue
    
    vec3 outerPalette[4];
    outerPalette[0] = vec3(0.3, 0.8, 0.2);   // Bright Green
    outerPalette[1] = vec3(0.6, 0.9, 0.3);   // Lime
    outerPalette[2] = vec3(0.2, 0.9, 0.4);   // Emerald
    outerPalette[3] = vec3(0.4, 0.7, 0.1);   // Olive
    
    // Different rotation speeds for each ring
    float speed = (vRingId + 1.0) * 0.3;
    float cycle = time * speed;
    float colorIndex = mod(vFaceId + cycle, 4.0);
    
    int index1 = int(floor(colorIndex));
    int index2 = int(mod(floor(colorIndex) + 1.0, 4.0));
    float blend = fract(colorIndex);
    
    if (vRingId < 0.5) {
      return mix(innerPalette[index1], innerPalette[index2], blend);
    } else if (vRingId < 1.5) {
      return mix(middlePalette[index1], middlePalette[index2], blend);
    } else {
      return mix(outerPalette[index1], outerPalette[index2], blend);
    }
  }
  
  vec3 getSideColor(float ringId, float faceId, float time, vec2 uv) {
    vec3 innerPalette[3];
    innerPalette[0] = vec3(0.4, 0.1, 0.2);   // Dark Red
    innerPalette[1] = vec3(0.3, 0.2, 0.1);   // Dark Orange
    innerPalette[2] = vec3(0.2, 0.1, 0.3);   // Dark Purple
    
    vec3 middlePalette[3];
    middlePalette[0] = vec3(0.1, 0.2, 0.4);  // Dark Blue
    middlePalette[1] = vec3(0.1, 0.3, 0.3);  // Dark Cyan
    middlePalette[2] = vec3(0.2, 0.1, 0.4);  // Dark Purple
    
    vec3 outerPalette[3];
    outerPalette[0] = vec3(0.1, 0.3, 0.1);   // Dark Green
    outerPalette[1] = vec3(0.2, 0.3, 0.1);   // Dark Lime
    outerPalette[2] = vec3(0.1, 0.2, 0.2);   // Dark Teal
    
    float speed = (vRingId + 1.0) * 0.2;
    float cycle = time * speed;
    
    // Add energy flow effect based on UV
    float energyFlow = sin(uv.x * 20.0 + cycle * 5.0) * 0.3 + 0.7;
    
    float colorIndex = mod(vFaceId + cycle, 3.0);
    int index1 = int(floor(colorIndex));
    int index2 = int(mod(floor(colorIndex) + 1.0, 3.0));
    float blend = fract(colorIndex);
    
    vec3 baseColor;
    if (vRingId < 0.5) {
      baseColor = mix(innerPalette[index1], innerPalette[index2], blend);
    } else if (vRingId < 1.5) {
      baseColor = mix(middlePalette[index1], middlePalette[index2], blend);
    } else {
      baseColor = mix(outerPalette[index1], outerPalette[index2], blend);
    }
    
    return baseColor * energyFlow;
  }
  
  vec3 getBottomColor(float ringId, float time) {
    // Darker versions of ring colors
    vec3 colors[3];
    colors[0] = vec3(0.15, 0.05, 0.1);  // Dark Red for inner
    colors[1] = vec3(0.05, 0.1, 0.15);  // Dark Blue for middle  
    colors[2] = vec3(0.05, 0.15, 0.05); // Dark Green for outer
    
    int ringIndex = int(vRingId);
    vec3 baseColor = colors[ringIndex];
    
    float variation = sin(time * 0.1) * 0.2 + 0.8;
    return baseColor * variation;
  }
  
  // Energy glow effect for top surfaces
  vec3 addEnergyGlow(vec3 color, vec2 uv, float time, float intensity) {
    // Pulsing energy waves
    float wave1 = sin(uv.x * 15.0 + time * 3.0) * 0.5 + 0.5;
    float wave2 = sin(uv.x * 8.0 - time * 2.0) * 0.5 + 0.5;
    
    float energy = (wave1 * wave2) * intensity;
    vec3 glowColor = vec3(1.0, 0.8, 0.6); // Warm glow
    
    return color + glowColor * energy * 0.3;
  }
  
  // Enhanced lighting calculation
  vec3 calculateLighting(vec3 color, vec3 normal, vec3 viewPos, float faceType) {
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    vec3 viewDir = normalize(-viewPos);
    
    // Diffuse lighting
    float diffuse = max(dot(normal, lightDir), 0.0);
    
    // Ambient lighting (brighter for top faces)
    float ambient = faceType < 0.5 ? 0.5 : (faceType < 1.5 ? 0.3 : 0.2);
    
    // Specular lighting (stronger for energy rings)
    vec3 reflectDir = reflect(-lightDir, normal);
    float specularPower = faceType < 0.5 ? 64.0 : 32.0;
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), specularPower);
    float specularStrength = faceType < 0.5 ? 0.8 : 0.4;
    
    return color * (ambient + diffuse * 0.8) + vec3(specular * specularStrength);
  }
  
  void main() {
    vec3 color;
    vec3 viewDir = normalize(-vViewPosition);
    
    if (vFaceType < 0.5) {
      // Top faces: Bright energy colors with glow
      color = getTopColor(vRingId, vFaceId, uTime);
      color = addEnergyGlow(color, vUv, uTime, 1.0 + vRingId * 0.2);
      
    } else if (vFaceType < 1.5) {
      // Side faces: Medium tones with energy flow
      color = getSideColor(vRingId, vFaceId, uTime, vUv);
      
    } else {
      // Bottom faces: Dark colors
      color = getBottomColor(vRingId, uTime);
    }
    
    // Apply lighting
    color = calculateLighting(color, vNormal, vViewPosition, vFaceType);
    
    // Add fresnel effect for energy rings
    if (vFaceType < 0.5) {
      float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
      color += vec3(0.3, 0.6, 1.0) * fresnel * 0.2;
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;