uniform vec3 color;
uniform float time;
uniform float radius;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  // Energy flow along ring
    float flow = fract(vUv.x * 8.0 - time * 0.5);
    float pulse = pow(sin(flow * 3.14159 * 2.0), 2.0) * 0.3 + 0.7;

  // Shimmer effect
    float shimmer = sin(vUv.x * 50.0 + time * 3.0) * 0.1 + 0.9;

  // Combine effects
    vec3 finalColor = color * pulse * shimmer;

  // Add some variation based on ring size
    finalColor *= 0.8 + (radius * 0.5);

    gl_FragColor = vec4(finalColor, 0.9);
}
