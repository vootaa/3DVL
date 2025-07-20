export const concentricBaseVertexShader = `
  attribute float faceType;
  attribute float faceId;
  
  flat varying float vFaceType;
  flat varying float vFaceId;
  
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  
  void main() {
    vFaceType = faceType;
    vFaceId = faceId;
    
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = viewPos.xyz;
    
    gl_Position = projectionMatrix * viewPos;
  }
`;

export const concentricBaseFragmentShader = `
  uniform float uTime;
  
  flat varying float vFaceType;
  flat varying float vFaceId;
  
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  
  // Color palette for different face types
  vec3 getTopColor(float faceId, float time) {
    vec3 palette[6];
    palette[0] = vec3(0.8, 0.3, 0.2);   // Warm Red
    palette[1] = vec3(0.2, 0.5, 0.8);   // Cool Blue  
    palette[2] = vec3(0.3, 0.7, 0.3);   // Fresh Green
    palette[3] = vec3(0.9, 0.6, 0.1);   // Golden Yellow
    palette[4] = vec3(0.6, 0.2, 0.7);   // Royal Purple
    palette[5] = vec3(0.1, 0.7, 0.7);   // Cyan Blue
    
    // Slow color cycling
    float cycle = time * 0.5; // Slow rotation
    float colorIndex = mod(vFaceId + cycle, 6.0);
    
    int index1 = int(floor(colorIndex));
    int index2 = int(mod(floor(colorIndex) + 1.0, 6.0));
    float blend = fract(colorIndex);
    
    return mix(palette[index1], palette[index2], blend);
  }
  
  vec3 getSideColor(float faceId, float time) {
    vec3 palette[4];
    palette[0] = vec3(0.15, 0.25, 0.4);  // Deep Blue
    palette[1] = vec3(0.25, 0.15, 0.35); // Deep Purple
    palette[2] = vec3(0.2, 0.3, 0.15);   // Deep Green
    palette[3] = vec3(0.3, 0.2, 0.1);    // Deep Brown
    
    float cycle = time * 0.3;
    float colorIndex = mod(vFaceId + cycle, 4.0);
    
    int index1 = int(floor(colorIndex));
    int index2 = int(mod(floor(colorIndex) + 1.0, 4.0));
    float blend = fract(colorIndex);
    
    return mix(palette[index1], palette[index2], blend);
  }
  
  vec3 getBottomColor(float time) {
    // Single dark color for bottom, with subtle variation
    vec3 baseColor = vec3(0.1, 0.1, 0.15);
    float variation = sin(time * 0.2) * 0.05 + 0.95;
    return baseColor * variation;
  }
  
  // Simple lighting calculation
  vec3 calculateLighting(vec3 color, vec3 normal, vec3 viewPos) {
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    vec3 viewDir = normalize(-viewPos);
    
    // Diffuse lighting
    float diffuse = max(dot(normal, lightDir), 0.0);
    
    // Ambient lighting (different for different face types)
    float ambient = vFaceType < 0.5 ? 0.4 : (vFaceType < 1.5 ? 0.3 : 0.2);
    
    // Specular lighting
    vec3 reflectDir = reflect(-lightDir, normal);
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0) * 0.3;
    
    return color * (ambient + diffuse * 0.7) + vec3(specular);
  }
  
  void main() {
    vec3 color;
    
    if (vFaceType < 0.5) {
      // Top faces: Bright colors with cycling
      color = getTopColor(vFaceId, uTime);
    } else if (vFaceType < 1.5) {
      // Side faces: Medium tones with cycling
      color = getSideColor(vFaceId, uTime);
    } else {
      // Bottom face: Dark color
      color = getBottomColor(uTime);
    }
    
    // Apply lighting
    color = calculateLighting(color, vNormal, vViewPosition);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;