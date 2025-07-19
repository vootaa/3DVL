export const auroraVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vDistanceFromCenter;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    // Calculate distance from dome center for aurora effects
    vDistanceFromCenter = length(position.xz);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const auroraFragmentShader = `
  uniform float uTime;
  uniform float uDomeRadius;
  uniform float uPlainRadius;
  uniform float uAuroraIntensity;
  uniform vec3 uAuroraColor1;
  uniform vec3 uAuroraColor2;
  uniform vec3 uAuroraColor3;

  uniform float uAuroraTheta;   // Aurora center angle (radians)
  uniform float uAuroraArc;     // Aurora arc angle range (radians)
  uniform float uAuroraMinY;    // Aurora minimum height (normalized 0~1)
  uniform float uAuroraMaxY;    // Aurora maximum height (normalized 0~1)
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vDistanceFromCenter;
  
  // Improved noise function
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  // Fractal noise for aurora patterns
  float fractalNoise(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
      if (i >= octaves) break;
      value += noise(p * frequency) * amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value;
  }
  
  // Aurora wave function
  float auroraWave(vec2 pos, float time) {
    float dist = length(pos);
    float angle = atan(pos.y, pos.x);
    
    // Multiple flowing aurora layers
    float wave1 = sin(dist * 0.1 - time * 0.8 + angle * 1.5) * 0.5 + 0.5;
    float wave2 = sin(dist * 0.15 - time * 1.2 + angle * 2.5) * 0.3 + 0.5;
    float wave3 = sin(angle * 8.0 - time * 2.0 + dist * 0.05) * 0.2 + 0.5;
    
    return (wave1 + wave2 + wave3) / 3.0;
  }
  
  // Aurora curtain effect
  float auroraCurtain(vec2 uv, float time) {
    // Vertical flowing curtains
    float curtain1 = sin(uv.x * 10.0 + time * 1.5) * 0.5 + 0.5;
    float curtain2 = sin(uv.x * 15.0 - time * 2.0) * 0.3 + 0.5;
    
    // Height fade
    float heightFade = smoothstep(0.5, 0.98, uv.y);
    
    return (curtain1 + curtain2) * 0.5 * heightFade;
  }
  
  void main() {
    vec3 baseColor = vec3(0.0);
    float alpha = 0.0;
    
    // 1. Calculate polar coordinates of current pixel
    float theta = atan(vPosition.z, vPosition.x); // [-PI, PI]
    float normTheta = mod(theta + 6.2831853, 6.2831853); // [0, 2PI]
    float heightNorm = clamp(vPosition.y / uDomeRadius, 0.0, 1.0);

    // 2. Check if within aurora angle range
    float thetaDist = abs(normTheta - uAuroraTheta);
    if (thetaDist > 3.1415926) thetaDist = 6.2831853 - thetaDist; // Minimum angle distance
    float arcMask = smoothstep(uAuroraArc, uAuroraArc * 0.7, thetaDist);

    // 3. Check if within aurora height range
    float heightMask = smoothstep(uAuroraMinY, uAuroraMinY + 0.05, heightNorm)
                     * (1.0 - smoothstep(uAuroraMaxY - 0.05, uAuroraMaxY, heightNorm));

    // 4. Combine original aurora effects
    float auroraPattern = auroraWave(vPosition.xz, uTime);
    float curtainPattern = auroraCurtain(vUv, uTime);
    float noisePattern = fractalNoise(vPosition.xz * 0.01 + uTime * 0.1, 3);
    float detailNoise = fractalNoise(vUv * 5.0 + uTime * 0.3, 2);

    float distanceFactor = 1.0 - smoothstep(uPlainRadius * 0.5, uPlainRadius * 1.5, vDistanceFromCenter);

    float auroraIntensity = (auroraPattern * 0.4 + curtainPattern * 0.3 + noisePattern * 0.2 + detailNoise * 0.1)
                            * distanceFactor * uAuroraIntensity;

    // 5. Only show aurora in specified area
    auroraIntensity *= arcMask * heightMask;
    
    // Color mixing based on patterns
    vec3 color1 = uAuroraColor1;
    vec3 color2 = uAuroraColor2;
    vec3 color3 = uAuroraColor3;
    
    // Dynamic color blending
    float colorMix1 = sin(uTime * 1.2 + vPosition.x * 0.01) * 0.5 + 0.5;
    float colorMix2 = sin(uTime * 0.8 + vPosition.z * 0.01) * 0.5 + 0.5;
    
    baseColor = mix(
      mix(color1, color2, colorMix1),
      color3,
      colorMix2 * 0.3
    );
    
    // Aurora shimmer effect
    float shimmer = sin(uTime * 8.0 + vPosition.x * 0.1 + vPosition.z * 0.1) * 0.1 + 0.9;
    
    // Final aurora intensity with shimmer
    alpha = auroraIntensity * shimmer;
    
    // Edge fade for smooth blending
    float edgeFade = smoothstep(0.98, 1.0, vDistanceFromCenter / uDomeRadius);
    alpha *= (1.0 - edgeFade);
    
    // Ensure aurora is subtle but visible
    alpha = clamp(alpha, 0.0, 0.8);
    
    gl_FragColor = vec4(baseColor, alpha);
  }
`