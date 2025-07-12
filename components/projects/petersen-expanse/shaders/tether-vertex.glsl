attribute float alpha;
attribute float tetherId;
attribute vec2 archParams; // x: arch direction, y: progress along arch
attribute vec2 nodeIndices; // x: fromNodeId, y: toNodeId
attribute float progressAlongArch;

uniform float uTime;
uniform float uEvolutionProgress;
uniform float uPointSize;
uniform float uFlowSpeed;
uniform float uPulseFrequency;
uniform float uBaseRotationSpeed;
uniform float uArchHeight;
uniform float uNodeRadii[20];
uniform float uNodeAngles[20];

varying float vAlpha;
varying vec3 vColor;
varying float vFlow;

void main() {
    vColor = color;

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

    // Calculate arch position using simple interpolation with height
    float t = progressAlongArch;
    float archDirection = archParams.x; // 1.0 is upward, -1.0 is downward
    
    // Linear interpolation between from and to positions
    vec3 basePos = mix(fromPos, toPos, t);
    
    // Add arch height using sine wave
    float heightMultiplier = sin(t * 3.14159265359);
    basePos.y += archDirection * uArchHeight * heightMultiplier;

    // Smooth transition for evolution progress
    float smoothProgress = smoothstep(0.0, 1.0, uEvolutionProgress);
    
    // Flow effect along the arch
    float flowPhase = uTime * uFlowSpeed + t * 6.28318530718;
    vFlow = sin(flowPhase) * 0.5 + 0.5;
    
    // Pulse effect
    float pulsePhase = uTime * uPulseFrequency;
    float pulse = sin(pulsePhase) * 0.3 + 0.7;
    
    // Final alpha calculation
    vAlpha = alpha * smoothProgress * pulse * (0.6 + 0.4 * vFlow);

    // Apply evolution progress to position (particles appear gradually)
    vec3 finalPosition = basePos * smoothProgress;

    vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Adaptive point size based on distance
    float distance = length(mvPosition.xyz);
    gl_PointSize = uPointSize * (300.0 / max(distance, 50.0));
}