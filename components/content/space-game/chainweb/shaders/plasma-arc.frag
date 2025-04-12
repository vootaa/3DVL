uniform vec3 color;
uniform float time;
uniform float arcType; // 0.0 for inter-layer, 1.0 for same-chain
uniform float flowSpeed;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  float v = vUv.x; // Position along the tube

  if(arcType < 0.5) {
    // Inter-layer: Electric arc effect
    float noise = sin(v * 50.0 + time * 5.0 * flowSpeed) * 0.5 + 0.5;
    float pulse = sin(v * 20.0 - time * 10.0 * flowSpeed) * 0.5 + 0.5;

    // Edge effect
    float edge = pow(1.0 - vUv.y, 2.0) * 2.0;

    // Combine effects
    vec3 finalColor = color * (1.0 + noise * 0.3) * (0.8 + pulse * 0.4);
    finalColor *= (0.6 + edge * 0.4);

    gl_FragColor = vec4(finalColor, 0.9);
  } else {
    // Same-chain: Smooth energy flow effect
    float flow = fract(v * 3.0 - time * flowSpeed);
    float glow = pow(sin(flow * 3.14159), 2.0) * 0.7 + 0.3;

    // Core and edge
    float core = smoothstep(0.4, 0.5, 1.0 - abs(vUv.y - 0.5) * 2.0);
    float edge = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.0);

    // Combine effects
    vec3 finalColor = color * (glow * 0.7 + 0.3);
    finalColor = mix(finalColor, finalColor * 1.5, core);
    finalColor *= (0.7 + edge * 0.3);

    gl_FragColor = vec4(finalColor, 0.85);
  }
}
