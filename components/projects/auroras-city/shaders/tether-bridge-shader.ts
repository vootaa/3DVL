export const tetherBridgeIrregularVertexShader = `
  attribute float patchType;
  attribute float patchId;
  attribute float colorSeed;
  attribute float bridgeId;
  attribute float faceType;

  varying float vPatchType;
  varying float vPatchId;
  varying float vColorSeed;
  varying float vBridgeId;
  varying float vFaceType;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vPatchType = patchType;
    vPatchId = patchId;
    vColorSeed = colorSeed;
    vBridgeId = bridgeId;
    vFaceType = faceType;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const tetherBridgeIrregularFragmentShader = `
  uniform float uTime;
  varying float vPatchType;
  varying float vPatchId;
  varying float vColorSeed;
  varying float vBridgeId;
  varying float vFaceType;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  // Color palette for top faces
  vec3 getPatchColor(float patchId, float patchType, float colorSeed, float bridgeId, float time) {
    vec3 palette[6];
    palette[0] = vec3(0.85, 0.25, 0.25); // Red
    palette[1] = vec3(0.25, 0.55, 0.85); // Blue
    palette[2] = vec3(0.25, 0.85, 0.35); // Green
    palette[3] = vec3(0.95, 0.75, 0.25); // Yellow
    palette[4] = vec3(0.65, 0.25, 0.85); // Purple
    palette[5] = vec3(0.25, 0.85, 0.85); // Cyan

    // Bidirectional color cycling: even patchType forward, odd backward
    float cycle = floor(time); // Change color every 1 second
    float dir = mod(patchType, 2.0) < 0.5 ? 1.0 : -1.0;
    float idx = mod(floor(patchId + dir * cycle), 6.0);
    return palette[int(idx)];
  }

  // Side/bottom color: deeper, slower cycling
  vec3 getSideColor(float bridgeId, vec3 worldPos, float faceType, float time) {
    float t = mod(bridgeId, 5.0) / 5.0;
    vec3 base = mix(vec3(0.15,0.22,0.35), vec3(0.35,0.22,0.12), t); // Deeper base
    float g = 0.5 + 0.5 * sin(worldPos.y * 0.6 + bridgeId * 1.3 + faceType * 2.0 + time * 0.3); // Slower
    return mix(base * 0.7, base * 1.1, g);
  }

  // Draw polygon border (for top face)
  float borderMask(vec3 normal) {
    // Only for top faces (normal.y ~ 1)
    float edge = 1.0 - smoothstep(0.95, 1.0, abs(normal.y));
    return edge;
  }

  void main() {
    vec3 color;
    float border = 0.0;
    if (vFaceType < 0.5) {
      // Top face: color block, clear border, no strong highlight
      color = getPatchColor(vPatchId, vPatchType, vColorSeed, vBridgeId, uTime);
      // Add polygon border (darken edge)
      border = borderMask(vNormal);
      color = mix(color, vec3(0.08,0.08,0.08), border * 0.7);
    } else {
      // Side/bottom: deep color, slow cycling, weak highlight
      color = getSideColor(vBridgeId, vWorldPosition, vFaceType, uTime);
      // Very weak highlight
      vec3 lightDir = normalize(vec3(0.3, 1.0, 0.5));
      float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);
      color += diffuse * 0.04;
    }
    gl_FragColor = vec4(color, 1.0);
  }
`;