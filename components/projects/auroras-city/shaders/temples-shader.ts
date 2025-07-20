export const templesVertexShader = `
  attribute float faceType;
  attribute float templeId;
  attribute float componentId;
  attribute float faceId;
  
  flat varying float vFaceType;
  flat varying float vTempleId;
  flat varying float vComponentId;
  flat varying float vFaceId;
  
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying vec2 vUv;
  
  void main() {
    vFaceType = faceType;
    vTempleId = templeId;
    vComponentId = componentId;
    vFaceId = faceId;
    
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = viewPos.xyz;
    
    // Calculate UV coordinates
    vUv = vec2(
      atan(position.z, position.x) / (2.0 * 3.14159) + 0.5,
      position.y
    );
    
    gl_Position = projectionMatrix * viewPos;
  }
`;

export const templesFragmentShader = `
  uniform float uTime;
  
  flat varying float vFaceType;
  flat varying float vTempleId;
  flat varying float vComponentId;
  flat varying float vFaceId;
  
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying vec2 vUv;
  
  // Color palettes for different components
  vec3 getComponentTopColor(float componentId, float templeId, float faceId, float time) {
    // Base (Pentagon) - Earth tones
    vec3 basePalette[4];
    basePalette[0] = vec3(0.8, 0.6, 0.4);   // Sandy brown
    basePalette[1] = vec3(0.7, 0.5, 0.3);   // Earth brown
    basePalette[2] = vec3(0.9, 0.7, 0.5);   // Light tan
    basePalette[3] = vec3(0.6, 0.4, 0.2);   // Dark brown
    
    // Pillar (Decagon) - Stone tones
    vec3 pillarPalette[4];
    pillarPalette[0] = vec3(0.6, 0.6, 0.7);  // Light stone
    pillarPalette[1] = vec3(0.5, 0.5, 0.6);  // Medium stone
    pillarPalette[2] = vec3(0.7, 0.7, 0.8);  // Bright stone
    pillarPalette[3] = vec3(0.4, 0.4, 0.5);  // Dark stone
    
    // Plate (Hexadecagon) - Metal tones
    vec3 platePalette[4];
    platePalette[0] = vec3(0.8, 0.7, 0.5);   // Gold
    platePalette[1] = vec3(0.7, 0.7, 0.8);   // Silver
    platePalette[2] = vec3(0.9, 0.6, 0.4);   // Copper
    platePalette[3] = vec3(0.6, 0.8, 0.7);   // Bronze
    
    // Cone - Gem tones
    vec3 conePalette[4];
    conePalette[0] = vec3(0.9, 0.2, 0.3);    // Ruby
    conePalette[1] = vec3(0.2, 0.5, 0.9);    // Sapphire
    conePalette[2] = vec3(0.3, 0.8, 0.3);    // Emerald
    conePalette[3] = vec3(0.8, 0.3, 0.8);    // Amethyst
    
    float speed = 0.3 + vComponentId * 0.1; // Different speeds for components
    float cycle = time * speed;
    float colorIndex = mod(vTempleId * 2.0 + vFaceId + cycle, 4.0);
    
    int index1 = int(floor(colorIndex));
    int index2 = int(mod(floor(colorIndex) + 1.0, 4.0));
    float blend = fract(colorIndex);
    
    if (vComponentId < 0.5) {
      return mix(basePalette[index1], basePalette[index2], blend);
    } else if (vComponentId < 1.5) {
      return mix(pillarPalette[index1], pillarPalette[index2], blend);
    } else if (vComponentId < 2.5) {
      return mix(platePalette[index1], platePalette[index2], blend);
    } else {
      return mix(conePalette[index1], conePalette[index2], blend);
    }
  }
  
  vec3 getComponentSideColor(float componentId, float templeId, float time, vec2 uv) {
    // Darker versions for side faces
    vec3 basePalette[3];
    basePalette[0] = vec3(0.3, 0.2, 0.1);   // Dark brown
    basePalette[1] = vec3(0.4, 0.3, 0.2);   // Medium brown
    basePalette[2] = vec3(0.2, 0.15, 0.1);  // Very dark brown
    
    vec3 pillarPalette[3];
    pillarPalette[0] = vec3(0.2, 0.2, 0.3);  // Dark stone
    pillarPalette[1] = vec3(0.3, 0.3, 0.4);  // Medium stone
    pillarPalette[2] = vec3(0.1, 0.1, 0.2);  // Very dark stone
    
    vec3 platePalette[3];
    platePalette[0] = vec3(0.3, 0.25, 0.15); // Dark gold
    platePalette[1] = vec3(0.25, 0.25, 0.3); // Dark silver
    platePalette[2] = vec3(0.3, 0.2, 0.1);   // Dark copper
    
    vec3 conePalette[3];
    conePalette[0] = vec3(0.3, 0.05, 0.1);   // Dark ruby
    conePalette[1] = vec3(0.05, 0.15, 0.3);  // Dark sapphire
    conePalette[2] = vec3(0.1, 0.25, 0.1);   // Dark emerald
    
    float speed = 0.2 + vComponentId * 0.05;
    float cycle = time * speed;
    
    // Add texture variation based on UV
    float textureVariation = sin(uv.x * 10.0 + cycle) * sin(uv.y * 15.0) * 0.2 + 0.8;
    
    float colorIndex = mod(vTempleId + cycle, 3.0);
    int index1 = int(floor(colorIndex));
    int index2 = int(mod(floor(colorIndex) + 1.0, 3.0));
    float blend = fract(colorIndex);
    
    vec3 baseColor;
    if (vComponentId < 0.5) {
      baseColor = mix(basePalette[index1], basePalette[index2], blend);
    } else if (vComponentId < 1.5) {
      baseColor = mix(pillarPalette[index1], pillarPalette[index2], blend);
    } else if (vComponentId < 2.5) {
      baseColor = mix(platePalette[index1], platePalette[index2], blend);
    } else {
      baseColor = mix(conePalette[index1], conePalette[index2], blend);
    }
    
    return baseColor * textureVariation;
  }
  
  vec3 getBottomColor(float componentId, float time) {
    // Very dark colors for bottom faces
    vec3 colors[4];
    colors[0] = vec3(0.1, 0.05, 0.02);  // Very dark brown
    colors[1] = vec3(0.05, 0.05, 0.1);  // Very dark stone
    colors[2] = vec3(0.1, 0.08, 0.05);  // Very dark metal
    colors[3] = vec3(0.08, 0.02, 0.05); // Very dark gem
    
    int componentIndex = int(vComponentId);
    vec3 baseColor = colors[componentIndex];
    
    float variation = sin(time * 0.1) * 0.1 + 0.9;
    return baseColor * variation;
  }
  
  // Add architectural details
  vec3 addArchitecturalDetails(vec3 color, float componentId, vec2 uv, float time) {
    if (vComponentId < 0.5) {
      // Base: Stone block pattern
      float blockPattern = step(0.95, sin(uv.x * 20.0)) + step(0.95, sin(uv.y * 15.0));
      color += vec3(0.1) * blockPattern;
    } else if (vComponentId < 1.5) {
      // Pillar: Vertical grooves
      float grooves = sin(uv.x * 50.0) * 0.1 + 0.9;
      color *= grooves;
    } else if (vComponentId < 2.5) {
      // Plate: Decorative patterns
      float pattern = sin(uv.x * 30.0 + time) * sin(uv.y * 25.0) * 0.1 + 0.9;
      color *= pattern;
    }
    
    return color;
  }
  
  // Enhanced lighting calculation
  vec3 calculateLighting(vec3 color, vec3 normal, vec3 viewPos, float faceType, float componentId) {
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    vec3 viewDir = normalize(-viewPos);
    
    // Diffuse lighting
    float diffuse = max(dot(normal, lightDir), 0.0);
    
    // Ambient lighting (varies by component)
    float ambient = 0.2 + vComponentId * 0.1;
    if (faceType < 0.5) ambient += 0.2; // Brighter for top faces
    
    // Specular lighting (strongest for cone/gems)
    vec3 reflectDir = reflect(-lightDir, normal);
    float specularPower = 16.0 + vComponentId * 16.0; // Higher for gems
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), specularPower);
    float specularStrength = 0.1 + vComponentId * 0.2;
    
    return color * (ambient + diffuse * 0.8) + vec3(specular * specularStrength);
  }
  
  void main() {
    vec3 color;
    vec3 viewDir = normalize(-vViewPosition);
    
    if (vFaceType < 0.5) {
      // Top faces: Component-specific bright colors
      color = getComponentTopColor(vComponentId, vTempleId, vFaceId, uTime);
      
    } else if (vFaceType < 1.5) {
      // Side faces: Darker tones with texture
      color = getComponentSideColor(vComponentId, vTempleId, uTime, vUv);
      color = addArchitecturalDetails(color, vComponentId, vUv, uTime);
      
    } else {
      // Bottom faces: Very dark
      color = getBottomColor(vComponentId, uTime);
    }
    
    // Apply lighting
    color = calculateLighting(color, vNormal, vViewPosition, vFaceType, vComponentId);
    
    // Add gem-like effect for cone tops
    if (vFaceType < 0.5 && vComponentId > 2.5) {
      float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
      color += vec3(0.5, 0.8, 1.0) * fresnel * 0.3;
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;