varying float vAlpha;
varying vec3 vColor;
varying float vTrailPosition;

void main() {
    // Create circular particle shape
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    // Discard pixels outside circle
    if(dist > 0.5) discard;

    // Create soft particle edge
    float edge = 1.0 - smoothstep(0.3, 0.5, dist);
    
    // Core brightness based on trail position
    float coreBrightness = mix(0.4, 1.0, vTrailPosition);
    
    // Create bright core for leading particles
    float core = 1.0 - smoothstep(0.0, 0.2, dist);
    core = pow(core, 2.0) * coreBrightness;
    
    // Combine edge and core
    float finalStrength = edge + core;
    finalStrength = min(finalStrength, 1.0);
    
    // Apply color with slight intensity boost for trail head
    vec3 finalColor = vColor * (0.8 + 0.4 * vTrailPosition);
    float finalAlpha = vAlpha * finalStrength;

    // Ensure alpha is within valid range
    finalAlpha = clamp(finalAlpha, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, finalAlpha);
}