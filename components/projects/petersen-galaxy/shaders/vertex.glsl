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
        
        // Different rotation speeds for different orbits
        float angleOffset = aRotationSpeed * uTime * orbitInfluence;
        angle += angleOffset;
        
        // Calculate orbital position
        vec3 orbitalPosition = vec3(
            currentRadius * cos(angle),
            modelPosition.y * (1.0 - orbitInfluence * 0.98), // Almost completely flatten
            currentRadius * sin(angle)
        );
        
        // Smooth transition from chaos to order
        modelPosition.xyz = mix(modelPosition.xyz, orbitalPosition, radiusProgress);
    } else {
        // For scattered particles - add subtle movement without forming orbits
        float distanceToCenter = length(modelPosition.xz);
        float angle = atan(modelPosition.x, modelPosition.z);
        
        // Very slow, random-like rotation
        float scatteredRotation = sin(uTime * 0.1 + distanceToCenter * 0.5) * 0.02;
        angle += scatteredRotation;
        
        // Slight radial breathing effect
        float breathing = sin(uTime * 0.3 + angle * 2.0) * 0.05;
        distanceToCenter *= (1.0 + breathing);
        
        // Apply subtle movement
        modelPosition.x = distanceToCenter * cos(angle);
        modelPosition.z = distanceToCenter * sin(angle);
        
        // Gentle vertical oscillation
        modelPosition.y += sin(uTime * 0.2 + distanceToCenter) * 0.1;
    }
    
    // Reduced randomness for cleaner ring appearance
    float randomnessStrength = mix(1.0, 0.05, smoothstep(0.0, 1.0, orbitInfluence));
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
