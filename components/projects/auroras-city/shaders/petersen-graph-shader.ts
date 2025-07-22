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

    vec4 drawNode(vec2 uv, vec2 pos, int nodeId) {
        float dist = length(uv - pos);
        int orbitType = getOrbitType(nodeId);

        float nodeSize = NODE_SIZE;

        vec3 nodeColor;
        if(orbitType == 0)
            nodeColor = vec3(1.0, 0.4, 0.7);  // Pink - Middle
        else if(orbitType == 1)
            nodeColor = vec3(0.2, 0.6, 1.0); // Blue - Inner
        else
            nodeColor = vec3(1.0, 0.8, 0.2);        // Gold - Outer

        float circle = smoothstep(nodeSize, nodeSize * 0.7, dist);

        return vec4(nodeColor, circle);
    }

    vec4 drawConcentricCircles(vec2 uv) {
        float dist = length(uv);

        float innerRadius = INNER_ORBIT_RADIUS;
        float middleRadius = MIDDLE_ORBIT_RADIUS;
        float outerRadius = OUTER_ORBIT_RADIUS;

        float thickness = CIRCLE_THICKNESS;

        float innerCircle = smoothstep(thickness, 0.0, abs(dist - innerRadius));
        float middleCircle = smoothstep(thickness, 0.0, abs(dist - middleRadius));
        float outerCircle = smoothstep(thickness, 0.0, abs(dist - outerRadius));

        vec3 innerColor = vec3(0.1, 0.3, 0.5) * 0.8;   // Dim blue
        vec3 middleColor = vec3(0.5, 0.2, 0.35) * 0.8; // Dim pink
        vec3 outerColor = vec3(0.5, 0.4, 0.1) * 0.8;   // Dim gold

        vec3 circleColor = innerColor * innerCircle +
            middleColor * middleCircle +
            outerColor * outerCircle;

        float alpha = innerCircle + middleCircle + outerCircle;

        return vec4(circleColor, alpha * 0.6);
    }

    vec4 drawConnection(vec2 uv, vec2 p1, vec2 p2, int connType) {
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

        float thickness = LINE_THICKNESS;

        vec3 lineColor;
        switch(connType) {
            case 0:
                lineColor = vec3(0.7, 0.3, 0.7);
                break;  // Purple - Inner to Middle
            case 1:
                lineColor = vec3(0.3, 0.7, 0.3);
                break;  // Green - Middle to Outer (set 1)
            case 2:
                lineColor = vec3(0.3, 0.5, 0.9);
                break;  // Blue - Middle to Outer (set 2)
            case 3:
                lineColor = vec3(0.9, 0.6, 0.2);
                break;  // Orange - Inner circle
            case 4:
                lineColor = vec3(0.9, 0.4, 0.4);
                break;  // Red - Outer ring
            default:
                lineColor = vec3(0.6, 0.6, 0.6);
                break; // Gray
        }

        float line = smoothstep(thickness, thickness * 0.5, perpDist);
        return vec4(lineColor, line * 0.7);
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);

        float rotation = iTime * 0.1;
        mat2 rotMat = rotate2D(rotation);
        uv = rotMat * uv;

        vec3 bgColor = vec3(0.05, 0.05, 0.08);
        fragColor = vec4(bgColor, 1.0);

        vec4 circles = drawConcentricCircles(uv);
        fragColor.rgb = mix(fragColor.rgb, circles.rgb, circles.a);

        for(int i = 0; i < 30; i++) {
            int fromId = CONNECTIONS[i].x;
            int toId = CONNECTIONS[i].y;
            int connType = CONN_TYPE[i];

            vec2 fromPos = getNodePosition(fromId);
            vec2 toPos = getNodePosition(toId);

            vec4 lineColor = drawConnection(uv, fromPos, toPos, connType);
            fragColor.rgb = mix(fragColor.rgb, lineColor.rgb, lineColor.a);
        }

        for(int i = 0; i < 20; i++) {
            vec2 pos = getNodePosition(i);
            vec4 nodeColor = drawNode(uv, pos, i);
            fragColor.rgb = mix(fragColor.rgb, nodeColor.rgb, nodeColor.a);
        }

        float vignette = 1.0 - smoothstep(0.6, 1.2, length(uv));
        fragColor.rgb *= vignette;

        fragColor.a = 1.0;
    }
    `;
}