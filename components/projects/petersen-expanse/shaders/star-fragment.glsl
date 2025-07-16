uniform float uTime;
uniform vec3 resolution;

varying vec3 vColor;
varying float vAlpha;
varying float vTime;
varying float vDistToCenter;
varying vec3 vWorldPosition;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) discard;

  // Multi-layer Glow
  float core = 1.0 - smoothstep(0.0, 0.18, dist);
  core = pow(core, 2.5);

  float innerHalo = 1.0 - smoothstep(0.13, 0.32, dist);
  innerHalo = pow(innerHalo, 1.7) * 0.7;

  float outerHalo = 1.0 - smoothstep(0.28, 0.5, dist);
  outerHalo = pow(outerHalo, 1.2) * 0.35;

  // Subtle color temperature animation
  vec3 colorShift = vColor;
  colorShift.r *= 1.0 + 0.015 * sin(vTime * 2.0 + vWorldPosition.x);
  colorShift.g *= 1.0 + 0.015 * cos(vTime * 2.5 + vWorldPosition.y);
  colorShift.b *= 1.0 + 0.015 * sin(vTime * 1.8 + vWorldPosition.z);

  // Pulse effect based on time and distance
  float pulse = 0.98 + 0.02 * sin(vTime * 4.0 + vDistToCenter * 0.5);

  float totalIntensity = (core + innerHalo + outerHalo) * pulse;

  vec3 finalColor = colorShift * totalIntensity;
  float finalAlpha = vAlpha * totalIntensity;

  gl_FragColor = vec4(finalColor, finalAlpha);
}