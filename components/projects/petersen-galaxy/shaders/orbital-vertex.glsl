uniform float uSize;
uniform float uTime;

attribute float aScale;
attribute vec3 aRandomness;
attribute float aOrbitFactor;
attribute float aTargetRadius;
attribute float aRotationSpeed;

varying vec3 vColor;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Evolution progress (faster transition for clear demonstration)
    float timeProgress = min(uTime * 0.15, 1.0);
    float smoothProgress = smoothstep(0.0, 1.0, timeProgress);
    float orbitInfluence = aOrbitFactor * smoothProgress;
    
    if (aOrbitFactor > 0.5) {
        // For orbital particles
        float distanceToCenter = length(modelPosition.xz);
        float angle = atan(modelPosition.x, modelPosition.z);
        
        // Gradually move to target orbit radius
        float radiusProgress = smoothstep(0.0, 1.0, orbitInfluence);
        float currentRadius = mix(distanceToCenter, aTargetRadius, radiusProgress);
        
        // Uniform base rotation speed with random oscillations (±2.5%)
        float baseSpeed = aRotationSpeed;
        float randomSeed = aTargetRadius * 123.456 + angle * 789.012; // Unique seed per particle
        float oscillation = sin(uTime * 0.8 + randomSeed) * 0.025; // ±2.5% oscillation
        float finalSpeed = baseSpeed * (1.0 + oscillation);
        
        float angleOffset = finalSpeed * uTime * orbitInfluence;
        angle += angleOffset;
        
        // Calculate orbital position
        vec3 orbitalPosition = vec3(
            currentRadius * cos(angle),
            modelPosition.y * (1.0 - orbitInfluence * 0.99), // Almost completely flatten to thin disk
            currentRadius * sin(angle)
        );
        
        // Smooth transition from chaos to order
        modelPosition.xyz = mix(modelPosition.xyz, orbitalPosition, radiusProgress);
    } else {
        // For scattered particles - synchronized rotation with slight delay and disturbances
        float distanceToCenter = length(modelPosition.xz);
        float angle = atan(modelPosition.x, modelPosition.z);
        
        // Determine which orbit this particle is near and sync rotation with delay
        float nearestOrbitSpeed = 0.240; // Same base speed for all orbits
        if (distanceToCenter < 2.25) { // Between inner and middle
            nearestOrbitSpeed = 0.240; // Same base speed
        } else if (distanceToCenter < 3.9) { // Between middle and outer
            nearestOrbitSpeed = 0.240; // Same base speed
        }
        
        // Add same random oscillations as orbital particles
        float randomSeed = distanceToCenter * 456.789 + angle * 321.654;
        float oscillation = sin(uTime * 0.8 + randomSeed) * 0.025; // ±2.5% oscillation
        nearestOrbitSpeed *= (1.0 + oscillation);
        
        // Synchronized rotation with delay (gravitational attraction effect)
        float delayFactor = 0.7; // 70% of orbital speed
        float syncedRotation = nearestOrbitSpeed * uTime * delayFactor;
        
        // Add random disturbances in all directions
        float timeVariation = uTime * 0.3;
        float xDisturbance = sin(timeVariation + distanceToCenter * 2.0) * 0.15;
        float zDisturbance = cos(timeVariation + angle * 3.0) * 0.15;
        float yDisturbance = sin(timeVariation * 1.5 + distanceToCenter) * 0.08;
        
        // Apply synchronized rotation
        angle += syncedRotation;
        
        // Apply movement with disturbances
        modelPosition.x = distanceToCenter * cos(angle) + xDisturbance;
        modelPosition.z = distanceToCenter * sin(angle) + zDisturbance;
        modelPosition.y += yDisturbance;
    }
    
    // Very reduced randomness for precise ring formation
    float randomnessStrength = mix(1.0, 0.02, smoothstep(0.0, 1.0, orbitInfluence));
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
