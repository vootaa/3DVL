export const shaderTVVertexShader = `
  attribute float componentId;
  attribute float tvId;
  
  flat varying float vComponentId;
  flat varying float vTvId;
  
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  
  void main() {
    vComponentId = componentId;
    vTvId = tvId;
    
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export function getShaderTVFragmentShader(shaderSource: string): string {
    return `
    uniform float iTime;
    uniform vec2 iResolution;
    
    flat varying float vComponentId;
    flat varying float vTvId;
    
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    
    // Embed third-party shader code
    ${shaderSource}
    
    // Get the main tone of the shader
    vec3 getShaderTone(float time) {
        vec4 sample1, sample2, sample3, sample4;
        
        // Sample the four corners of the screen
        mainImage(sample1, vec2(0.2, 0.2) * iResolution);
        mainImage(sample2, vec2(0.8, 0.2) * iResolution);
        mainImage(sample3, vec2(0.2, 0.8) * iResolution);
        mainImage(sample4, vec2(0.8, 0.8) * iResolution);
        
        // Return the average color as the tone
        return (sample1.rgb + sample2.rgb + sample3.rgb + sample4.rgb) * 0.25;
    }
    
    // Base material - blend shader tone
    vec3 getBaseMaterial(vec2 uv, float time, float tvId) {
        // Get the main tone of the current shader
        vec3 shaderTone = getShaderTone(time);
        
        // Base brightness modulation (base is darker than screen)
        float baseBrightness = 0.4;
        
        // Add subtle variation
        float variation = sin(uv.x * 15.0 + time * 0.5) * sin(uv.y * 15.0 + time * 0.3) * 0.1;
        
        // Add a slight pulsating effect, echoing the shader
        float pulse = sin(time * 2.0 + tvId) * 0.1 + 0.9;
        
        vec3 baseColor = shaderTone * baseBrightness * pulse;
        
        return baseColor + variation * shaderTone * 0.3;
    }
    
    void main() {
        vec3 color;
        
        if (vComponentId == 0.0) { 
            // Screen component: directly display shader content
            vec4 shaderColor;
            mainImage(shaderColor, vUv * iResolution);
            color = shaderColor.rgb;
        } else { 
            // Base component: use blended shader tone
            color = getBaseMaterial(vUv, iTime, vTvId);
        }
        
        gl_FragColor = vec4(color, 1.0);
    }
    `;
}