export const energyShieldVertexShader = `
    varying vec3 vPosition;
    varying float vHeightNorm;
    varying float vEdgeFactor;
    varying float vDistanceFromCenter;

    void main() {
        vPosition = position;
        vDistanceFromCenter = length(position.xz);
        vHeightNorm = clamp(position.y / 100.0, 0.0, 1.0); // 100.0 can be passed as a uniform
        vEdgeFactor = smoothstep(0.7, 1.0, vDistanceFromCenter / 100.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const energyShieldFragmentShader = `
    uniform float uTime;
    uniform float uDomeRadius;
    uniform float uIntensity;
    uniform float uEdgeGlow;
    uniform float uPulseSpeed;
    uniform float uNoiseScale;
    uniform vec3 uBaseColor;
    uniform vec3 uEdgeColor;
    uniform vec3 uPulseColor;

    varying vec3 vPosition;
    varying float vHeightNorm;
    varying float vEdgeFactor;
    varying float vDistanceFromCenter;

    // Classic noise
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
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        // Gradient color
        vec3 color = mix(uBaseColor, uEdgeColor, vEdgeFactor);

        // Energy flow noise
        float energy = fbm(vPosition.xz * uNoiseScale + uTime * 0.2);
        color += energy * 0.25;

        // Dynamic pulse ring
        float pulse = sin(uTime * uPulseSpeed + vDistanceFromCenter * 0.25 - vHeightNorm * 6.0) * 0.5 + 0.5;
        color = mix(color, uPulseColor, pulse * 0.25);

        // Edge highlight
        float edgeGlow = pow(vEdgeFactor, 2.5) * uEdgeGlow;
        color += edgeGlow;

        // More transparent at the top
        float alpha = 0.35 + vEdgeFactor * 0.5;
        alpha *= 1.0 - vHeightNorm * 0.7;

        // Energy flicker
        float flicker = 0.85 + 0.15 * sin(uTime * 8.0 + vPosition.x * 0.1 + vPosition.z * 0.1);
        alpha *= flicker * uIntensity;

        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
    }
`;