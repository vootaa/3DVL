attribute float size;
attribute vec3 customColor;
attribute float alpha;
attribute float time;
attribute float pulseOffset;

varying vec3 vColor;
varying float vAlpha;
varying float vTime;

void main() {
  vColor = customColor;
  vAlpha = alpha;
  vTime = time + pulseOffset;
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  
  // Complex twinkling effect: combining multiple frequency sine waves
  float twinkle1 = sin(vTime * 2.0 + position.x * 5.0) * 0.3;
  float twinkle2 = sin(vTime * 3.5 + position.z * 7.0) * 0.2;
  float twinkle3 = sin(vTime * 1.2 + position.y * 3.0) * 0.1;
  
  float totalTwinkle = 0.8 + twinkle1 + twinkle2 + twinkle3;
  
  // Distance-based size scaling
  float distanceScale = 300.0 / -mvPosition.z;
  
  gl_PointSize = size * totalTwinkle * distanceScale;
  gl_Position = projectionMatrix * mvPosition;
}
