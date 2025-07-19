export const orbitalRingsVertexShader = `
  uniform float uTime;
  uniform float uRingType;
  uniform float uRadius;
  uniform float uWidth;
  uniform float uHeight;
  uniform float uRotationSpeed;
  uniform float uEnergyIntensity;
  uniform float uInnerRadius;
  uniform float uOuterRadius;

  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDistance;
  varying float vRadialDistance;
  varying float vRingAngle;
  varying float vHeightVar;
  varying float vRingType;

  // Noise function consistent with terrain shader
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Energy wave function similar to terrain
  float energyWave(vec2 pos, float time, float speed) {
    float dist = length(pos);
    float angle = atan(pos.y, pos.x);
    
    float wave1 = sin(dist * 0.4 - time * speed + angle * 3.0) * 0.5 + 0.5;
    float wave2 = sin(dist * 0.6 - time * speed * 1.2 + angle * 6.0) * 0.3 + 0.5;
    float wave3 = sin(dist * 0.8 - time * speed * 0.8) * 0.2 + 0.5;
    
    return (wave1 + wave2 + wave3) / 3.0;
  }

  void main() {
    vUv = uv;
    vRingType = uRingType;
    
    vec3 pos = position;
    
    // Calculate radial distance from ring center
    vRadialDistance = length(pos.xz);
    vRingAngle = atan(pos.z, pos.x);
    
    // Add dynamic height variations
    float heightWave = energyWave(pos.xz, uTime, uRotationSpeed * 2.0);
    float heightNoise = noise(pos.xz * 0.5 + uTime * 0.1) * 0.02;
    
    // Different height effects for different ring types
    if (uRingType < 0.5) { // Inner ring
      pos.y += sin(uTime * 3.0 + vRingAngle * 8.0) * 0.05 + heightNoise;
    } else if (uRingType < 1.5) { // Middle ring
      pos.y += sin(uTime * 2.0 + vRingAngle * 6.0) * 0.03 + heightWave * 0.02;
    } else { // Outer ring
      pos.y += sin(uTime * 1.5 + vRingAngle * 4.0) * 0.02 + heightNoise * 0.5;
    }
    
    vHeightVar = pos.y - position.y;
    vPosition = pos;
    
    // World position for lighting calculations
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    
    // Distance from world center for energy effects
    vDistance = length(vWorldPosition.xz);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

export const orbitalRingsFragmentShader = `
  uniform float uTime;
  uniform float uRingType;
  uniform float uRadius;
  uniform float uWidth;
  uniform float uHeight;
  uniform float uRotationSpeed;
  uniform float uEnergyIntensity;
  uniform float uInnerRadius;
  uniform float uOuterRadius;

  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDistance;
  varying float vRadialDistance;
  varying float vRingAngle;
  varying float vHeightVar;
  varying float vRingType;

  // Shared noise function with terrain shader
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Enhanced noise for more detail
  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Energy wave function matching terrain
  float energyWave(vec2 pos, float time, float speed) {
    float dist = length(pos);
    float angle = atan(pos.y, pos.x);
    
    float wave1 = sin(dist * 0.4 - time * speed + angle * 3.0) * 0.5 + 0.5;
    float wave2 = sin(dist * 0.6 - time * speed * 1.2 + angle * 6.0) * 0.3 + 0.5;
    float wave3 = sin(dist * 0.8 - time * speed * 0.8) * 0.2 + 0.5;
    
    return (wave1 + wave2 + wave3) / 3.0;
  }

  // Ring-specific energy patterns
  vec3 calculateRingEnergy(float ringType, vec2 position, float time) {
    vec3 baseColor;
    vec3 energyColor;
    float energyPattern;
    
    if (ringType < 0.5) { // Inner ring - matches terrain plain energy
      baseColor = vec3(0.1, 0.15, 0.2);
      energyColor = vec3(0.0, 1.0, 0.8); // Cyan like terrain
      
      // High-frequency energy patterns
      energyPattern = energyWave(position, time, 2.5);
      float pulsePattern = sin(time * 4.0 + vRingAngle * 12.0) * 0.5 + 0.5;
      energyPattern = mix(energyPattern, pulsePattern, 0.4);
      
    } else if (ringType < 1.5) { // Middle ring - transition energy
      baseColor = vec3(0.15, 0.1, 0.2);
      energyColor = vec3(0.4, 0.0, 1.0); // Purple like terrain transition
      
      // Medium-frequency patterns
      energyPattern = energyWave(position * 0.7, time, 1.8);
      float spiralPattern = sin(vRingAngle * 8.0 - time * 3.0) * 0.5 + 0.5;
      energyPattern = mix(energyPattern, spiralPattern, 0.3);
      
    } else { // Outer ring - mountain crystal energy
      baseColor = vec3(0.1, 0.1, 0.15);
      energyColor = vec3(1.0, 0.2, 0.4); // Red like terrain crystal veins
      
      // Low-frequency, crystalline patterns
      energyPattern = energyWave(position * 0.5, time, 1.2);
      float crystallinePattern = step(0.7, smoothNoise(position * 2.0 + time * 0.3));
      energyPattern = mix(energyPattern, crystallinePattern, 0.5);
    }
    
    return mix(baseColor, energyColor, energyPattern * uEnergyIntensity);
  }

  void main() {
    // Calculate radial position within ring
    float ringProgress = (vRadialDistance - uInnerRadius) / (uOuterRadius - uInnerRadius);
    ringProgress = clamp(ringProgress, 0.0, 1.0);
    
    // Edge falloff for smooth ring boundaries
    float edgeFalloff = sin(ringProgress * 3.14159) * 0.8 + 0.2;
    
    // Calculate energy-based color
    vec3 energyColor = calculateRingEnergy(vRingType, vWorldPosition.xz, uTime);
    
    // Add rotation-based energy trails
    float rotationTrail = sin(vRingAngle * 6.0 - uTime * uRotationSpeed * 3.0) * 0.5 + 0.5;
    energyColor += energyColor * rotationTrail * 0.3;
    
    // Add height variation influence
    float heightInfluence = abs(vHeightVar) * 10.0;
    energyColor += vec3(0.2, 0.4, 1.0) * heightInfluence;
    
    // Distance-based atmospheric scattering (matching terrain fog)
    float atmosphericDistance = length(vWorldPosition);
    float scattering = exp(-atmosphericDistance * 0.002);
    vec3 atmosphereColor = vec3(0.5, 0.7, 1.0);
    energyColor = mix(atmosphereColor * 0.1, energyColor, scattering);
    
    // Final transparency based on energy intensity and edge falloff
    float alpha = uEnergyIntensity * edgeFalloff * 0.8;
    
    // Add pulsing effect
    alpha *= (1.0 + sin(uTime * 2.0) * 0.1);
    
    gl_FragColor = vec4(energyColor, alpha);
  }
`