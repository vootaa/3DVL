uniform float time;
uniform vec3 color;
uniform float nodeSize;
uniform int chainId;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

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

// Matrix for rotations - exactly as in original
mat2 mm2(in float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

// Flow effect function - adapted from original
float flow(in vec2 p, in float t) {
    float z = 2.0;
    float rz = 0.0;
    vec2 bp = p;

    for(float i = 1.0; i < 3.0; i++) {
        p += time * 0.1;
        float n = noise(p * 4.0 + t * 0.8); // Lower frequency
        rz += (sin(n * 6.0) * 0.5 + 0.5) / z;
        p = mix(bp, p, 0.6);
        z *= 2.0;
        p *= 2.01;
        p = p * mm2(time * 0.04 * i);
    }
    return rz;
}

void main() {
  // Calculate distance from center (sphere surface point to center)
    float dist = length(vUv - 0.5) * 2.0;

  // Flow effect calculation for the plasma
    float flowEffect = flow(vUv * 15.0, time * 0.2 + float(chainId));
    float glowSize = 1.0 + 0.4 * sin(time * 2.0 + float(chainId));

  // Core and glow effect - similar to drawNode in original
    float core = smoothstep(1.0, 0.4, dist);
    float glow = smoothstep(glowSize, 1.0, dist) * 0.8 * flowEffect;

  // Mix node color with white based on flow effect
    vec3 nodeColor = mix(color, vec3(1.0), 0.3 + 0.3 * flowEffect);
    float alpha = max(core, glow * 0.8);
    vec3 finalColor = nodeColor * (core + glow * 1.2);

  // Apply lighting from normal
    float lighting = max(0.5, dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))));
    finalColor *= lighting;

    gl_FragColor = vec4(finalColor, alpha);
}
