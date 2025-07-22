export function testShader(): string {
    return `
        void mainImage(out vec4 fragColor, in vec2 fragCoord) {
            vec2 uv = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);
            float time = iTime * 0.5;
            float switchInterval = 3.0;
            float effectIndex = mod(floor(iTime / switchInterval), 2.0);
            
            if (effectIndex < 0.5) {
                float dist = length(uv);
                float angle = atan(uv.y, uv.x) + time;
                vec3 color = vec3(
                    0.5 + 0.5 * sin(angle * 3.0),
                    0.5 + 0.5 * sin(angle * 3.0 + 2.0),
                    0.5 + 0.5 * sin(angle * 3.0 + 4.0)
                );
                float ring = smoothstep(0.4, 0.35, dist) * smoothstep(0.3, 0.35, dist);
                fragColor = vec4(color * ring, 1.0);
            } else {
                vec3 color = vec3(
                    0.5 + 0.5 * sin(time + uv.x * 10.0),
                    0.5 + 0.5 * sin(time + uv.y * 10.0 + 2.0),
                    0.5 + 0.5 * sin(time + (uv.x + uv.y) * 5.0 + 4.0)
                );
                fragColor = vec4(color, 1.0);
            }
            
            if (fragColor.rgb == vec3(0.0)) {
                fragColor = vec4(0.02, 0.02, 0.05, 1.0);
            }
        }
    `;
}