export const orbitalRingsVertexShader = `
    uniform float uTime;
    uniform float uRingType;
    uniform float uRadius;
    uniform float uWidth;
    uniform float uEnergyIntensity;

    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vRingType;

    void main() {
        vUv = uv;
        vRingType = uRingType;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        
        // World position
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const orbitalRingsFragmentShader = `
    uniform float uTime;
    uniform float uRingType;
    uniform float uRadius;
    uniform float uWidth;
    uniform float uEnergyIntensity;

    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vRingType;

    // Rainbow color generation
    vec3 getRainbowColor(float t) {
        t = mod(t, 1.0);
        
        vec3 color;
        if (t < 0.16667) {
            color = mix(vec3(0.6, 0.0, 0.0), vec3(0.6, 0.3, 0.0), t * 6.0);
        } else if (t < 0.33333) {
            color = mix(vec3(0.6, 0.3, 0.0), vec3(0.6, 0.6, 0.0), (t - 0.16667) * 6.0);
        } else if (t < 0.5) {
            color = mix(vec3(0.6, 0.6, 0.0), vec3(0.0, 0.6, 0.0), (t - 0.33333) * 6.0);
        } else if (t < 0.66667) {
           color = mix(vec3(0.0, 0.6, 0.0), vec3(0.0, 0.6, 0.6), (t - 0.5) * 6.0);
        } else if (t < 0.83333) {
            color = mix(vec3(0.0, 0.6, 0.6), vec3(0.0, 0.0, 0.6), (t - 0.66667) * 6.0);
        } else {
           color = mix(vec3(0.0, 0.0, 0.6), vec3(0.6, 0.0, 0.6), (t - 0.83333) * 6.0);
        }
        
        return color;
    }

    void main() {
        // Different color speed for each ring
        float colorSpeed = vRingType < 0.5 ? 0.3 : vRingType < 1.5 ? 0.25 : 0.2;

        // Different color offset for each ring, so they show different initial colors
        float colorOffset = vRingType * 0.33333; // Each ring differs by 1/3 of the rainbow cycle

        // Calculate the color phase for the current ring (only based on time, not position)
        float colorPhase = uTime * colorSpeed + colorOffset;

        // Get the unified color for the whole ring
        vec3 ringColor = getRainbowColor(colorPhase);

        // Add a sense of volume based on geometry (does not affect color phase)
        // Use UV coordinates or normal direction to calculate the tube's 3D effect
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = 1.0 - abs(dot(normalize(vNormal), viewDirection));
        fresnel = pow(fresnel, 2.0);

        // Brightness difference between inside and outside of the tube (based on UV, not color phase)
        float brightness = 0.55 + 0.1 * sin(vUv.y * 3.14159);

        // Apply brightness
        vec3 finalColor = ringColor * brightness;

        // Add edge glow 
        finalColor += ringColor * fresnel * 0.15;

        // Apply energy intensity
        finalColor *= uEnergyIntensity;

        // Slight pulse effect
        float pulse = 0.75 + 0.07 * sin(uTime * 3.0 + vRingType * 2.0);
        finalColor *= pulse;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;