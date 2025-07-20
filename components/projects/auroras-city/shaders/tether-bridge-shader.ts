export const tetherBridgeIrregularVertexShader = `
  attribute float patchType;
  attribute float patchId;
  attribute float colorSeed;
  attribute float bridgeId;

  varying float vPatchType;
  varying float vPatchId;
  varying float vColorSeed;
  varying float vBridgeId;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vPatchType = patchType;
    vPatchId = patchId;
    vColorSeed = colorSeed;
    vBridgeId = bridgeId;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const tetherBridgeIrregularFragmentShader = `
  varying float vPatchType;
  varying float vPatchId;
  varying float vColorSeed;
  varying float vBridgeId;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  // Generate a deep-toned colorful palette
  vec3 getDeepColor(float seed, float patchType, float bridgeId) {
    float t = fract(seed + patchType * 0.13 + bridgeId * 0.07);
    // Deep tone
    return mix(
      vec3(0.1 + t * 0.3, 0.2 + t * 0.4, 0.3 + t * 0.5),
      vec3(0.2 + t * 0.5, 0.1 + t * 0.3, 0.4 + t * 0.4),
      0.5 + 0.5 * sin(seed * 6.28 + patchType + bridgeId)
    );
  }

  void main() {
    vec3 baseColor = getDeepColor(vColorSeed, vPatchType, vBridgeId);

    // Local highlight (not Fresnel, just normal and light direction)
    vec3 lightDir = normalize(vec3(0.3, 1.0, 0.5));
    float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);
    float highlight = pow(diffuse, 8.0);

    // Polygon edge line (simulate edge by patchId variation)
    float edge = smoothstep(0.0, 0.08, abs(fract(vPatchId) - 0.5));
    baseColor = mix(baseColor, vec3(0.0), edge * 0.7);

    // Add highlight
    baseColor += highlight * 0.15;

    gl_FragColor = vec4(baseColor, 1.0); // Opaque
  }
`