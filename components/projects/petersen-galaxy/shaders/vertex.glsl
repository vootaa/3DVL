uniform float uSize;
uniform float uTime;

attribute float aScale;
attribute vec3 aRandomness;
attribute float aOrbitFactor;
attribute float aTargetRadius;

varying vec3 vColor;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Evolution progress (very slow transition for dramatic effect)
    float timeProgress = min(uTime * 0.05, 1.0);
    float smoothProgress = smoothstep(0.0, 1.0, timeProgress);
    float orbitInfluence = aOrbitFactor * smoothProgress;
    
    if (aOrbitFactor > 0.5) {
        // For orbital particles
        float distanceToCenter = length(modelPosition.xz);
        float angle = atan(modelPosition.x, modelPosition.z);
        
        // Gradually move to target orbit radius with easing
        float radiusProgress = smoothstep(0.0, 1.0, orbitInfluence);
        float currentRadius = mix(distanceToCenter, aTargetRadius, radiusProgress);
        
        // Orbital rotation speed (inner orbits faster, more realistic)
        float rotationSpeed = (1.5 / (aTargetRadius + 0.5)) * 0.4;
        float angleOffset = rotationSpeed * uTime * orbitInfluence;
        angle += angleOffset;
        
        // Calculate orbital position
        vec3 orbitalPosition = vec3(
            currentRadius * cos(angle),
            modelPosition.y * (1.0 - orbitInfluence * 0.95), // Almost completely flatten
            currentRadius * sin(angle)
        );
        
        // Smooth transition from chaos to order
        modelPosition.xyz = mix(modelPosition.xyz, orbitalPosition, radiusProgress);
        
        // Add some orbital wobble for natural effect
        float wobble = sin(uTime * 2.0 + angle * 5.0) * 0.1 * (1.0 - orbitInfluence * 0.8);
        modelPosition.y += wobble;
    }
    
    // Add randomness (dramatically reduces over time for orbital particles)
    float randomnessStrength = mix(1.0, 0.1, smoothstep(0.0, 1.0, orbitInfluence));
    modelPosition.xyz += aRandomness * randomnessStrength;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    gl_PointSize = uSize * aScale;

    // Enhanced size attenuation for better 3D effect
    gl_PointSize *= (1.0 / -viewPosition.z);

    // Color
    vColor = color;
}
