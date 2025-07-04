attribute float size;
attribute float trailProgress;
varying float vTrailProgress;
varying vec3 vColor;

void main() {
  vTrailProgress = trailProgress;
  vColor = color;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float distance = length(mvPosition.xyz);
  float distanceScale = 300.0 / distance;
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * distanceScale;
}