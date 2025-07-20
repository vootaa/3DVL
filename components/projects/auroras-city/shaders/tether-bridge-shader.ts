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

  // Top surface color palette (customize more colors as needed)
  vec3 getPatchColor(float patchId, float patchType, float colorSeed, float bridgeId, float time) {
    // Color sequence
    vec3 palette[6];
    palette[0] = vec3(0.85, 0.25, 0.25); // Red
    palette[1] = vec3(0.25, 0.55, 0.85); // Blue
    palette[2] = vec3(0.25, 0.85, 0.35); // Green
    palette[3] = vec3(0.95, 0.75, 0.25); // Yellow
    palette[4] = vec3(0.65, 0.25, 0.85); // Purple
    palette[5] = vec3(0.25, 0.85, 0.85); // Cyan

    // PatchId + time rotation, creates moving color blocks
    float idx = mod(floor(patchId + time * 2.0), 6.0);
    return palette[int(idx)];
  }

  // Side/bottom gradient color
  vec3 getSideColor(float bridgeId, vec3 worldPos, float faceType) {
    // Each bridge has a different main color
    float t = mod(bridgeId, 5.0) / 5.0;
    vec3 base = mix(vec3(0.2,0.3,0.5), vec3(0.8,0.5,0.3), t);
    // Gradient: y direction or z direction
    float g = 0.5 + 0.5 * sin(worldPos.y * 0.6 + bridgeId * 1.3 + faceType * 2.0);
    return mix(base * 0.7, base * 1.2, g);
  }

  void main() {
    vec3 color;
    if (vFaceType < 0.5) {
      // Top surface: polygon color blocks, rotating
      color = getPatchColor(vPatchId, vPatchType, vColorSeed, vBridgeId, uTime);
      // Highlight
      vec3 lightDir = normalize(vec3(0.3, 1.0, 0.5));
      float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);
      color += diffuse * 0.15;
    } else {
      // Side/bottom: gradient
      color = getSideColor(vBridgeId, vWorldPosition, vFaceType);
      // Add some highlight
      vec3 lightDir = normalize(vec3(0.3, 1.0, 0.5));
      float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);
      color += diffuse * 0.10;
    }
    gl_FragColor = vec4(color, 1.0);
  }
`;