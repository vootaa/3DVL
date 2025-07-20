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
  uniform float uTime;
  varying float vPatchType;
  varying float vPatchId;
  varying float vColorSeed;
  varying float vBridgeId;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  vec3 getGlassColor(float seed, float patchType, float bridgeId) {
    float t = fract(seed + patchType * 0.13 + bridgeId * 0.07);
    return mix(
      vec3(0.2 + t, 0.7 - t * 0.5, 1.0 - t * 0.7),
      vec3(1.0 - t, 0.5 + t * 0.4, 0.8 * t),
      0.5 + 0.5 * sin(seed * 6.28 + patchType + bridgeId)
    );
  }

  void main() {
    vec3 baseColor = getGlassColor(vColorSeed, vPatchType, vBridgeId);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.5);
    float edge = smoothstep(0.0, 0.12, abs(fract(vPatchId) - 0.5));
    baseColor = mix(baseColor, vec3(1.0), edge * 0.4);
    baseColor += fresnel * 0.25;
    float alpha = 0.65 + 0.25 * fresnel;
    gl_FragColor = vec4(baseColor, alpha);
  }
`