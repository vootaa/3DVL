export function getPetersenGraphShader(): string {
    return `
    const float INNER_ORBIT_RADIUS = 0.15;
    const float MIDDLE_ORBIT_RADIUS = 0.30;
    const float OUTER_ORBIT_RADIUS = 0.48;
    const float LINE_THICKNESS = 0.002;
    const float CIRCLE_THICKNESS = 0.005;
    const float NODE_SIZE = 0.018;

    const float NODE_RADIUS[20] = float[20](
    0.30,  0.30,  0.30,  0.30,  0.30,
    0.15, 0.15, 0.15, 0.15, 0.15,
    0.48, 0.48, 0.48, 0.48, 0.48, 0.48, 0.48, 0.48, 0.48, 0.48);

    const float NODE_THETA[20] = float[20](
    // Middle orbit
    288.0, 0.0, 72.0, 144.0, 216.0,
    // Inner orbit
    288.0, 0.0, 72.0, 144.0, 216.0,
    // Outer orbit
    278.0, 10.0, 62.0, 154.0, 206.0, 298.0, 350.0, 82.0, 134.0, 226.0);

    // Connection lookup table
    const ivec2 CONNECTIONS[30] = ivec2[30](
    // Inner to Middle orbit connections
    ivec2(5, 0), ivec2(6, 1), ivec2(7, 2), ivec2(8, 3), ivec2(9, 4),
    // Middle to Outer orbit connections
    ivec2(0, 10), ivec2(1, 11), ivec2(2, 12), ivec2(3, 13), ivec2(4, 14), ivec2(0, 15), ivec2(1, 16), ivec2(2, 17), ivec2(3, 18), ivec2(4, 19),
    // Inner orbit internal connections
    ivec2(5, 7), ivec2(6, 8), ivec2(7, 9), ivec2(8, 5), ivec2(9, 6),
    // Outer orbit ring connections
    ivec2(10, 11), ivec2(11, 12), ivec2(12, 13), ivec2(13, 14), ivec2(14, 15), ivec2(15, 16), ivec2(16, 17), ivec2(17, 18), ivec2(18, 19), ivec2(19, 10));

    // Connection types for different styling
    const int CONN_TYPE[30] = int[30](0, 0, 0, 0, 0,  // Inner to Middle
    1, 1, 1, 1, 1,  // Middle to Outer (first set)
    2, 2, 2, 2, 2,  // Middle to Outer (second set)
    3, 3, 3, 3, 3,  // Inner circle connections
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4  // Outer ring connections
    );

    // Color schemes
    struct ColorScheme {
        vec3 background;
        vec3 innerNodes;
        vec3 middleNodes;
        vec3 outerNodes;
        vec3 innerCircle;
        vec3 middleCircle;
        vec3 outerCircle;
        vec3 connections[5];
    };

    ColorScheme getColorScheme(int schemeId) {
        ColorScheme scheme;
        
        if (schemeId == 0) {
            // Cyberpunk - Neon
            scheme.background = vec3(0.02, 0.02, 0.08);
            scheme.innerNodes = vec3(0.0, 1.0, 1.0);    // Cyan
            scheme.middleNodes = vec3(1.0, 0.0, 1.0);   // Magenta
            scheme.outerNodes = vec3(0.0, 1.0, 0.0);    // Green
            scheme.innerCircle = vec3(0.0, 0.6, 0.8);
            scheme.middleCircle = vec3(0.8, 0.0, 0.6);
            scheme.outerCircle = vec3(0.0, 0.8, 0.2);
            scheme.connections[0] = vec3(1.0, 0.2, 0.8);
            scheme.connections[1] = vec3(0.2, 0.8, 1.0);
            scheme.connections[2] = vec3(0.8, 1.0, 0.2);
            scheme.connections[3] = vec3(1.0, 0.8, 0.0);
            scheme.connections[4] = vec3(1.0, 0.0, 0.4);
        } else if (schemeId == 1) {
            // Fire & Ice
            scheme.background = vec3(0.05, 0.02, 0.02);
            scheme.innerNodes = vec3(0.2, 0.8, 1.0);    // Ice blue
            scheme.middleNodes = vec3(1.0, 0.6, 0.0);   // Orange
            scheme.outerNodes = vec3(1.0, 0.0, 0.0);    // Red
            scheme.innerCircle = vec3(0.1, 0.5, 0.8);
            scheme.middleCircle = vec3(0.8, 0.4, 0.0);
            scheme.outerCircle = vec3(0.8, 0.0, 0.0);
            scheme.connections[0] = vec3(0.8, 0.4, 1.0);
            scheme.connections[1] = vec3(1.0, 0.8, 0.2);
            scheme.connections[2] = vec3(0.4, 0.8, 1.0);
            scheme.connections[3] = vec3(1.0, 0.6, 0.2);
            scheme.connections[4] = vec3(1.0, 0.2, 0.2);
        } else if (schemeId == 2) {
            // Ocean Depths
            scheme.background = vec3(0.0, 0.02, 0.06);
            scheme.innerNodes = vec3(0.0, 0.8, 0.6);    // Turquoise
            scheme.middleNodes = vec3(0.2, 0.6, 1.0);   // Deep blue
            scheme.outerNodes = vec3(0.8, 1.0, 0.9);    // Seafoam
            scheme.innerCircle = vec3(0.0, 0.4, 0.3);
            scheme.middleCircle = vec3(0.1, 0.3, 0.6);
            scheme.outerCircle = vec3(0.4, 0.6, 0.5);
            scheme.connections[0] = vec3(0.0, 0.6, 0.8);
            scheme.connections[1] = vec3(0.4, 0.8, 1.0);
            scheme.connections[2] = vec3(0.0, 0.8, 0.4);
            scheme.connections[3] = vec3(0.6, 1.0, 0.8);
            scheme.connections[4] = vec3(0.2, 0.4, 0.8);
        } else if (schemeId == 3) {
            // Sunset Glow
            scheme.background = vec3(0.06, 0.03, 0.02);
            scheme.innerNodes = vec3(1.0, 0.8, 0.2);    // Gold
            scheme.middleNodes = vec3(1.0, 0.4, 0.2);   // Orange
            scheme.outerNodes = vec3(0.8, 0.2, 0.4);    // Pink
            scheme.innerCircle = vec3(0.6, 0.4, 0.1);
            scheme.middleCircle = vec3(0.6, 0.2, 0.1);
            scheme.outerCircle = vec3(0.4, 0.1, 0.2);
            scheme.connections[0] = vec3(1.0, 0.6, 0.4);
            scheme.connections[1] = vec3(1.0, 0.8, 0.6);
            scheme.connections[2] = vec3(0.8, 0.4, 0.6);
            scheme.connections[3] = vec3(1.0, 0.7, 0.3);
            scheme.connections[4] = vec3(0.9, 0.3, 0.5);
        } else {
            // Monochrome Matrix
            scheme.background = vec3(0.0, 0.02, 0.0);
            scheme.innerNodes = vec3(0.6, 1.0, 0.6);    // Light green
            scheme.middleNodes = vec3(0.4, 0.8, 0.4);   // Medium green
            scheme.outerNodes = vec3(0.2, 0.6, 0.2);    // Dark green
            scheme.innerCircle = vec3(0.3, 0.5, 0.3);
            scheme.middleCircle = vec3(0.2, 0.4, 0.2);
            scheme.outerCircle = vec3(0.1, 0.3, 0.1);
            scheme.connections[0] = vec3(0.5, 0.9, 0.5);
            scheme.connections[1] = vec3(0.4, 0.7, 0.4);
            scheme.connections[2] = vec3(0.6, 1.0, 0.6);
            scheme.connections[3] = vec3(0.3, 0.8, 0.3);
            scheme.connections[4] = vec3(0.7, 0.9, 0.7);
        }
        
        return scheme;
    }

    // Effect types
    int getEffectType(float time) {
        return int(mod(floor(time / 8.0), 4.0));
    }

    // Ripple effect
    float rippleEffect(vec2 uv, float time, float frequency, float amplitude) {
        float dist = length(uv);
        return sin(dist * frequency - time * 3.0) * amplitude * exp(-dist * 2.0);
    }

    // Cyberpunk scan lines
    float scanLines(vec2 uv, float time) {
        float lines = sin(uv.y * 800.0 + time * 2.0) * 0.04;
        return 1.0 + lines;
    }

    // Pulsing energy effect
    float pulseEffect(float time) {
        return 0.8 + 0.4 * sin(time * 2.0);
    }

    // Glitch effect
    vec2 glitchEffect(vec2 uv, float time) {
        float glitchStrength = 0.002 * sin(time * 10.0) * step(0.99, sin(time * 50.0));
        uv.x += glitchStrength * sin(uv.y * 100.0 + time * 20.0);
        return uv;
    }

    // Convert degrees to radians
    float degToRad(float degrees) {
        return degrees * 3.14159265359 / 180.0;
    }

    mat2 rotate2D(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat2(c, -s, s, c);
    }

    vec2 getNodePosition(int nodeId) {
        float radius = NODE_RADIUS[nodeId];
        float theta = NODE_THETA[nodeId];

        float thetaRad = degToRad(theta);
        return vec2(radius * cos(thetaRad), radius * sin(thetaRad));
    }

    int getOrbitType(int nodeId) {
        if(nodeId < 5)
            return 0;  // Middle
        else if(nodeId < 10)
            return 1; // Inner
        else
            return 2;  // Outer
    }

    vec4 drawNode(vec2 uv, vec2 pos, int nodeId, ColorScheme scheme, float effectMultiplier) {
        float dist = length(uv - pos);
        int orbitType = getOrbitType(nodeId);

        float nodeSize = NODE_SIZE * effectMultiplier;

        vec3 nodeColor;
        if(orbitType == 0)
            nodeColor = scheme.middleNodes;
        else if(orbitType == 1)
            nodeColor = scheme.innerNodes;
        else
            nodeColor = scheme.outerNodes;

        float circle = smoothstep(nodeSize, nodeSize * 0.7, dist);
        
        // Add glow effect
        float glow = exp(-dist * 30.0) * 0.3;
        circle = max(circle, glow);

        return vec4(nodeColor * effectMultiplier, circle);
    }

    vec4 drawConcentricCircles(vec2 uv, ColorScheme scheme, float effectMultiplier) {
        float dist = length(uv);

        float innerRadius = INNER_ORBIT_RADIUS;
        float middleRadius = MIDDLE_ORBIT_RADIUS;
        float outerRadius = OUTER_ORBIT_RADIUS;

        float thickness = CIRCLE_THICKNESS;

        float innerCircle = smoothstep(thickness, 0.0, abs(dist - innerRadius));
        float middleCircle = smoothstep(thickness, 0.0, abs(dist - middleRadius));
        float outerCircle = smoothstep(thickness, 0.0, abs(dist - outerRadius));

        vec3 circleColor = scheme.innerCircle * innerCircle +
            scheme.middleCircle * middleCircle +
            scheme.outerCircle * outerCircle;

        float alpha = (innerCircle + middleCircle + outerCircle) * effectMultiplier;

        return vec4(circleColor * effectMultiplier, alpha * 0.8);
    }

    vec4 drawConnection(vec2 uv, vec2 p1, vec2 p2, int connType, ColorScheme scheme, float effectMultiplier) {
        vec2 dir = p2 - p1;
        float len = length(dir);
        if(len < 0.001)
            return vec4(0.0);

        dir = normalize(dir);
        vec2 normal = vec2(-dir.y, dir.x);

        vec2 uv_rel = uv - p1;
        float alongLine = dot(uv_rel, dir);
        float perpDist = abs(dot(uv_rel, normal));

        if(alongLine < -0.01 || alongLine > len + 0.01)
            return vec4(0.0);

        float thickness = LINE_THICKNESS * effectMultiplier;
        vec3 lineColor = scheme.connections[connType];

        float line = smoothstep(thickness, thickness * 0.5, perpDist);
        
        // Add flowing effect
        float flow = sin(alongLine * 20.0 - iTime * 5.0) * 0.2 + 0.8;
        line *= flow;

        return vec4(lineColor * effectMultiplier, line * 0.9);
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);
        
        // Get current color scheme (changes every 10 seconds)
        int schemeId = int(mod(floor(iTime / 10.0), 5.0));
        ColorScheme scheme = getColorScheme(schemeId);
        
        // Get current effect type (changes every 8 seconds)
        int effectType = getEffectType(iTime);
        
        // Apply glitch effect if needed
        if (effectType == 3) {
            uv = glitchEffect(uv, iTime);
        }

        float rotation = iTime * 0.1;
        mat2 rotMat = rotate2D(rotation);
        uv = rotMat * uv;

        fragColor = vec4(scheme.background, 1.0);
        
        // Apply various effects based on effect type
        float effectMultiplier = 1.0;
        float backgroundEffect = 1.0;
        
        if (effectType == 0) {
            // Ripple effect
            float ripple = rippleEffect(uv, iTime, 15.0, 0.1);
            effectMultiplier = 1.0 + ripple;
            backgroundEffect = 1.0 + ripple * 0.5;
        } else if (effectType == 1) {
            // Pulsing effect
            effectMultiplier = pulseEffect(iTime);
            backgroundEffect = pulseEffect(iTime * 0.5);
        } else if (effectType == 2) {
            // Scan lines effect
            backgroundEffect = scanLines(uv, iTime);
            effectMultiplier = 1.0 + 0.2 * sin(iTime * 3.0);
        } else if (effectType == 3) {
            // Cyberpunk glitch
            effectMultiplier = 1.0 + 0.3 * sin(iTime * 7.0);
            backgroundEffect = scanLines(uv, iTime) * 0.9;
        }

        fragColor.rgb *= backgroundEffect;

        vec4 circles = drawConcentricCircles(uv, scheme, effectMultiplier);
        fragColor.rgb = mix(fragColor.rgb, circles.rgb, circles.a);

        for(int i = 0; i < 30; i++) {
            int fromId = CONNECTIONS[i].x;
            int toId = CONNECTIONS[i].y;
            int connType = CONN_TYPE[i];

            vec2 fromPos = getNodePosition(fromId);
            vec2 toPos = getNodePosition(toId);

            vec4 lineColor = drawConnection(uv, fromPos, toPos, connType, scheme, effectMultiplier);
            fragColor.rgb = mix(fragColor.rgb, lineColor.rgb, lineColor.a);
        }

        for(int i = 0; i < 20; i++) {
            vec2 pos = getNodePosition(i);
            vec4 nodeColor = drawNode(uv, pos, i, scheme, effectMultiplier);
            fragColor.rgb = mix(fragColor.rgb, nodeColor.rgb, nodeColor.a);
        }

        float vignette = 1.0 - smoothstep(0.6, 1.2, length(uv));
        fragColor.rgb *= vignette;

        fragColor.a = 1.0;
    }
    `;
}