import { getShaderCodeWithRenamedMainImage, getMainImageFunctionName } from './shader-registry'

export const shaderTVVertexShader = `
  attribute float componentId;
  attribute float tvId;

  varying vec2 vUv;
  varying float vComponentId;
  varying float vTvId;

  void main() {
    vUv = uv;
    vComponentId = componentId;
    vTvId = tvId;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export function getMultiShaderTVFragmentShader(shaderNames: string[]): string {
  // Get the shader code with renamed mainImage
  const renamedShaderCodes = shaderNames.map(name =>
    getShaderCodeWithRenamedMainImage(name)
  )

  // Get the renamed function names
  const functionNames = shaderNames.map(name =>
    getMainImageFunctionName(name)
  )

  // Generate conditional call code
  const conditionalCalls = functionNames.map((funcName, index) =>
    `${index > 0 ? 'else ' : ''}if (vTvId < ${index + 0.5}) {
        ${funcName}(color, fragCoord);
      }`
  ).join(' ')

  return `
    uniform float iTime;
    uniform vec2 iResolution;
    uniform float uTVCount;

    varying vec2 vUv;
    varying float vComponentId;
    varying float vTvId;

    // Embed all renamed shader codes
    ${renamedShaderCodes.join('\n')}

    void main() {
      if (vComponentId < 0.5) { // SCREEN
        vec4 color = vec4(0.0);
        vec2 fragCoord = vUv * iResolution.xy;

        // Call the corresponding renamed function according to tvId
        ${conditionalCalls}
 
        gl_FragColor = color;
      } else { // BASE
        // Sample screen color at bottom three positions and blend
        vec4 screenColorLeft = vec4(0.0);
        vec4 screenColorCenter = vec4(0.0);
        vec4 screenColorRight = vec4(0.0);

        vec2 bottomLeftCoord = vec2(0.0, 0.0) * iResolution.xy;    // Bottom left corner
        vec2 bottomCenterCoord = vec2(0.5, 0.0) * iResolution.xy;  // Bottom center
        vec2 bottomRightCoord = vec2(1.0, 0.0) * iResolution.xy;   // Bottom right corner

        // Get screen color from the same TV
        ${conditionalCalls.replace(/fragCoord/g, 'bottomLeftCoord').replace(/color/g, 'screenColorLeft')}
        ${conditionalCalls.replace(/fragCoord/g, 'bottomCenterCoord').replace(/color/g, 'screenColorCenter')}
        ${conditionalCalls.replace(/fragCoord/g, 'bottomRightCoord').replace(/color/g, 'screenColorRight')}

        // Blend the three sampled colors
        vec3 blendedColor = (screenColorLeft.rgb + screenColorCenter.rgb + screenColorRight.rgb) / 3.0;

        // Create base color based on blended screen color
        vec3 baseColor = blendedColor * 0.3 + vec3(0.1); // Darker version with minimum brightness

        gl_FragColor = vec4(baseColor, 1.0);
      }
    }
    `
}