uniform float time;
uniform vec3 resolution;

varying vec3 vColor;
varying float vAlpha;
varying float vTime;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
  // Create multi-layer glow effect
  // Core: very bright center
  float core = 1.0 - smoothstep(0.0, 0.15, dist);
  core = pow(core, 2.0);
  
  // Inner halo: medium intensity
  float innerHalo = 1.0 - smoothstep(0.1, 0.35, dist);
  innerHalo = pow(innerHalo, 1.5) * 0.6;
  
  // Outer halo: soft edges
  float outerHalo = 1.0 - smoothstep(0.3, 0.5, dist);
  outerHalo = pow(outerHalo, 0.8) * 0.3;
  
  // Dynamic pulse effect
  float pulse = 0.9 + 0.1 * sin(vTime * 4.0);
  
  // Color temperature variation
  vec3 colorShift = vColor;
  colorShift.r *= 1.0 + 0.1 * sin(vTime * 2.0);
  colorShift.g *= 1.0 + 0.1 * cos(vTime * 2.5);
  colorShift.b *= 1.0 + 0.1 * sin(vTime * 1.8);
  
  // Combine all effects
  float totalIntensity = (core + innerHalo + outerHalo) * pulse;
  
  // Final color calculation
  vec3 finalColor = colorShift * totalIntensity;
  float finalAlpha = vAlpha * totalIntensity;
  
  // Ensure star edges are completely transparent
  if (dist > 0.5) {
    discard;
  }
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
