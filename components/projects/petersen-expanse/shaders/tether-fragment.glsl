uniform float uGlowIntensity;

varying float vAlpha;
varying vec3 vColor;
varying float vFlow;

void main() {
        // Circular particle shape
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    if(dist > 0.5)
        discard;

        // Soft glow effect
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    glow = pow(glow, 2.0);

        // Flow effect adds brightness variation
    float brightness = uGlowIntensity * (0.8 + 0.2 * vFlow);

    vec3 finalColor = vColor * brightness;
    float finalAlpha = vAlpha * glow;

    gl_FragColor = vec4(finalColor, finalAlpha);
}