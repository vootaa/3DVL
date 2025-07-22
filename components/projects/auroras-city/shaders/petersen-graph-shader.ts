export function getPetersenGraphShader(): string {
    return `
    const float INNER_ORBIT_RADIUS = 0.15;
    const float MIDDLE_ORBIT_RADIUS = 0.30;
    const float OUTER_ORBIT_RADIUS = 0.48;
    const float LINE_THICKNESS = 0.002;
    const float CIRCLE_THICKNESS = 0.005;
    const float NODE_SIZE = 0.018;

    const float NODE_RADIUS[20] = float[20](0.30, 0.30, 0.30, 0.30, 0.30, 0.15, 0.15, 0.15, 0.15, 0.15, 0.48, 0.48, 0.48, 0.48, 0.48, 0.48, 0.48, 0.48, 0.48, 0.48);

    const float NODE_THETA[20] = float[20](
    //Middle orbit
    288.0, 0.0, 72.0, 144.0, 216.0,
    //Inner orbit
    288.0, 0.0, 72.0, 144.0, 216.0,
    //Outer orbit
    278.0, 10.0, 62.0, 154.0, 206.0, 298.0, 350.0, 82.0, 134.0, 226.0);

    const ivec2 CONNECTIONS[30] = ivec2[30](
    //Inner to Middle orbit connections
    ivec2(5, 0), ivec2(6, 1), ivec2(7, 2), ivec2(8, 3), ivec2(9, 4),
    //Middle to Outer orbit connections
    ivec2(0, 10), ivec2(1, 11), ivec2(2, 12), ivec2(3, 13), ivec2(4, 14), ivec2(0, 15), ivec2(1, 16), ivec2(2, 17), ivec2(3, 18), ivec2(4, 19),
    //Inner orbit internal connections
    ivec2(5, 7), ivec2(6, 8), ivec2(7, 9), ivec2(8, 5), ivec2(9, 6),
    //Outer orbit ring connections
    ivec2(10, 11), ivec2(11, 12), ivec2(12, 13), ivec2(13, 14), ivec2(14, 15), ivec2(15, 16), ivec2(16, 17), ivec2(17, 18), ivec2(18, 19), ivec2(19, 10));

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

        if(schemeId == 0) {
        //Cyberpunk - Neon
            scheme.background = vec3(0.02, 0.02, 0.08);
            scheme.innerNodes = vec3(0.0, 1.0, 1.0);
            scheme.middleNodes = vec3(1.0, 0.0, 1.0);
            scheme.outerNodes = vec3(0.0, 1.0, 0.0);
            scheme.innerCircle = vec3(0.0, 0.6, 0.8);
            scheme.middleCircle = vec3(0.8, 0.0, 0.6);
            scheme.outerCircle = vec3(0.0, 0.8, 0.2);
            scheme.connections[0] = vec3(1.0, 0.2, 0.8);
            scheme.connections[1] = vec3(0.2, 0.8, 1.0);
            scheme.connections[2] = vec3(0.8, 1.0, 0.2);
            scheme.connections[3] = vec3(1.0, 0.8, 0.0);
            scheme.connections[4] = vec3(1.0, 0.0, 0.4);
        } else if(schemeId == 1) {
        //Fire & Ice
            scheme.background = vec3(0.05, 0.02, 0.02);
            scheme.innerNodes = vec3(0.2, 0.8, 1.0);
            scheme.middleNodes = vec3(1.0, 0.6, 0.0);
            scheme.outerNodes = vec3(1.0, 0.0, 0.0);
            scheme.innerCircle = vec3(0.1, 0.5, 0.8);
            scheme.middleCircle = vec3(0.8, 0.4, 0.0);
            scheme.outerCircle = vec3(0.8, 0.0, 0.0);
            scheme.connections[0] = vec3(0.8, 0.4, 1.0);
            scheme.connections[1] = vec3(1.0, 0.8, 0.2);
            scheme.connections[2] = vec3(0.4, 0.8, 1.0);
            scheme.connections[3] = vec3(1.0, 0.6, 0.2);
            scheme.connections[4] = vec3(1.0, 0.2, 0.2);
        } else if(schemeId == 2) {
        //Ocean Depths
            scheme.background = vec3(0.0, 0.02, 0.06);
            scheme.innerNodes = vec3(0.0, 0.8, 0.6);
            scheme.middleNodes = vec3(0.2, 0.6, 1.0);
            scheme.outerNodes = vec3(0.8, 1.0, 0.9);
            scheme.innerCircle = vec3(0.0, 0.4, 0.3);
            scheme.middleCircle = vec3(0.1, 0.3, 0.6);
            scheme.outerCircle = vec3(0.4, 0.6, 0.5);
            scheme.connections[0] = vec3(0.0, 0.6, 0.8);
            scheme.connections[1] = vec3(0.4, 0.8, 1.0);
            scheme.connections[2] = vec3(0.0, 0.8, 0.4);
            scheme.connections[3] = vec3(0.6, 1.0, 0.8);
            scheme.connections[4] = vec3(0.2, 0.4, 0.8);
        } else if(schemeId == 3) {
        //Sunset Glow
            scheme.background = vec3(0.06, 0.03, 0.02);
            scheme.innerNodes = vec3(1.0, 0.8, 0.2);
            scheme.middleNodes = vec3(1.0, 0.4, 0.2);
            scheme.outerNodes = vec3(0.8, 0.2, 0.4);
            scheme.innerCircle = vec3(0.6, 0.4, 0.1);
            scheme.middleCircle = vec3(0.6, 0.2, 0.1);
            scheme.outerCircle = vec3(0.4, 0.1, 0.2);
            scheme.connections[0] = vec3(1.0, 0.6, 0.4);
            scheme.connections[1] = vec3(1.0, 0.8, 0.6);
            scheme.connections[2] = vec3(0.8, 0.4, 0.6);
            scheme.connections[3] = vec3(1.0, 0.7, 0.3);
            scheme.connections[4] = vec3(0.9, 0.3, 0.5);
        } else {
        //Monochrome Matrix
            scheme.background = vec3(0.0, 0.02, 0.0);
            scheme.innerNodes = vec3(0.6, 1.0, 0.6);
            scheme.middleNodes = vec3(0.4, 0.8, 0.4);
            scheme.outerNodes = vec3(0.2, 0.6, 0.2);
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

    // ===== PLASMA EFFECTS =====

    float hash(float n) {
        return fract(sin(n) * 43758.5453);
    }

    float noise(in vec2 x) {
        vec2 p = floor(x);
        vec2 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        float n = p.x + p.y * 57.0;
        float res = mix(mix(hash(n), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
        return res;
    }

    mat2 mm2(in float a) {
        float c = cos(a), s = sin(a);
        return mat2(c, -s, s, c);
    }

    float flow(in vec2 p, in float t) {
        float z = 2.0;
        float rz = 0.0;
        vec2 bp = p;

        for(float i = 1.0; i < 3.0; i++) {
            p += iTime * 0.1;
            float n = noise(p * 4.0 + t * 0.8);
            rz += (sin(n * 6.0) * 0.5 + 0.5) / z;
            p = mix(bp, p, 0.6);
            z *= 2.0;
            p *= 2.01;
            p = p * mm2(iTime * 0.04 * i);
        }
        return rz;
    }

    // ===== CYBERPUNK EFFECTS =====

    float rippleEffect(vec2 uv, float time, float frequency, float amplitude) {
        float dist = length(uv);
        return sin(dist * frequency - time * 3.0) * amplitude * exp(-dist * 2.0);
    }

    float scanLines(vec2 uv, float time) {
        float lines = sin(uv.y * 800.0 + time * 2.0) * 0.04;
        return 1.0 + lines;
    }

    float digitalNoise(vec2 uv, float time) {
        vec2 grid = floor(uv * 100.0);
        float noise = fract(sin(dot(grid, vec2(12.9898, 78.233)) + time) * 43758.5453);
        return smoothstep(0.95, 1.0, noise) * 0.3;
    }

    float hologramFlicker(float time) {
        float flicker = sin(time * 50.0) * sin(time * 13.0) * sin(time * 7.0);
        return 0.8 + 0.2 * smoothstep(-0.5, 0.5, flicker);
    }

    vec2 enhancedGlitch(vec2 uv, float time) {
        float glitchLine = floor(uv.y * 20.0) / 20.0;
        float glitchTime = time * 15.0 + glitchLine * 100.0;
        float glitchStrength = sin(glitchTime) * step(0.95, sin(glitchTime * 3.0));

        uv.x += glitchStrength * 0.005 * sin(uv.y * 300.0);
        uv.y += glitchStrength * 0.002 * sin(uv.x * 500.0 + time * 30.0);

        return uv;
    }

    vec2 dataCorruption(vec2 uv, float time) {
        float corruption = sin(time * 20.0) * step(0.98, sin(time * 100.0 + uv.y * 50.0));
        uv.x += corruption * 0.01 * sin(uv.y * 200.0);
        return uv;
    }

    float matrixRain(vec2 uv, float time) {
        vec2 grid = floor(uv * vec2(20.0, 40.0));
        float speed = time * 2.0 + grid.x * 0.5;
        float rain = fract(speed - grid.y * 0.1);
        float intensity = smoothstep(0.9, 1.0, rain) * exp(-abs(uv.x) * 2.0);
        return intensity;
    }

    float circuitPulse(vec2 uv, float time) {
        float dist = length(uv);
        float angle = atan(uv.y, uv.x);
        float pulse = sin(dist * 15.0 - time * 8.0 + angle * 2.0);
        float circuit = step(0.7, pulse) * (1.0 - smoothstep(0.3, 0.5, dist));
        return circuit * 0.5;
    }

    float quantumWave(vec2 uv, float time) {
        float wave1 = sin(uv.x * 10.0 + time * 3.0) * sin(uv.y * 8.0 + time * 2.0);
        float wave2 = sin(length(uv) * 12.0 - time * 4.0);
        float quantum = (wave1 + wave2) * 0.3;
        return smoothstep(-0.2, 0.8, quantum);
    }

    float neuralPulse(vec2 uv, float time) {
        vec2 center = vec2(sin(time * 0.5), cos(time * 0.3)) * 0.2;
        float dist = length(uv - center);
        float pulse = sin(dist * 20.0 - time * 6.0);
        return smoothstep(0.5, 1.0, pulse) * exp(-dist * 3.0);
    }

    float dataStream(vec2 uv, float time) {
        float stream = 0.0;
        for(int i = 0; i < 5; i++) {
            float offset = float(i) * 0.2;
            float y = fract(uv.y * 3.0 + time * 1.5 + offset);
            float line = smoothstep(0.9, 1.0, y) * smoothstep(0.1, 0.0, y);
            stream += line * (0.5 + 0.5 * sin(time * 5.0 + offset * 10.0));
        }
        return stream;
    }

    float energyShield(vec2 uv, float time) {
        float dist = length(uv);
        float shield = sin(dist * 30.0 + time * 10.0) * sin(atan(uv.y, uv.x) * 8.0 + time * 3.0);
        float boundary = smoothstep(0.4, 0.45, dist) * smoothstep(0.55, 0.5, dist);
        return max(0.0, shield) * boundary;
    }

    vec2 spaceTimeWarp(vec2 uv, float time) {
        float dist = length(uv);
        float angle = atan(uv.y, uv.x);
        float warp = sin(dist * 8.0 - time * 2.0) * 0.1;
        angle += warp;
        return vec2(cos(angle), sin(angle)) * dist;
    }

    float particleSystem(vec2 uv, float time) {
        float particles = 0.0;
        for(int i = 0; i < 8; i++) {
            float t = time + float(i) * 0.5;
            vec2 pos = vec2(sin(t * 0.8 + float(i)), cos(t * 0.6 + float(i) * 1.3)) * 0.3;
            float dist = length(uv - pos);
            particles += 0.01 / (dist + 0.01);
        }
        return min(particles, 1.0);
    }

    // ===== TEXTURE GENERATORS =====

    // Hexagonal grid texture
    float hexGrid(vec2 uv, float scale) {
        vec2 grid = uv * scale;
        vec2 c = abs(fract(grid) - 0.5);
        float hex = max((c.x * 1.5 + c.y), c.y * 2.0) - 1.0;
        return smoothstep(0.01, 0.0, abs(hex));
    }

    //Circuit board texture
    float circuitBoard(vec2 uv, float time) {
        vec2 grid = floor(uv * 50.0);
        float pattern = step(0.8, fract(sin(dot(grid, vec2(12.9898, 78.233))) * 43758.5453));

        //Add flow effect
        float flow = sin(grid.x * 0.1 + time * 2.0) * sin(grid.y * 0.1 + time * 1.5);
        pattern *= (0.3 + 0.7 * smoothstep(-0.5, 0.5, flow));

        return pattern * 0.05;
    }

    //Star field background
    float starField(vec2 uv, float time) {
        vec2 grid = floor(uv * 200.0);
        float star = step(0.995, fract(sin(dot(grid, vec2(12.9898, 78.233)) + time * 0.1) * 43758.5453));
        float twinkle = 0.5 + 0.5 * sin(time * 10.0 + grid.x + grid.y);
        return star * twinkle * 0.3;
    }

    //Data flow background
    float dataFlowBackground(vec2 uv, float time) {
        float flow = 0.0;
        for(int i = 0; i < 3; i++) {
            float offset = float(i) * 0.3;
            vec2 flowUV = uv + vec2(sin(time * 0.5 + offset), cos(time * 0.3 + offset * 2.0)) * 0.1;
            float layer = sin(flowUV.x * 20.0 + time * 3.0 + offset * 10.0) *
                sin(flowUV.y * 15.0 + time * 2.0 + offset * 5.0);
            flow += smoothstep(0.7, 1.0, layer) * 0.02;
        }
        return flow;
    }

    //Energy field background
    float energyField(vec2 uv, float time) {
        float field = 0.0;
        vec2 center = vec2(0.0);
        float dist = length(uv - center);

        //Multi-layer energy waves
        for(float i = 1.0; i <= 3.0; i++) {
            float wave = sin(dist * 10.0 * i - time * 2.0 * i) / i;
            field += wave * 0.01;
        }

        //Radial energy lines
        float angle = atan(uv.y, uv.x);
        float radial = sin(angle * 8.0 + time * 3.0) * exp(-dist * 2.0);
        field += radial * 0.02;

        return field;
    }

    //Main background texture function
    vec3 generateBackground(vec2 uv, float time, int effectType, ColorScheme scheme) {
        vec3 background = scheme.background;

        //Basic texture layers
        float hex = hexGrid(uv, 30.0);
        float circuit = circuitBoard(uv, time);
        float stars = starField(uv, time);
        float dataFlow = dataFlowBackground(uv, time);
        float energy = energyField(uv, time);

        //Select different background combinations based on effect type
        if(effectType == 0 || effectType == 1) {
            //Cyberpunk - Circuit board + hexagonal grid
            background += scheme.innerCircle * hex * 0.1;
            background += scheme.connections[0] * circuit;
            background += scheme.middleNodes * stars;
        } else if(effectType == 2 || effectType == 3) {
            //Glitch effect - Data flow + circuit
            background += scheme.connections[1] * dataFlow * 2.0;
            background += scheme.outerNodes * circuit * 0.5;
            background += vec3(0.1, 0.05, 0.15) * hex * 0.2;
        } else if(effectType == 4) {
            //Hologram flicker - Energy field + star field
            background += scheme.innerNodes * energy * 1.5;
            background += scheme.middleCircle * stars * 2.0;
            background += scheme.connections[3] * hex * 0.05;
        } else if(effectType == 5) {
            //Plasma - Energy field dominant
            background += scheme.outerCircle * energy * 2.0;
            background += scheme.connections[4] * dataFlow;
            background += scheme.innerCircle * circuit * 0.3;
        } else if(effectType >= 6 && effectType <= 9) {
            //Matrix, circuit pulse, quantum wave, neural pulse
            background += scheme.connections[2] * dataFlow * 1.5;
            background += scheme.innerNodes * energy;
            background += scheme.middleCircle * hex * 0.15;
            background += scheme.outerNodes * stars * 0.5;
        } else {
            //Other effects - mixed background
            background += scheme.innerCircle * hex * 0.08;
            background += scheme.connections[1] * circuit * 0.7;
            background += scheme.outerNodes * energy * 0.8;
            background += scheme.middleNodes * dataFlow;
            background += vec3(0.05, 0.1, 0.15) * stars;
        }

        //Add subtle noise texture
        float fineNoise = noise(uv * 100.0 + time * 0.5) * 0.02;
        background += vec3(fineNoise);

        return clamp(background, vec3(0.0), vec3(1.0));
    }

    // ===== UTILITY FUNCTIONS =====

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
            return 0;  //Middle
        else if(nodeId < 10)
            return 1; // Inner
        else
            return 2;             //Outer
    }

    int getEffectType(float time) {
        return int(mod(floor(time / 8.0), 14.0)); // 0-13 effects
    }

    // ===== DRAWING FUNCTIONS =====

    vec4 drawConcentricCircles(vec2 uv, ColorScheme scheme, float effectMultiplier) {
        float dist = length(uv);
        float thickness = CIRCLE_THICKNESS;

        float innerCircle = smoothstep(thickness, 0.0, abs(dist - INNER_ORBIT_RADIUS));
        float middleCircle = smoothstep(thickness, 0.0, abs(dist - MIDDLE_ORBIT_RADIUS));
        float outerCircle = smoothstep(thickness, 0.0, abs(dist - OUTER_ORBIT_RADIUS));

        vec3 circleColor = scheme.innerCircle * innerCircle +
            scheme.middleCircle * middleCircle +
            scheme.outerCircle * outerCircle;

        float alpha = (innerCircle + middleCircle + outerCircle) * effectMultiplier;
        return vec4(circleColor * effectMultiplier, alpha * 0.8);
    }

    vec4 drawStandardConnection(vec2 uv, vec2 p1, vec2 p2, int connType, ColorScheme scheme, float effectMultiplier) {
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

    //Add flowing effect
        float flow = sin(alongLine * 20.0 - iTime * 5.0) * 0.2 + 0.8;
        line *= flow;

        return vec4(lineColor * effectMultiplier, line * 0.9);
    }

    vec4 drawPlasmaConnection(vec2 uv, vec2 p1, vec2 p2, int connType, float seed, vec3 baseColor, float effectMultiplier) {
        vec2 dir = p2 - p1;
        float len = length(dir);
        if(len < 0.001)
            return vec4(0.0);

        dir = normalize(dir);
        vec2 normal = vec2(-dir.y, dir.x);
        vec2 uv_rel = uv - p1;
        float alongLine = dot(uv_rel, dir);
        float perpLine = dot(uv_rel, normal);

        if(alongLine < -0.01 || alongLine > len + 0.01)
            return vec4(0.0);

        float normAlong = clamp(alongLine / len, 0.0, 1.0);
        float time = iTime * 1.1;

    //Base arc width
        float arcWidth = 0.0025 * (0.8 + 0.2 * len / 0.5) * effectMultiplier;

    //Distortion amount based on connection type
        float distortionAmount = 0.02;
        if(connType == 3)
            distortionAmount = 0.008;  //Inner circle - minimal
        else if(connType == 0)
            distortionAmount = 0.015; // Middle to inner
        else if(connType == 4)
            distortionAmount = 0.025; // Outer circle - maximum

    //Noise calculation
        float noise1 = noise(vec2(normAlong * 5.0 + time * 0.5, seed * 10.0)) * 2.0 - 1.0;
        float noise2 = noise(vec2(normAlong * 20.0 - time * 0.7, seed * 5.0)) * 2.0 - 1.0;
        float combinedNoise = noise1 * 0.7 + noise2 * 0.3;

    //Calculate distorted distance
        float distortedDist = abs(perpLine - distortionAmount * combinedNoise * effectMultiplier);

    //Main arc path
        float thickness = arcWidth * (0.6 + 0.4 * noise(vec2(normAlong * 5.0, time * 0.3 + seed * 10.0)));
        float mainArc = smoothstep(thickness, thickness * 0.3, distortedDist);

    //Glow effect
        float glow = 0.2 / (1.0 + 15.0 * distortedDist * distortedDist);

    //Color variation
        vec3 arcColor = baseColor + 0.2 * sin(vec3(3.0, 1.0, 2.0) * (time * 0.5 + normAlong * 3.0));

    //Flicker effect
        float flickerAmount = 0.2 + float(connType) * 0.05;
        float flicker = (1.0 - flickerAmount) + flickerAmount * sin(time * (3.0 + seed * 3.0) + normAlong * 4.0);

        float arcIntensity = mainArc * flicker * 1.2 * effectMultiplier + glow * 0.9;
        vec3 finalColor = arcColor * arcIntensity;

    //Spark effect
        if(noise(vec2(time * 5.0 + seed * 15.0, normAlong * 10.0)) > 0.9) {
            float sparkSize = (connType == 4) ? 25.0 : 20.0;
            float sparkDist = length(vec2(normAlong - noise(vec2(time * 1.5, seed)) * 0.08, perpLine) * sparkSize);
            float sparkBrightness = (connType == 4) ? 1.2 : 0.7;
            float spark = sparkBrightness / (1.0 + sparkDist * sparkDist);
            finalColor += arcColor * spark * effectMultiplier;
        }

        float alpha = min(arcIntensity * 0.8, 1.0);
        return vec4(finalColor, alpha);
    }

    vec4 drawStandardNode(vec2 uv, vec2 pos, int nodeId, ColorScheme scheme, float effectMultiplier) {
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
        float glow = exp(-dist * 30.0) * 0.3;
        circle = max(circle, glow);

        return vec4(nodeColor * effectMultiplier, circle);
    }

    vec4 drawPlasmaNode(vec2 uv, vec2 pos, int nodeId, vec3 nodeColor, float effectMultiplier) {
        float dist = length(uv - pos);
        float nodeSize = NODE_SIZE * effectMultiplier;

    //Flow effect calculation
        float flowEffect = flow(uv * 15.0, iTime * 0.2 + float(nodeId));
        float glowSize = nodeSize * (1.8 + 0.4 * sin(iTime * 2.0 + float(nodeId)));

    //Core and glow effect
        float core = smoothstep(nodeSize, nodeSize * 0.4, dist);
        float glow = smoothstep(glowSize, nodeSize, dist) * 0.8 * flowEffect;

        vec3 finalNodeColor = mix(nodeColor, vec3(1.0), 0.3 + 0.3 * flowEffect);
        float alpha = max(core, glow * 0.8);
        vec3 finalColor = finalNodeColor * (core + glow * 1.2) * effectMultiplier;

        return vec4(finalColor, alpha);
    }

    // ===== MAIN FUNCTION =====

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    //Initialize coordinates
        vec2 localUV = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);
        vec2 originalUV = localUV;

    //Get current color scheme and effect type
        int schemeId = int(mod(floor(iTime / 10.0), 5.0));
        ColorScheme scheme = getColorScheme(schemeId);
        int effectType = getEffectType(iTime);

    //Apply pre-distortion effects
        vec2 workingUV = localUV;
        if(effectType == 2) {
            workingUV = enhancedGlitch(workingUV, iTime);
        } else if(effectType == 3) {
            workingUV = dataCorruption(workingUV, iTime);
        }

    //Generate complex background
        vec3 complexBackground = generateBackground(originalUV, iTime, effectType, scheme);

    //Initialize output color
        vec4 outputColor = vec4(complexBackground, 1.0);

    //Apply rotation
        float rotation = iTime * 0.1;
        mat2 rotMat = rotate2D(rotation);

    //Determine rendering mode and effects
        bool usePlasmaEffect = (effectType == 5); // Plasma mode
        float effectMultiplier = 1.0;
        float backgroundEffect = 1.0;
        vec3 additiveEffect = vec3(0.0);

    //Apply effects based on type
        if(effectType == 0) {
        //Ripple effect
            float ripple = rippleEffect(originalUV, iTime, 15.0, 0.1);
            effectMultiplier = 1.0 + ripple;
            backgroundEffect = 1.0 + ripple * 0.5;
        } else if(effectType == 1) {
        //Scan lines + CRT effect
            backgroundEffect = scanLines(originalUV, iTime);
            effectMultiplier = 1.0 + 0.2 * sin(iTime * 3.0);
            additiveEffect = vec3(digitalNoise(originalUV, iTime));
        } else if(effectType == 2) {
        //Enhanced glitch
            effectMultiplier = 1.0 + 0.3 * sin(iTime * 7.0);
            backgroundEffect = 0.9;
            additiveEffect = vec3(0.1, 0.05, 0.15) * sin(iTime * 20.0) * step(0.97, sin(iTime * 50.0));
        } else if(effectType == 3) {
        //Data corruption
            effectMultiplier = 1.0 + 0.4 * sin(iTime * 5.0);
            backgroundEffect = 0.8 + 0.2 * sin(iTime * 15.0);
            additiveEffect = vec3(digitalNoise(originalUV, iTime * 2.0)) * 0.5;
        } else if(effectType == 4) {
        //Hologram flicker
            float flickerValue = hologramFlicker(iTime);
            effectMultiplier = clamp(flickerValue, 0.5, 1.5);
            backgroundEffect = clamp(hologramFlicker(iTime * 1.3), 0.5, 1.5);
            additiveEffect = clamp(vec3(0.0, 0.1, 0.2) * sin(iTime * 30.0) * 0.5, vec3(0.0), vec3(0.3));
        } else if(effectType == 5) {
        //Plasma effect
            effectMultiplier = 1.0 + 0.3 * sin(iTime * 2.0);
            backgroundEffect = 1.0 + 0.2 * sin(iTime * 1.5);
        } else if(effectType == 6) {
    //Matrix Rain
            float rain = matrixRain(originalUV, iTime);
            additiveEffect = scheme.innerNodes * rain * 0.6;
            effectMultiplier = 1.0 + rain * 0.3;
            backgroundEffect = 1.0 + rain * 0.2;
        } else if(effectType == 7) {
    //Circuit Pulse
            float circuit = circuitPulse(originalUV, iTime);
            additiveEffect = scheme.connections[1] * circuit;
            effectMultiplier = 1.0 + circuit * 0.5;
            backgroundEffect = 1.0 + circuit * 0.3;
        } else if(effectType == 8) {
    //Quantum Wave
            float quantum = quantumWave(originalUV, iTime);
            workingUV = mix(workingUV, workingUV + vec2(quantum * 0.02), 0.5);
            effectMultiplier = 1.0 + quantum * 0.4;
            additiveEffect = scheme.outerNodes * quantum * 0.3;
        } else if(effectType == 9) {
    //Neural Pulse
            float neural = neuralPulse(originalUV, iTime);
            effectMultiplier = 1.0 + neural * 0.6;
            additiveEffect = mix(scheme.innerNodes, scheme.middleNodes, 0.5) * neural * 0.4;
        } else if(effectType == 10) {
    //Data Stream
            float stream = dataStream(originalUV, iTime);
            additiveEffect = scheme.connections[2] * stream * 0.5;
            effectMultiplier = 1.0 + stream * 0.3;
        } else if(effectType == 11) {
    //Energy Shield
            float shield = energyShield(originalUV, iTime);
            additiveEffect = scheme.outerCircle * shield * 0.8;
            effectMultiplier = 1.0 + shield * 0.4;
            backgroundEffect = 1.0 + shield * 0.2;
        } else if(effectType == 12) {
    //Space-Time Warp
            workingUV = spaceTimeWarp(workingUV, iTime);
            effectMultiplier = 1.0 + 0.2 * sin(iTime * 3.0);
            additiveEffect = vec3(0.1, 0.2, 0.3) * sin(iTime * 4.0) * 0.3;
        } else if(effectType == 13) {
    //Particle System
            float particles = particleSystem(originalUV, iTime);
            additiveEffect = scheme.middleNodes * particles * 0.4;
            effectMultiplier = 1.0 + particles * 0.2;
            backgroundEffect = 1.0 + particles * 0.1;
        }

    //Apply background effects
        outputColor.rgb = clamp(outputColor.rgb * backgroundEffect + additiveEffect, vec3(0.0), vec3(1.0));

    //Draw concentric circles
        vec4 circles = drawConcentricCircles(localUV, scheme, effectMultiplier);
        outputColor.rgb = mix(outputColor.rgb, clamp(circles.rgb, vec3(0.0), vec3(1.0)), clamp(circles.a, 0.0, 1.0));

    //Draw connections
        for(int i = 0; i < 30; i++) {
            int fromId = CONNECTIONS[i].x;
            int toId = CONNECTIONS[i].y;
            int connType = CONN_TYPE[i];

            vec2 fromPos = getNodePosition(fromId);
            vec2 toPos = getNodePosition(toId);
            fromPos = rotMat * fromPos;
            toPos = rotMat * toPos;

            vec4 lineColor;

            if(usePlasmaEffect) {
                float seed = float(i) * 0.1;
                lineColor = drawPlasmaConnection(workingUV, fromPos, toPos, connType, seed, scheme.connections[connType], effectMultiplier);
            } else {
                lineColor = drawStandardConnection(workingUV, fromPos, toPos, connType, scheme, effectMultiplier);
            }

            lineColor.rgb = clamp(lineColor.rgb, vec3(0.0), vec3(1.0));
            lineColor.a = clamp(lineColor.a, 0.0, 1.0);
            outputColor.rgb = mix(outputColor.rgb, lineColor.rgb, lineColor.a);
        }

    //Draw nodes
        for(int i = 0; i < 20; i++) {
            vec2 pos = getNodePosition(i);
            pos = rotMat * pos;

            vec4 nodeColor;

            if(usePlasmaEffect) {
                int orbitType = getOrbitType(i);
                vec3 baseNodeColor;
                if(orbitType == 0)
                    baseNodeColor = scheme.middleNodes;
                else if(orbitType == 1)
                    baseNodeColor = scheme.innerNodes;
                else
                    baseNodeColor = scheme.outerNodes;

                nodeColor = drawPlasmaNode(workingUV, pos, i, baseNodeColor, effectMultiplier);
            } else {
                nodeColor = drawStandardNode(workingUV, pos, i, scheme, effectMultiplier);
            }

            nodeColor.rgb = clamp(nodeColor.rgb, vec3(0.0), vec3(1.0));
            nodeColor.a = clamp(nodeColor.a, 0.0, 1.0);
            outputColor.rgb = mix(outputColor.rgb, nodeColor.rgb, nodeColor.a);
        }

    //Apply post-processing effects
        float vignette = 1.0 - smoothstep(0.6, 1.2, length(originalUV));
        outputColor.rgb *= clamp(vignette, 0.1, 1.0);

    //Final color adjustments
        outputColor.rgb = pow(clamp(outputColor.rgb, vec3(0.0), vec3(1.0)), vec3(0.9));
        outputColor.a = clamp(outputColor.a, 0.0, 1.0);

        fragColor = outputColor;
    }
    `;
}