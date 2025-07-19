export const terrainVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vDistance;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    // Calculate distance from center for energy effects
    vDistance = length(position.xz);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const terrainFragmentShader = `
  uniform float uTime;
  uniform float uPlainRadius;
  uniform float uTransitionRadius;
  uniform float uMountainRadius;
  uniform float uMaxHeight;
  uniform bool uEnergyEffects;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vDistance;
  
  // Noise function
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  // Energy wave function
  float energyWave(vec2 pos, float time) {
    float dist = length(pos);
    float angle = atan(pos.y, pos.x);
    
    // Multiple wave layers
    float wave1 = sin(dist * 0.3 - time * 2.0 + angle * 2.0) * 0.5 + 0.5;
    float wave2 = sin(dist * 0.5 - time * 1.5 + angle * 4.0) * 0.3 + 0.5;
    float wave3 = sin(dist * 0.8 - time * 3.0) * 0.2 + 0.5;
    
    return (wave1 + wave2 + wave3) / 3.0;
  }
  
  void main() {
    vec3 baseColor;
    vec3 emissiveColor;
    float energyIntensity;
    
    // Plain area - energy field
    if (vDistance <= uPlainRadius) {
      if (uEnergyEffects) {
        baseColor = vec3(0.1, 0.15, 0.2);  // Dark blue-gray
        
        // Animated energy lines
        float energyPattern = energyWave(vPosition.xz, uTime);
        float gridPattern = step(0.9, fract(vPosition.x * 0.5)) + step(0.9, fract(vPosition.z * 0.5));
        
        emissiveColor = mix(
          vec3(0.0, 1.0, 0.8),    // Cyan
          vec3(0.0, 0.6, 1.0),    // Blue
          energyPattern
        );
        
        energyIntensity = (energyPattern * 0.4 + gridPattern * 0.2) * (1.0 + sin(uTime * 4.0) * 0.1);
      } else {
        baseColor = vec3(0.05, 0.08, 0.06);  // Very dark green-gray
          emissiveColor = vec3(0.1, 0.15, 0.1); // Subtle dark green

          float subtleNoise = noise(vPosition.xz * 0.1) * 0.02;
          energyIntensity = subtleNoise;
      }
    }
    // Transition area
    else if (vDistance <= uTransitionRadius) {
      baseColor = vec3(0.15, 0.1, 0.2);  // Purple-gray
      
      float transitionFactor = (vDistance - uPlainRadius) / (uTransitionRadius - uPlainRadius);
      float energyBleed = energyWave(vPosition.xz * 0.5, uTime * 0.8);
      
      emissiveColor = vec3(0.4, 0.0, 1.0);  // Purple
      energyIntensity = energyBleed * 0.3 * (1.0 - transitionFactor);
    }
    // Mountain area
    else if (vDistance <= uMountainRadius) {
      float heightFactor = vPosition.y / uMaxHeight;
      
      if (heightFactor > 0.7) {
        baseColor = vec3(0.2, 0.2, 0.2);     // Gray crystal
        emissiveColor = vec3(1.0, 0.2, 0.4); // Red veins
        
        // Crystal energy veins
        float veinPattern = step(0.8, noise(vPosition.xz * 2.0 + uTime * 0.5));
        energyIntensity = veinPattern * 0.4;
      } else {
        baseColor = vec3(0.1, 0.1, 0.15);    // Dark base
        emissiveColor = vec3(0.2, 0.4, 1.0); // Blue energy
        energyIntensity = 0.1;
      }
    }
    // High mountain barrier
    else {
      baseColor = vec3(0.05, 0.05, 0.1);     // Almost black
      emissiveColor = vec3(1.0, 0.4, 0.0);   // Orange energy
      
      // Distant energy flickers
      float flicker = step(0.95, noise(vPosition.xz * 0.1 + uTime));
      energyIntensity = flicker * 0.2;
    }
    
    // Lighting calculation
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    
    // Final color composition
    vec3 finalColor = baseColor * (0.3 + NdotL * 0.7) + 
                     emissiveColor * energyIntensity;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`