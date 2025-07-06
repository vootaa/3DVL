uniform float uTime;
uniform float uEvolutionProgress;
uniform float uParticleSize;
uniform float uBaseRotationSpeed;

// Orbit configuration
uniform float uOrbitParticleRatio;
uniform float uInnerRadius;
uniform float uMiddleRadius;
uniform float uOuterRadius;
uniform float uMaxSpaceRadius;

// Orbit distribution
uniform float uOrbitDistributionInner;
uniform float uOrbitDistributionMiddle;

// Color configuration
uniform vec3 uInnerRingColor;
uniform vec3 uMiddleRingColor;
uniform vec3 uOuterRingColor;
uniform vec3 uScatteredInnerColor;
uniform vec3 uScatteredMiddleColor;
uniform vec3 uScatteredOuterColor;

// Brightness configuration
uniform float uBrightnessInner;
uniform float uBrightnessMiddle;
uniform float uBrightnessOuter;
uniform float uBrightnessScattered;

attribute float aParticleId;

varying vec3 vColor;

// Pseudo-random functions
float random(float seed) {
    return fract(sin(seed * 12.9898) * 43758.5453);
}

float random2(float seed) {
    return fract(sin(seed * 78.233) * 23421.1234);
}

float random3(float seed) {
    return fract(sin(seed * 45.123) * 67890.5678);
}

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    // Generate random numbers based on particle ID
    float particleRandom = random(aParticleId);
    float particleRandom2 = random2(aParticleId);
    float particleRandom3 = random3(aParticleId);
    
    // Determine if this is an orbital particle
    bool isOrbital = particleRandom < uOrbitParticleRatio;
    float orbitFactor = isOrbital ? 1.0 : 0.0;
    
    // Calculate target radius and color
    float targetRadius = 0.0;
    vec3 particleColor = vec3(1.0);
    float scale = 1.0;
    
    if (isOrbital) {
        float orbitChoice = random2(aParticleId + 100.0);
        
        if (orbitChoice < uOrbitDistributionInner) {
            // Inner orbit
            targetRadius = uInnerRadius;
            particleColor = uInnerRingColor * uBrightnessInner;
            scale = 0.9 + random3(aParticleId + 200.0) * 0.45;
        } else if (orbitChoice < uOrbitDistributionInner + uOrbitDistributionMiddle) {
            // Middle orbit
            targetRadius = uMiddleRadius;
            particleColor = uMiddleRingColor * uBrightnessMiddle;
            scale = 0.75 + random3(aParticleId + 300.0) * 0.45;
        } else {
            // Outer orbit
            targetRadius = uOuterRadius;
            particleColor = uOuterRingColor * uBrightnessOuter;
            scale = 0.6 + random3(aParticleId + 400.0) * 0.3;
        }
    } else {
        // Scattered particle
        float distributionChoice = random2(aParticleId + 500.0);
        
        if (distributionChoice < 0.4) {
            particleColor = uScatteredInnerColor;
        } else if (distributionChoice < 0.7) {
            particleColor = uScatteredMiddleColor;
        } else {
            particleColor = uScatteredOuterColor;
        }
        
        float brightnessVariation = 0.8 + random3(aParticleId + 600.0) * 0.4;
        particleColor *= uBrightnessScattered * brightnessVariation;
        scale = 1.35 + random3(aParticleId + 700.0) * 0.75;
    }
    
    // Calculate orbital motion
    float smoothProgress = smoothstep(0.0, 1.0, uEvolutionProgress);
    float orbitInfluence = orbitFactor * smoothProgress;
    
    if (orbitFactor > 0.5) {
        float distanceToCenter = length(modelPosition.xz);
        float angle = atan(modelPosition.x, modelPosition.z);
        float radiusProgress = smoothstep(0.0, 1.0, orbitInfluence);
        float currentRadius = mix(distanceToCenter, targetRadius, radiusProgress);
        
        float baseSpeed = uBaseRotationSpeed;
        float randomSeed = targetRadius * 123.456 + angle * 789.012;
        float oscillation = sin(uTime * 0.8 + randomSeed) * 0.025;
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
    
    // Calculate random disturbance
    float randomnessStrength = mix(1.0, 0.03, smoothstep(0.0, 1.0, orbitInfluence));
    float randomStrength = 1.8;
    vec3 randomness = vec3(
        (random(aParticleId + 800.0) - 0.5) * randomStrength,
        (random(aParticleId + 900.0) - 0.5) * (randomStrength * 0.45),
        (random(aParticleId + 1000.0) - 0.5) * randomStrength
    );
    modelPosition.xyz += randomness * randomnessStrength;

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    gl_PointSize = uParticleSize * scale;
    gl_PointSize *= (1.0 / -viewPosition.z);

    vColor = particleColor;
}
         
             
      

        
      

        

      

