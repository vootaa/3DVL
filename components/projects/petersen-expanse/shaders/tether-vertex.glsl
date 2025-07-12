attribute vec3 headColor;
attribute vec3 tailColor;
attribute float alpha;
attribute float tetherId;
attribute vec2 archParams; // x: arch direction, y: particle index
attribute vec2 nodeIndices; // x: fromNodeId, y: toNodeId
attribute float particleIndex; // Index of this particle in the tether

uniform float uTime;
uniform float uEvolutionProgress;
uniform float uPointSize;
uniform float uFlowSpeed;
uniform float uBaseRotationSpeed;
uniform float uArchHeight;
uniform float uParticleSpacing;
uniform float uTrailLength;
uniform float uHeadBrightness;
uniform float uTailBrightness;
uniform float uNodeRadii[20];
uniform float uNodeAngles[20];

varying float vAlpha;
varying vec3 vColor;
varying float vTrailPosition;

void main() {
    // Get the two connected node info
    int fromNodeId = int(nodeIndices.x);
    int toNodeId = int(nodeIndices.y);
    
    // Calculate the positions of the two nodes at the current time (considering global rotation)
    float currentRotation = uTime * uBaseRotationSpeed;
    float fromAngle = uNodeAngles[fromNodeId] + currentRotation;
    float toAngle = uNodeAngles[toNodeId] + currentRotation;
    
    vec3 fromPos = vec3(
        uNodeRadii[fromNodeId] * cos(fromAngle),
        0.0,
        uNodeRadii[fromNodeId] * sin(fromAngle)
    );
    
    vec3 toPos = vec3(
        uNodeRadii[toNodeId] * cos(toAngle),
        0.0,
        uNodeRadii[toNodeId] * sin(toAngle)
    );

    // Calculate flowing particle position
    float archDirection = archParams.x; // 1.0 for up arch, -1.0 for down arch
    float particleOffset = particleIndex * uParticleSpacing;
    
    // Create flowing effect: particles move along the tether path
    float flowTime = uTime * uFlowSpeed + particleOffset;
    float t = mod(flowTime, 1.0); // Keep t in [0,1] range for cycling
    
    // Calculate arch position using sine wave for height
    vec3 basePos = mix(fromPos, toPos, t);
    float heightMultiplier = sin(t * 3.14159265359);
    basePos.y += archDirection * uArchHeight * heightMultiplier;

    // Smooth transition for evolution progress
    float smoothProgress = smoothstep(0.0, 1.0, uEvolutionProgress);
    
    // Trail effect: particles fade based on their position in the flow
    vTrailPosition = t;
    float trailFade = 1.0;
    
    // Create smooth trail by fading particles based on their flow position
    if (t > (1.0 - uTrailLength)) {
        // Leading particles (head) - use head brightness
        trailFade = uHeadBrightness;
        vColor = headColor * uHeadBrightness;
    } else {
        // Trailing particles - interpolate between head and tail
        float trailT = t / (1.0 - uTrailLength);
        trailFade = mix(uTailBrightness, uHeadBrightness, trailT);
        
        // Interpolate colors from tail to head
        vColor = mix(tailColor * uTailBrightness, headColor * uHeadBrightness, trailT);
    }
    
    // Final alpha calculation with trail effect
    vAlpha = alpha * smoothProgress * min(trailFade, 1.0);

    // Apply evolution progress to position
    vec3 finalPosition = basePos * smoothProgress;

    vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Adaptive point size based on distance and trail position
    float distance = length(mvPosition.xyz);
    float sizeMultiplier = mix(0.7, 1.0, min(trailFade, 1.0)); // Larger particles at trail head
    gl_PointSize = uPointSize * sizeMultiplier * (300.0 / max(distance, 50.0));
}