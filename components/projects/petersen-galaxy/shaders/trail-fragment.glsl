varying float vTrailProgress;
varying vec3 vColor;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Glow: head is more intense
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  float headGlow = mix(0.5, 1.2, vTrailProgress); // head is brighter

  float alpha = glow * headGlow;

  // Clamp alpha to [0.1, 1.0]
  alpha = clamp(alpha, 0.1, 1.0);

  gl_FragColor = vec4(vColor, alpha);

  // Optional: fade out very edge
  if (alpha < 0.11) discard; // slightly above 0.1 to avoid edge artifacts
}