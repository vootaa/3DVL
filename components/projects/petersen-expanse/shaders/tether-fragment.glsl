uniform float uGlowIntensity;

varying float vAlpha;
varying vec3 vColor;
varying float vFlow;

void main() {
    // Create circular particle shape
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    // Discard pixels outside circle
    if(dist > 0.5) discard;

    // Create soft glow effect
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    glow = pow(glow, 1.5);

    // Apply flow effect for brightness variation
    float brightness = uGlowIntensity * (0.7 + 0.3 * vFlow);

    // Final color and alpha
    vec3 finalColor = vColor * brightness;
    float finalAlpha = vAlpha * glow;

    // Ensure alpha is within valid range
    finalAlpha = clamp(finalAlpha, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, finalAlpha);
}