export const plasmaShader = `
    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
        
        float v = 0.0;
        v += sin(p.x * 10.0 + iTime);
        v += sin(p.y * 10.0 + iTime);
        v += sin((p.x + p.y) * 10.0 + iTime);
        v += sin(sqrt(p.x * p.x + p.y * p.y) * 10.0 + iTime);
        
        vec3 col = vec3(
            0.5 + 0.5 * sin(v), 
            0.5 + 0.5 * cos(v), 
            0.5 + 0.5 * sin(v + 1.57)
        );
        
        fragColor = vec4(col, 1.0);
    }
`