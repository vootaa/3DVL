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
    float fromAngle = uNodeAngles[fromNodeId] + uTime * uBaseRotationSpeed;
    float toAngle = uNodeAngles[toNodeId] + uTime * uBaseRotationSpeed;
    
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

    // Calculate arch position (quadratic Bezier curve)
    float t = progressAlongArch;
    float archDirection = archParams.x; // 1.0 is upward, -1.0 is downward
    
    // Arch control point (above or below the midpoint)
    vec3 midPoint = (fromPos + toPos) * 0.5;
    midPoint.y += archDirection * uArchHeight * sin(t * 3.14159);
    
    // Quadratic Bezier interpolation
    vec3 archPosition = fromPos * (1.0 - t) * (1.0 - t) + 
                       midPoint * 2.0 * (1.0 - t) * t + 
                       toPos * t * t;

    // Smooth transition for evolution progress
    float smoothProgress = smoothstep(0.0, 1.0, uEvolutionProgress);
    
    // Flow effect
    float flowOffset = mod(uTime * uFlowSpeed + t * 6.28, 6.28);
    vFlow = sin(flowOffset) * 0.5 + 0.5;
    
    // Pulse effect
    float pulse = sin(uTime * uPulseFrequency) * 0.5 + 0.5;
    
    // Final alpha
    vAlpha = alpha * (0.7 + 0.3 * vFlow) * smoothProgress * (0.8 + 0.2 * pulse);

    vec4 mvPosition = modelViewMatrix * vec4(archPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
}