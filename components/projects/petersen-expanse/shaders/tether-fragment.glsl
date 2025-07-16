varying float vAlpha;
varying vec3 vColor;
varying float vTrailPosition;

uniform float uTime;

void main() {
    // Create circular particle shape
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    // Discard pixels outside circle
    if(dist > 0.5) discard;
    // --- Multi-layer Glow ---
    float core = 1.0 - smoothstep(0.0, 0.18, dist);
    core = pow(core, 2.5);

    float innerHalo = 1.0 - smoothstep(0.13, 0.32, dist);
    innerHalo = pow(innerHalo, 1.7) * 0.7;

    float outerHalo = 1.0 - smoothstep(0.28, 0.5, dist);
    outerHalo = pow(outerHalo, 1.2) * 0.35;

    float finalStrength = core + innerHalo + outerHalo;
    finalStrength = min(finalStrength, 1.0);

    // --- Dynamic color temperature change (energy flow effect) ---
    vec3 color = vColor;
    color.r *= 1.0 + 0.04 * sin(vTrailPosition * 6.0 + uTime * 1.2);
    color.g *= 1.0 + 0.04 * cos(vTrailPosition * 7.0 + uTime * 1.5);
    color.b *= 1.0 + 0.04 * sin(vTrailPosition * 4.0 - uTime * 1.1);

    // --- Breathing/pulse animation ---
    float pulse = 0.97 + 0.03 * sin(uTime * 2.0 + vTrailPosition * 8.0);

    // --- Energy flow direction (brighter at the head) ---
    float headBoost = mix(1.0, 1.25, vTrailPosition);

    vec3 finalColor = color * finalStrength * headBoost;
    float finalAlpha = vAlpha * finalStrength * pulse;

    // Clamp alpha
    finalAlpha = clamp(finalAlpha, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, finalAlpha);
}