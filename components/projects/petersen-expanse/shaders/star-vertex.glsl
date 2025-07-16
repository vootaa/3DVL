attribute float size;
attribute vec3 customColor;
attribute float alpha;
attribute float time;
attribute float pulseOffset;
attribute float targetRadius;
attribute float initialAngle;
attribute vec3 chaoticPosition;

uniform float cameraDistance;
uniform float globalTime;
uniform float evolutionProgress;
uniform float baseRotationSpeed;

varying vec3 vColor;
varying float vAlpha;
varying float vTime;
varying float vDistToCenter; // Pass to fragment for radial gradient
varying vec3 vWorldPosition; // For noise perturbation

void main() {
  vColor = customColor;
  vTime = time + pulseOffset;
  
  float smoothProgress = smoothstep(0.0, 1.0, evolutionProgress);
  
  float currentAngle = initialAngle + globalTime * baseRotationSpeed;
  vec3 orbitalPos = vec3(
    targetRadius * cos(currentAngle),
    0.0,
    targetRadius * sin(currentAngle)
  );
  
  vec3 finalPos = mix(chaoticPosition, orbitalPos, smoothProgress);
  
  vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);

  // Record world position and radial distance
  vWorldPosition = finalPos;
  vDistToCenter = length(finalPos);
  
  // Multi-layer twinkle
  float twinkle1 = sin(vTime * 2.0 + finalPos.x * 5.0) * 0.03;
  float twinkle2 = sin(vTime * 3.5 + finalPos.z * 7.0) * 0.02;
  float twinkle3 = sin(vTime * 1.2 + finalPos.y * 3.0) * 0.015;
  float twinkle4 = sin(globalTime * 0.7 + finalPos.x * 2.5 + finalPos.z * 1.5) * 0.02;
  float totalTwinkle = 0.96 + twinkle1 + twinkle2 + twinkle3 + twinkle4;
  
  float evolutionAlpha = mix(0.1, alpha, smoothProgress);
  float evolutionSize = mix(0.3, 1.0, smoothProgress);
  
  vAlpha = evolutionAlpha;
  
  float distance = length(mvPosition.xyz);
  float distanceScale = 300.0 / distance;
  float cameraScale = 2.0 / cameraDistance;
  
  gl_PointSize = size * totalTwinkle * distanceScale * cameraScale * evolutionSize;
  gl_Position = projectionMatrix * mvPosition;
}
