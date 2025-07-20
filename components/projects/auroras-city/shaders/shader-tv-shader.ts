export const shaderTVVertexShader = `
    attribute float componentId;
    attribute float surfaceType;
    attribute float tvId;
    
    flat varying float vComponentId;
    flat varying float vSurfaceType;
    flat varying float vTvId;
    
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    
    void main() {
        vComponentId = componentId;
        vSurfaceType = surfaceType;
        vTvId = tvId;
        
        vNormal = normalize(normalMatrix * normal);
        
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        
        vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = viewPos.xyz;
        
        vUv = uv;
        
        gl_Position = projectionMatrix * viewPos;
    }
`;

export function getShaderTVFragmentShader(shaderSource: string): string {
    return `
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec3 uLightPosition;
    uniform vec3 uCameraPosition;
    
    flat varying float vComponentId;
    flat varying float vSurfaceType;
    flat varying float vTvId;
    
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    
    // Embed third-party shader code
    ${shaderSource}
    
    // Component material functions
    vec3 getSupportMaterial(vec2 uv, float time) {
        // Metallic support material
        float metallic = 0.8;
        vec3 baseColor = vec3(0.3, 0.3, 0.4);
        float noise = sin(uv.x * 10.0 + time * 0.5) * 0.1;
        return baseColor + noise;
    }
    
    vec3 getFrameMaterial(vec2 uv, float time) {
        // Frame material - slightly glowing
        vec3 baseColor = vec3(0.2, 0.2, 0.3);
        float glow = sin(time * 2.0) * 0.1 + 0.1;
        return baseColor + glow;
    }
    
    vec3 getBackMaterial(vec2 uv, float time) {
        // Back material - dark metal
        vec3 baseColor = vec3(0.1, 0.1, 0.15);
        float pattern = mod(floor(uv.x * 20.0) + floor(uv.y * 20.0), 2.0) * 0.05;
        return baseColor + pattern;
    }
    
    vec3 getViewerMaterial(vec2 uv, float time, float tvId) {
        // Viewer material - simple color change
        vec3 colors[3];
        colors[0] = vec3(0.8, 0.4, 0.2); // Orange
        colors[1] = vec3(0.2, 0.6, 0.8); // Blue
        colors[2] = vec3(0.6, 0.8, 0.3); // Green
        
        int colorIndex = int(mod(tvId, 3.0));
        return colors[colorIndex] * (0.8 + sin(time + tvId) * 0.2);
    }
    
    // Simple lighting calculation
    vec3 calculateLighting(vec3 color, vec3 normal, vec3 worldPos) {
        vec3 lightDir = normalize(uLightPosition - worldPos);
        float diff = max(dot(normal, lightDir), 0.0);
        
        vec3 viewDir = normalize(uCameraPosition - worldPos);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0) * 0.3;
        
        vec3 ambient = color * 0.3;
        vec3 diffuse = color * diff * 0.7;
        vec3 specular = vec3(1.0) * spec;
        
        return ambient + diffuse + specular;
    }
    
    void main() {
        vec3 color;
        
        // Select material based on component ID
        if (vComponentId == 2.0) { // SCREEN
            // Use third-party shader
            vec4 shaderColor;
            vec2 screenCoord = vUv * iResolution;
            mainImage(shaderColor, screenCoord);
            color = shaderColor.rgb;
        } else if (vComponentId == 0.0) { // SUPPORT
            color = getSupportMaterial(vUv, iTime);
            color = calculateLighting(color, vNormal, vWorldPosition);
        } else if (vComponentId == 1.0) { // FRAME
            color = getFrameMaterial(vUv, iTime);
            color = calculateLighting(color, vNormal, vWorldPosition);
        } else if (vComponentId == 3.0) { // BACK
            color = getBackMaterial(vUv, iTime);
            color = calculateLighting(color, vNormal, vWorldPosition);
        } else if (vComponentId == 4.0) { // VIEWER
            color = getViewerMaterial(vUv, iTime, vTvId);
            color = calculateLighting(color, vNormal, vWorldPosition);
        } else {
            color = vec3(0.5, 0.5, 0.5); // Default color
        }
        
        gl_FragColor = vec4(color, 1.0);
    }
    `;
}