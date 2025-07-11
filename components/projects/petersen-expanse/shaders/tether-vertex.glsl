attribute float alpha;
attribute float tetherId;
attribute vec2 archParams; // x: arch direction, y: progress along arch

uniform float uTime;
uniform float uEvolutionProgress;
uniform float uPointSize;
uniform float uFlowSpeed;

varying float vAlpha;
varying vec3 vColor;
varying float vFlow;

void main() {
    vColor = color;

        // Evolution progress affects chaos to order transition
    vec3 chaosOffset = vec3(sin(uTime * 2.0 + tetherId * 0.5) * (1.0 - uEvolutionProgress), cos(uTime * 1.5 + tetherId * 0.3) * (1.0 - uEvolutionProgress), sin(uTime * 1.8 + tetherId * 0.7) * (1.0 - uEvolutionProgress)) * 50.0;

    vec3 finalPosition = position + chaosOffset * (1.0 - uEvolutionProgress);

        // Flowing animation along the arch
    float flowOffset = mod(uTime * uFlowSpeed + archParams.y * 6.28, 6.28);
    vFlow = sin(flowOffset) * 0.5 + 0.5;

        // Alpha combines base alpha with flow effect
    vAlpha = alpha * (0.7 + 0.3 * vFlow) * uEvolutionProgress;

    vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
}