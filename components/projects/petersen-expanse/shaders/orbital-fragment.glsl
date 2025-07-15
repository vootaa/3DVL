uniform float uEvolutionProgress;
uniform float uTime;

varying vec3 vColor;

// Simple 2D noise function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main()
{
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);

    // Multi-layer halo
    float core = 1.0 - smoothstep(0.0, 0.13, dist);
    core = pow(core, 6.0);

    float innerHalo = 1.0 - smoothstep(0.13, 0.23, dist);
    innerHalo = pow(innerHalo, 2.5);

    float outerHalo = 1.0 - smoothstep(0.23, 0.5, dist);
    outerHalo = pow(outerHalo, 1.2);

    // Noise perturbation
    float t = uTime * 0.7;
    float n = noise(uv * 12.0 + t) * 0.5 + 0.5;
    float flicker = 0.92 + n * 0.08;

    // Composite strength
    float finalStrength = core * 0.85 + innerHalo * 0.35 + outerHalo * 0.18;
    finalStrength *= flicker;

    // Evolution progress affects opacity
    finalStrength *= mix(0.18, 1.0, sqrt(uEvolutionProgress));

    // Color enhancement
    vec3 color = vColor * (1.0 + finalStrength * 2.2);

    gl_FragColor = vec4(color, finalStrength);

    // Discard edge
    if (finalStrength < 0.02) discard;
}
