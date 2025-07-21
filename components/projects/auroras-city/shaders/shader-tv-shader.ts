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
            gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);
        }
    }
    `
}