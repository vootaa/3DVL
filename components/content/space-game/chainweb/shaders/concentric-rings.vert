uniform float time;
uniform float rotationOffset;
uniform float rotationSpeed;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  // Apply gentle rotation to add movement
    float angle = time * rotationSpeed + rotationOffset;
    vec3 pos = position;
    mat3 rotationMatrix = mat3(cos(angle), 0.0, sin(angle), 0.0, 1.0, 0.0, -sin(angle), 0.0, cos(angle));
    pos = rotationMatrix * pos;

    vUv = uv;
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
