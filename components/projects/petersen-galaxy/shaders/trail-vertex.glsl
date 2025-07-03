uniform float uTime;
uniform float uSize;

attribute float size;
attribute float life;

varying vec3 vColor;
varying float vLife;

void main() {
  vColor = color;
  vLife = life;
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  
// Particle twinkle effect
float twinkle = sin(uTime * 5.0 + position.x * 10.0) * 0.1 + 0.9;

// Distance attenuation
  float distance = length(mvPosition.xyz);
  float distanceScale = 300.0 / distance;
  
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * uSize * distanceScale * twinkle * life;
}