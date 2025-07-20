export const tetherBridgeVertexShader = `
    uniform float uTime;
    uniform float uConnectionType;
    uniform float uLength;

    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vConnectionType;

    void main() {
        vUv = uv;
        vPosition = position;
        vConnectionType = uConnectionType;
        vNormal = normalize(normalMatrix * normal);
        
        // World position
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const tetherBridgeFragmentShader = `
    uniform float uTime;
    uniform float uConnectionType;
    uniform float uLength;

    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vConnectionType;

    // Orbit color definition
    vec3 getOrbitColor(float orbit) {
        if (orbit < 0.5) {
            return vec3(0.2, 0.8, 1.0); // Inner orbit: cyan-blue
        } else if (orbit < 1.5) {
            return vec3(0.2, 1.0, 0.4); // Middle orbit: green
        } else {
            return vec3(0.8, 0.3, 1.0); // Outer orbit: purple
        }
    }

    // Bidirectional flow effect
    vec3 createEnergyFlow(vec2 uv, float time, vec3 color1, vec3 color2) {
        // Upper half: forward flow
        if (uv.y > 0.5) {
            float flow = sin(uv.x * 8.0 - time * 4.0) * 0.5 + 0.5;
            float intensity = 0.8 + 0.4 * flow;
            return color1 * intensity;
        } 
        // Lower half: reverse flow
        else {
            float flow = sin(uv.x * 8.0 + time * 4.0) * 0.5 + 0.5;
            float intensity = 0.8 + 0.4 * flow;
            return color2 * intensity;
        }
    }

    void main() {
        vec3 baseColor;
        
        // Determine color based on connection type
        if (vConnectionType < 0.5) {
            // Same orbit connection: use single color
            vec3 orbitColor = getOrbitColor(vConnectionType);
            baseColor = createEnergyFlow(vUv, uTime, orbitColor, orbitColor);
        } else {
            // Cross-orbit connection: gradient color
            vec3 fromColor, toColor;
            if (vConnectionType < 1.5) {
                // Inner → Middle
                fromColor = getOrbitColor(0.0); // Inner orbit color
                toColor = getOrbitColor(1.0);   // Middle orbit color
            } else {
                // Middle → Outer
                fromColor = getOrbitColor(1.0); // Middle orbit color
                toColor = getOrbitColor(2.0);   // Outer orbit color
            }
            baseColor = createEnergyFlow(vUv, uTime, fromColor, toColor);
        }

        // Edge glow effect
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = 1.0 - abs(dot(normalize(vNormal), viewDirection));
        fresnel = pow(fresnel, 1.5);
        
        // Add edge light
        baseColor += baseColor * fresnel * 0.3;

        // Overall pulse effect
        float pulse = 0.85 + 0.15 * sin(uTime * 2.0 + vWorldPosition.x * 0.1);
        baseColor *= pulse;

        // Transparency: more opaque at center, more transparent at edge
        float alpha = 0.7 + 0.3 * (1.0 - fresnel);

        gl_FragColor = vec4(baseColor, alpha);
    }
`;