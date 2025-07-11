attribute float alpha;
attribute float tetherId;
attribute vec2 archParams; // x: arch direction, y: progress along arch
attribute vec3 chaoticPosition;

uniform float uTime;
uniform float uEvolutionProgress;
uniform float uPointSize;
uniform float uFlowSpeed;

varying float vAlpha;
varying vec3 vColor;
varying float vFlow;

void main() {
    vColor = color;

    float smoothProgress = smoothstep(0.0, 1.0, uEvolutionProgress);

    vec3 finalPosition = mix(chaoticPosition, position, smoothProgress);

    float flowOffset = mod(uTime * uFlowSpeed + archParams.y * 6.28, 6.28);
    vFlow = sin(flowOffset) * 0.5 + 0.5;

    vAlpha = alpha * (0.7 + 0.3 * vFlow) * smoothProgress;

    vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
}