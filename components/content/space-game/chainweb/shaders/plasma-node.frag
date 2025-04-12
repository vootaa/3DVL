uniform vec3 color;
uniform float time;
uniform float radius;
uniform float pulseSpeed;
uniform float pulseIntensity;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Base plasma effect
  float plasma = sin(vPosition.x * 10.0 + time * pulseSpeed) *
    cos(vPosition.y * 10.0 + time * pulseSpeed) *
    sin(vPosition.z * 10.0 + time * pulseSpeed);

  // Pulse effect
  float pulse = 1.0 + pulseIntensity * sin(time * pulseSpeed * 2.0);

  // Edge glow effect
  float edge = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

  // Combine effects
  vec3 finalColor = color * (1.0 + 0.3 * plasma) * pulse;
  finalColor += color * edge * 0.5;

  // Add brightness at the center
  float dist = length(vPosition) / radius;
  finalColor *= 1.0 + (1.0 - min(1.0, dist)) * 0.5;

  gl_FragColor = vec4(finalColor, 1.0);
}
