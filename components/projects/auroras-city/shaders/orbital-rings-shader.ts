export const orbitalRingsVertexShader = `
    uniform float uTime;
    uniform float uRingType;
    uniform float uRadius;
    uniform float uWidth;
    uniform float uThickness;
    uniform float uEnergyIntensity;

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
        
        // Deformation effect based on energy flow
        float energyDisplacement = vEnergyFlow * 0.05;
        
        // Displacement along the normal direction
        pos += normal * energyDisplacement;
        
        // Add subtle wave effect
        float waveEffect = sin(vRingAngle * 6.0 - uTime * 2.0) * 0.02;
        pos += normal * waveEffect;
        
        vPosition = pos;
        
        // World position
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;
        
        // Distance to center
        vDistance = length(vWorldPosition.xz);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`

export const orbitalRingsFragmentShader = `
    uniform float uTime;
    uniform float uRingType;
    uniform float uRadius;
    uniform float uWidth;
    uniform float uThickness;
    uniform float uEnergyIntensity;

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

    // Energy texture generation
    vec3 generateEnergyTexture(vec3 pos, float time, float ringType) {
        vec3 baseColor;
        vec3 energyColor;
        
        if (ringType < 0.5) { // Inner ring - high energy cyan
            baseColor = vec3(0.05, 0.1, 0.15);
            energyColor = vec3(0.0, 1.2, 1.0);
        } else if (ringType < 1.5) { // Middle ring - purple energy
            baseColor = vec3(0.1, 0.05, 0.15);
            energyColor = vec3(0.8, 0.2, 1.2);
        } else { // Outer ring - red crystal energy
            baseColor = vec3(0.15, 0.05, 0.05);
            energyColor = vec3(1.2, 0.3, 0.5);
        }
        
        // Energy stripes on the tube surface
        float tubeStripes = sin(vTubeAngle * 8.0 - time * 3.0) * 0.5 + 0.5;
        
        // Ring energy flow
        float ringFlow = sin(vRingAngle * 6.0 - time * 4.0) * 0.5 + 0.5;
        
        // Combined energy pattern
        float energyPattern = vEnergyFlow * tubeStripes * ringFlow;
        
        // Add noise detail
        float noiseDetail = smoothNoise(pos * 2.0 + time * 0.5) * 0.3;
        energyPattern += noiseDetail;
        
        return mix(baseColor, energyColor, energyPattern * uEnergyIntensity);
    }

    void main() {
        // Generate energy texture
        vec3 energyColor = generateEnergyTexture(vPosition, uTime, vRingType);
        
        // Edge glow based on normal
        float fresnel = 1.0 - abs(dot(normalize(vNormal), vec3(0, 0, 1)));
        fresnel = pow(fresnel, 2.0);
        
        // Enhance edge glow
        energyColor += energyColor * fresnel * 0.5;
        
        // Pulse effect
        float pulse = sin(uTime * 3.0 + vRingType * 2.0) * 0.1 + 0.9;
        energyColor *= pulse;
        
        // Extra brightness from energy flow
        energyColor += vec3(0.2, 0.4, 1.0) * vEnergyFlow * 0.3;
        
        // Distance attenuation (atmospheric scattering)
        float atmosphericDistance = length(vWorldPosition);
        float scattering = exp(-atmosphericDistance * 0.001);
        vec3 atmosphereColor = vec3(0.3, 0.5, 0.8);
        energyColor = mix(atmosphereColor * 0.1, energyColor, scattering);
        
        // Alpha calculation
        float alpha = uEnergyIntensity * 0.9;
        alpha *= (0.7 + vEnergyFlow * 0.3); // Alpha variation based on energy flow
        alpha *= pulse; // Pulse alpha
        
        gl_FragColor = vec4(energyColor, alpha);
    }
`