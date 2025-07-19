export const orbitalRingsVertexShader = `
    uniform float uTime;
    uniform float uRingType;
    uniform float uRadius;
    uniform float uWidth;
    uniform float uHeight;
    uniform float uThickness;
    uniform float uEnergyIntensity;
    uniform float uInnerRadius;
    uniform float uOuterRadius;

    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vDistance;
    varying float vRingAngle;
    varying float vTubeAngle;
    varying float vRingType;
    varying float vEnergyFlow;

    // Noise function
    float noise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    }

    // Energy flow calculation
    float calculateEnergyFlow(vec3 pos, float time, float ringType) {
        float ringRadius = length(pos.xz);
        float angle = atan(pos.z, pos.x);
        
        // Energy flow speed for different rings
        float flowSpeed = ringType < 0.5 ? 3.0 : ringType < 1.5 ? 2.0 : 1.5;
        
        // Main energy wave
        float mainWave = sin(angle * 4.0 - time * flowSpeed) * 0.5 + 0.5;
        
        // Secondary fluctuation
        float subWave = sin(angle * 8.0 + time * flowSpeed * 0.7) * 0.3;
        
        // Pulse effect
        float pulse = sin(time * 2.0 + ringType * 2.0) * 0.2 + 0.8;
        
        return (mainWave + subWave) * pulse;
    }

    void main() {
        vUv = uv;
        vRingType = uRingType;
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;
        
        // Calculate ring angle and tube angle
        vRingAngle = atan(pos.z, pos.x);
        
        // For torus geometry, calculate the tube's angular position
        float tubeRadius = length(pos.yz);
        vTubeAngle = atan(pos.y, length(pos.xz) - uRadius);
        
        // Calculate energy flow
        vEnergyFlow = calculateEnergyFlow(pos, uTime, uRingType);
        
        // Enhanced deformation effect for rainbow bands
        float energyDisplacement = vEnergyFlow * 0.03; // Reduce deformation intensity
        
        // Displacement along the normal direction
        pos += normal * energyDisplacement;
        
        // Add rainbow wave effect
        float waveEffect = sin(vRingAngle * 8.0 - uTime * 3.0) * 0.01; // Reduce wave intensity
        pos += normal * waveEffect;
        
        vPosition = pos;
        
        // World position
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;
        
        // Distance to center
        vDistance = length(vWorldPosition.xz);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

export const orbitalRingsFragmentShader = `
    uniform float uTime;
    uniform float uRingType;
    uniform float uRadius;
    uniform float uWidth;
    uniform float uHeight;
    uniform float uThickness;
    uniform float uEnergyIntensity;
    uniform float uInnerRadius;
    uniform float uOuterRadius;

    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vDistance;
    varying float vRingAngle;
    varying float vTubeAngle;
    varying float vRingType;
    varying float vEnergyFlow;

    // Noise function
    float noise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    }

    // Smooth noise
    float smoothNoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float n000 = noise(i);
        float n001 = noise(i + vec3(0, 0, 1));
        float n010 = noise(i + vec3(0, 1, 0));
        float n011 = noise(i + vec3(0, 1, 1));
        float n100 = noise(i + vec3(1, 0, 0));
        float n101 = noise(i + vec3(1, 0, 1));
        float n110 = noise(i + vec3(1, 1, 0));
        float n111 = noise(i + vec3(1, 1, 1));
        
        float nx00 = mix(n000, n100, f.x);
        float nx01 = mix(n001, n101, f.x);
        float nx10 = mix(n010, n110, f.x);
        float nx11 = mix(n011, n111, f.x);
        
        float nxy0 = mix(nx00, nx10, f.y);
        float nxy1 = mix(nx01, nx11, f.y);
        
        return mix(nxy0, nxy1, f.z);
    }

    // Dark rainbow color generation
    vec3 getRainbowColor(float t) {
        t = mod(t, 1.0);
        
        vec3 color;
        if (t < 0.16667) {
            // Dark red to dark orange
            color = mix(vec3(0.8, 0.1, 0.1), vec3(0.8, 0.4, 0.1), t * 6.0);
        } else if (t < 0.33333) {
            // Dark orange to dark yellow
            color = mix(vec3(0.8, 0.4, 0.1), vec3(0.8, 0.8, 0.1), (t - 0.16667) * 6.0);
        } else if (t < 0.5) {
            // Dark yellow to dark green
            color = mix(vec3(0.8, 0.8, 0.1), vec3(0.1, 0.8, 0.1), (t - 0.33333) * 6.0);
        } else if (t < 0.66667) {
            // Dark green to dark cyan
            color = mix(vec3(0.1, 0.8, 0.1), vec3(0.1, 0.8, 0.8), (t - 0.5) * 6.0);
        } else if (t < 0.83333) {
            // Dark cyan to dark blue
            color = mix(vec3(0.1, 0.8, 0.8), vec3(0.1, 0.1, 0.8), (t - 0.66667) * 6.0);
        } else {
            // Dark blue to dark purple
            color = mix(vec3(0.1, 0.1, 0.8), vec3(0.8, 0.1, 0.8), (t - 0.83333) * 6.0);
        }
        
        return color;
    }

    void main() {
        // Generate rainbow color based on ring position
        float rainbowT = vRingAngle / (2.0 * 3.14159) + uTime * 0.5;
        rainbowT += vTubeAngle * 2.0; // Tubular variation
        
        // Get base rainbow color
        vec3 baseColor = getRainbowColor(rainbowT);
        
        // Energy flow effect
        float energyPattern = vEnergyFlow;
        energyPattern *= sin(vTubeAngle * 6.0 - uTime * 3.0) * 0.5 + 0.5;
        
        // Add noise detail
        float noiseDetail = smoothNoise(vPosition * 2.0 + uTime * 0.3) * 0.3;
        energyPattern += noiseDetail;
        
        // Energy enhanced color
        vec3 energyColor = getRainbowColor(rainbowT + energyPattern * 0.2);
        
        // Mix base and energy color
        vec3 finalColor = mix(baseColor, energyColor, 0.7);
        
        // Edge glow
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = 1.0 - abs(dot(normalize(vNormal), viewDirection));
        fresnel = pow(fresnel, 2.0);
        
        finalColor += getRainbowColor(rainbowT + uTime) * fresnel * 0.3;
        
        // Pulse effect
        float pulse = sin(uTime * 3.0 + vRingType * 2.0) * 0.1 + 0.9;
        finalColor *= pulse;
        
        // Apply energy intensity
        finalColor *= uEnergyIntensity;
        
        // Clamp color to avoid over-brightness
        finalColor = clamp(finalColor, 0.0, 1.0);
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;