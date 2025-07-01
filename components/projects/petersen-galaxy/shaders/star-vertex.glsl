attribute float size;
attribute vec3 customColor;
attribute float alpha;
attribute float time;
attribute float pulseOffset;

uniform float cameraDistance;

varying vec3 vColor;
varying float vAlpha;
varying float vTime;

void main() {
  vColor = customColor;
  vAlpha = alpha;
  vTime = time + pulseOffset;
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  
  // Minimal twinkling effect: very subtle variation
  float twinkle1 = sin(vTime * 2.0 + position.x * 5.0) * 0.03;
  float twinkle2 = sin(vTime * 3.5 + position.z * 7.0) * 0.02;
  float twinkle3 = sin(vTime * 1.2 + position.y * 3.0) * 0.015;
  
  float totalTwinkle = 0.96 + twinkle1 + twinkle2 + twinkle3;
  
  // Enhanced distance-based size scaling for 3D depth effect
  float distance = length(mvPosition.xyz);
  float distanceScale = 400.0 / distance; // Stronger distance effect
  
  // Camera distance scaling for zoom interaction
  float cameraScale = 1.0 + (cameraDistance - 10.0) * 0.05; // Scale with camera distance
  
  gl_PointSize = size * totalTwinkle * distanceScale * cameraScale;
  gl_Position = projectionMatrix * mvPosition;
}
