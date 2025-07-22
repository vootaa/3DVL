import { getShaderCode } from './shader-registry'
import { Logger } from '~/components/utils/logger'

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
  // Safely get shader code, fallback to default-shader if failed
  const safeGetShaderCode = (name: string): string => {
    try {
      return getShaderCode(name)
    } catch (error) {
      Logger.warn('ShaderTV', `Failed to get shader "${name}", falling back to default-shader`)
      return getShaderCode('default-shader')
    }
  }

  // Get full code for each shader
  const shaderCodes = shaderNames.map(name => safeGetShaderCode(name))
  
  // Wrap each shader in a function
  const shaderFunctions = shaderCodes.map((code, index) => {
    // Simple code cleanup, remove possible mainImage function declaration
    const cleanCode = code.replace(/void\s+mainImage\s*\([^)]*\)\s*\{/, '')
                         .replace(/}\s*$/, '') // Remove closing bracket
    
    return `
      // Shader ${index}: ${shaderNames[index]}
      void shader${index}MainImage(out vec4 fragColor, in vec2 fragCoord) {
        ${cleanCode}
        
        // If the above code fails, use a simple fallback
        if (fragColor.a <= 0.0) {
          fragColor = vec4(0.5, 0.5, 0.5, 1.0); // Gray fallback
        }
      }
    `
  }).join('\n')

  // Generate conditional call code
  const conditionalCalls = shaderNames.map((_, index) =>
    `${index > 0 ? 'else ' : ''}if (vTvId < ${index + 0.5}) {
        shader${index}MainImage(color, fragCoord);
      }`
  ).join(' ')

  // Add final fallback
  const fallbackCall = `
    else {
      // Final fallback - simple plasma effect
      vec2 uv = fragCoord / iResolution.xy;
      float time = iTime * 0.5;
      color = vec4(
        0.5 + 0.5 * sin(time + uv.x * 10.0),
        0.5 + 0.5 * sin(time + uv.y * 10.0 + 2.0),
        0.5 + 0.5 * sin(time + (uv.x + uv.y) * 5.0 + 4.0),
        1.0
      );
    }
  `

  return `
    uniform float iTime;
    uniform vec2 iResolution;
    uniform float uTVCount;

    varying vec2 vUv;
    varying float vComponentId;
    varying float vTvId;

    ${shaderFunctions}

    void main() {
      if (vComponentId < 0.5) { // SCREEN
        vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
        vec2 fragCoord = vUv * iResolution.xy;

        // Call corresponding shader function according to tvId
        ${conditionalCalls}
        ${fallbackCall}
 
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