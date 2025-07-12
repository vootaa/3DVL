varying float vAlpha;
varying vec3 vColor;
varying float vTrailPosition;

void main() {
    // Create circular particle shape
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    // Discard pixels outside circle
    if(dist > 0.5) discard;

    // Create soft particle edge with consistent brightness
    float edge = 1.0 - smoothstep(0.2, 0.5, dist);
    
    // Create bright core
    float core = 1.0 - smoothstep(0.0, 0.3, dist);
    core = pow(core, 1.5);
    
    // Combine edge and core for consistent brightness
    float finalStrength = edge + core * 0.5;
    finalStrength = min(finalStrength, 1.0);
    
    // Use the interpolated color from vertex shader
    vec3 finalColor = vColor;
    float finalAlpha = vAlpha * finalStrength;

    // Ensure alpha is within valid range
    finalAlpha = clamp(finalAlpha, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, finalAlpha);
}