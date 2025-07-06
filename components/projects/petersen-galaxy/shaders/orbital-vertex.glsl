uniform float uSize;
uniform float uTime;
uniform float uEvolutionProgress;
uniform float uBaseRotationSpeed;

attribute float aScale;
attribute vec3 aRandomness;
attribute float aOrbitFactor;
attribute float aTargetRadius;

varying vec3 vColor;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float smoothProgress = smoothstep(0.0, 1.0, uEvolutionProgress);
    float orbitInfluence = aOrbitFactor * smoothProgress;
    
    if (aOrbitFactor > 0.5) {
        float distanceToCenter = length(modelPosition.xz);
        float angle = atan(modelPosition.x, modelPosition.z);
        float radiusProgress = smoothstep(0.0, 1.0, orbitInfluence);
        float currentRadius = mix(distanceToCenter, aTargetRadius, radiusProgress);
        float baseSpeed = uBaseRotationSpeed;
        float randomSeed = aTargetRadius * 123.456 + angle * 789.012;
        float oscillation = sin(uTime * 0.8 + randomSeed) * 0.025;// ±2.5%
        float finalSpeed = baseSpeed * (1.0 + oscillation);
        float angleOffset = finalSpeed * uTime * orbitInfluence;
        angle += angleOffset;
        vec3 orbitalPosition = vec3(
            currentRadius * cos(angle),
            modelPosition.y * (1.0 - orbitInfluence * 0.985),
            currentRadius * sin(angle)
        );
        modelPosition.xyz = mix(modelPosition.xyz, orbitalPosition, radiusProgress);
    } else {
        float distanceToCenter = length(modelPosition.xz);
        float angle = atan(modelPosition.x, modelPosition.z);
        float nearestOrbitSpeed = uBaseRotationSpeed;
        float randomSeed = distanceToCenter * 456.789 + angle * 321.654;
        float oscillation = sin(uTime * 0.8 + randomSeed) * 0.025;
        nearestOrbitSpeed *= (1.0 + oscillation);
        float delayFactor = 0.7;
        float syncedRotation = nearestOrbitSpeed * uTime * delayFactor;
        float timeVariation = uTime * 0.3;
        float xDisturbance = sin(timeVariation + distanceToCenter * 2.0) * 0.23;
        float zDisturbance = cos(timeVariation + angle * 3.0) * 0.23;
        float yDisturbance = sin(timeVariation * 1.5 + distanceToCenter) * 0.12;
        angle += syncedRotation;
        modelPosition.x = distanceToCenter * cos(angle) + xDisturbance;
        modelPosition.z = distanceToCenter * sin(angle) + zDisturbance;
        modelPosition.y += yDisturbance;
    }
    
    float randomnessStrength = mix(1.0, 0.03, smoothstep(0.0, 1.0, orbitInfluence));
    modelPosition.xyz += aRandomness * randomnessStrength;

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    gl_PointSize = uSize * aScale;
    gl_PointSize *= (1.0 / -viewPosition.z);

    vColor = color;
}

         
             
      

        
      

        

      

