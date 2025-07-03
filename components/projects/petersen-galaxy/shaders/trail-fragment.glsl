varying vec3 vColor;
varying float vLife;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
// Create glow effect
float core = 1.0 - smoothstep(0.0, 0.2, dist);
float glow = 1.0 - smoothstep(0.0, 0.5, dist);

float intensity = core * 2.0 + glow * 0.5;
intensity *= vLife; // Life cycle decay

  vec3 finalColor = vColor * intensity;
  float alpha = intensity * 0.8;
  
  gl_FragColor = vec4(finalColor, alpha);
}