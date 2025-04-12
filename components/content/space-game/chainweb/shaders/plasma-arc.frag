uniform float time;
uniform vec3 color;
uniform int connType;
uniform float seed;

varying vec2 vUv;
varying vec3 vPosition;

// Hash function from original PetersenPlasmaGraph
float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

// Noise function matching original implementation
float noise(in vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f); // Smooth interpolation
    float n = p.x + p.y * 57.0;
    return mix(mix(hash(n), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
}

void main() {
  // Get normalized position along the arc (x = along arc, y = perpendicular)
  // In TubeGeometry, vUv.x runs along the tube length, vUv.y around circumference
    float normAlong = vUv.x;
    float perpLine = (vUv.y - 0.5) * 2.0; // -1 to 1, distance from tube center

  // Determine distortion amount based on connection type
    float distortionAmount;

  // Match original connection type logic
    if(connType == 3) {
    // Inner circle connections - Minimum distortion
        distortionAmount = 0.008;
    } else if(connType == 0) {
    // Middle to inner circle - Small distortion
        distortionAmount = 0.015;
    } else if(connType == 1 || connType == 2) {
    // Middle to outer circle - Moderate distortion
        distortionAmount = 0.02;
    } else if(connType == 4) {
    // Outer circle connections - Maximum distortion
        distortionAmount = 0.025;
    } else if(connType == 5) {
    // Same-chain connections - Special visual (added for 3D visualization)
        distortionAmount = 0.01;
    } else {
    // Default
        distortionAmount = 0.02;
    }

  // Use the same frequency values as the original
    float lowFreq = 5.0;
    float highFreq = 20.0;

  // Generate noise following original implementation
    float noise1 = noise(vec2(normAlong * lowFreq + time * 0.5, seed * 10.0)) * 2.0 - 1.0;
    float noise2 = noise(vec2(normAlong * highFreq - time * 0.7, seed * 5.0)) * 2.0 - 1.0;

  // Combine noise layers with same weighting as original
    float combinedNoise = noise1 * 0.7 + noise2 * 0.3;

  // Calculate distorted distance - the key effect
    float distortedDist = abs(perpLine - distortionAmount * combinedNoise);

  // Arc thickness calculation - matching original
    float arcWidth = 0.3; // Base thickness adjusted for TubeGeometry
    float thickness = arcWidth * (0.6 + 0.4 * noise(vec2(normAlong * 5.0, time * 0.3 + seed * 10.0)));

  // Main arc rendering - smoothstep creates the hard edge
    float mainArc = smoothstep(thickness, thickness * 0.3, distortedDist);

  // Glow effect - same equation structure as original
    float glow = 0.2 / (1.0 + 15.0 * distortedDist * distortedDist);

  // Apply flicker effect with same speeds
    float flickerSpeed = 3.0;
    float flickerAmount;

  // Determine flicker amount based on connection type - matches original
    if(connType == 3) {
        flickerAmount = 0.2; // Inner circle - less flicker
    } else if(connType == 0) {
        flickerAmount = 0.25;
    } else if(connType == 1 || connType == 2) {
        flickerAmount = 0.3;
    } else if(connType == 5) {
        flickerAmount = 0.15; // Added for same-chain connections
    } else {
        flickerAmount = 0.35; // Outer circle - more flicker
    }

    float flicker = (1.0 - flickerAmount) + flickerAmount * sin(time * (flickerSpeed + seed * 3.0) + normAlong * 4.0);
    float arcIntensity = mainArc * flicker * 1.2 + glow * 0.9;

  // Final color calculation with same color variations as original
    vec3 arcColor = color + 0.2 * sin(vec3(3.0, 1.0, 2.0) * (time * 0.5 + normAlong * 3.0));
    vec3 finalColor = arcColor * arcIntensity;

  // Spark effect - same thresholds as original
    float sparkThreshold = 0.9;

    if(noise(vec2(time * 5.0 + seed * 15.0, normAlong * 10.0)) > sparkThreshold) {
    // Matches original spark size and brightness calculations
        float sparkSize = (connType == 4) ? 25.0 : 20.0;
        float sparkDist = length(vec2(normAlong - noise(vec2(time * 1.5, seed)) * 0.08, perpLine) * sparkSize);
        float sparkBrightness = (connType == 4) ? 1.2 : 0.7;
        float spark = sparkBrightness / (1.0 + sparkDist * sparkDist);
        finalColor += arcColor * spark;
    }

  // Alpha value - same as original
    float alpha = min(arcIntensity * 0.8, 1.0);

  // Special handling for same-chain connections (for 3D visualization)
    if(connType == 5) {
    // Make same-chain connections more tube-like and distinct
        float pulseEffect = 0.7 + 0.3 * sin(time * 2.0 + normAlong * 10.0);
        finalColor = mix(finalColor, color * 1.5, 0.3) * pulseEffect;
        alpha = min(alpha * 1.2, 1.0);
    }

    gl_FragColor = vec4(finalColor, alpha);
}
