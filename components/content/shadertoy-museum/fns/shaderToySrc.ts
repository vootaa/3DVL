const gamesOfSinus = `
// NOTE: https://www.shadertoy.com/view/M32BD1
// color pallette inspired by https://www.shadertoy.com/view/ls3Xzn 
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    
    float ph = 25. + (1. - uv.x) * 20.;
    float amp = 0.02 + uv.x / 5.;
    float y = 0.5 + sin(uv.x * ph + iTime) * amp;
    float c1 = 1. - smoothstep(0.003, 0.003 + exp(-(1. - uv.x) * 4.), abs(uv.y - y));
    float c2 = 1. - smoothstep(0.003, 0.003 + exp(-(uv.x) * 4.), abs(uv.y - y));
    float r = pow(1.0 - sqrt(abs(uv.y - c1)), sin(iTime) + 2.0);
    float g = pow(1.0 - sqrt(abs(uv.y - c2)), cos(iTime) + 2.0 );
    float b = 1.5 * (r+g);

    fragColor = vec4(r, g, b, r + g + b);
}
/** SHADERDATA
{
	"title": "The games of sinus :)",
	"author": "cesio",
	"description": "Sinusoid, color pallette inspired by https://www.shadertoy.com/view/ls3Xzn",
    "href": "https://www.shadertoy.com/view/M32BD1"
}
*/
`

const sinusoidalTresJS = `
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float r = sin(iTime + uv.x + sin(uv.y + iTime));
    float g = pow(1.0 - sqrt(abs(cos(uv.y + uv.x + iTime))), sin(iTime) + 2.0);
    float b = pow(1.0 - sin(uv.y + iTime), cos(iTime) + 2.0 );
    float a = 
    0.5 * (sin(3.1 * uv.y + cos(uv.x * 2.7 + iTime) + iTime) * 0.5 + 0.5)
    + 0.15 * (0.5 * cos(3.14 * length(uv - vec2(0.5, 0.5)) + iTime) + 0.5)
    + 0.35 * (r + g + b) * 0.3333;

    fragColor = vec4(r, g, b, a);
}

/** SHADERDATA
{
	"title": "Sinusoidal for TresJS",
    "author": "andretchen0",
	"description": "Simple shader made for this TresJS lab",
    "href": "https://lab.tresjs.org"
}
*/
`

const sinusoidalTresJS2 = `
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float g = pow(1.0 - sqrt(abs(cos(uv.y + uv.x + iTime * 0.1))), sin(iTime) + 2.0);
    float b = pow(1.0 - sin(uv.y + iTime), cos(iTime) + 2.0 );
    float r = sin(iTime + uv.y + sin(uv.y + iTime));

    fragColor = vec4(r, g, b, 0.);
}

/** SHADERDATA
{
	"title": "Sinusoidal 2 for TresJS",
    "author": "andretchen0",
	"description": "Simple shader made for this TresJS lab",
    "href": "https://lab.tresjs.org"
}
*/
`

const petersenPlasmaGraph = `
// PetersenPlasmaGraph.glsl - Dynamic visualization of PetersenGraph
// Combines Petersen Graph topology with Plasma visualization effects

// Angles for node positioning (in radians)
const float ANGLES[20] = float[20](
    // Middle circle (chainId 0-4) - Evenly distributed on the circle
    5.0265, 0.0, 1.2566, 2.5133, 3.7699,
    // Inner circle (chainId 5-9) - Corresponding to middle circle angles
    5.0265, 0.0, 1.2566, 2.5133, 3.7699,
    // Outer circle (chainId 10-19)
    4.8521, 0.1745, 1.0821, 2.6878, 3.5954, 5.2009, 6.1087, 1.4312, 2.3387, 3.9444);

const float INNER_RADIUS = 0.15;
const float MIDDLE_RADIUS = 0.3;
const float OUTER_RADIUS = 0.48;

// Connection lookup table (from, to)
const ivec2 CONNECTIONS[30] = ivec2[30](
    // Middle to inner (+5 pattern)
    ivec2(0, 5), ivec2(1, 6), ivec2(2, 7), ivec2(3, 8), ivec2(4, 9),
    // Middle to outer (+10 pattern)
    ivec2(0, 10), ivec2(1, 11), ivec2(2, 12), ivec2(3, 13), ivec2(4, 14),
    // Middle to outer (+15 pattern)
    ivec2(0, 15), ivec2(1, 16), ivec2(2, 17), ivec2(3, 18), ivec2(4, 19),
    // Inner circle connections
    ivec2(5, 7), ivec2(6, 8), ivec2(7, 9), ivec2(8, 5), ivec2(9, 6),
    // Outer circle connections
    ivec2(10, 11), ivec2(11, 12), ivec2(12, 13), ivec2(13, 14), ivec2(14, 15), ivec2(15, 16), ivec2(16, 17), ivec2(17, 18), ivec2(18, 19), ivec2(19, 10));

// Connection types for coloring
const int CONN_TYPE[30] = int[30](
    // Connection types by group
    0, 0, 0, 0, 0,  // Middle to inner
    1, 1, 1, 1, 1,  // Middle to outer (+10)
    2, 2, 2, 2, 2,  // Middle to outer (+15)
    3, 3, 3, 3, 3,  // Inner circle
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4  // Outer circle
    );

// Get node position based on chainId
vec2 getNodePosition(int chainId) {
    float angle = ANGLES[chainId];
    float radius;

    if(chainId < 5)
        radius = MIDDLE_RADIUS;
    else if(chainId < 10)
        radius = INNER_RADIUS;
    else
        radius = OUTER_RADIUS;

    return vec2(radius * cos(angle), radius * sin(angle));
}

// Hash function from PlasmaGlobe
float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

// Simplified noise function using basic smooth interpolation
float noise(in vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f); // Smooth interpolation
    float n = p.x + p.y * 57.0;
    float res = mix(mix(hash(n), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
    return res;
}

// Matrix for rotations
mat2 mm2(in float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

// Flow effect function
float flow(in vec2 p, in float t) {
    float z = 2.0;
    float rz = 0.0;
    vec2 bp = p;

    for(float i = 1.0; i < 3.0; i++) {
        p += iTime * 0.1;
        float n = noise(p * 4.0 + t * 0.8); // Lower frequency
        rz += (sin(n * 6.0) * 0.5 + 0.5) / z;
        p = mix(bp, p, 0.6);
        z *= 2.0;
        p *= 2.01;
        p = p * mm2(iTime * 0.04 * i);
    }
    return rz;
}

// Draw a node with plasma effect
vec4 drawNode(vec2 uv, vec2 pos, int chainId) {
    float dist = length(uv - pos);
    float nodeSize = 0.025;

    // Node base color
    vec3 nodeBaseColor;
    if(chainId < 5)
        nodeBaseColor = vec3(1.0, 0.0, 0.0);  // Red
    else if(chainId < 10)
        nodeBaseColor = vec3(0.0, 0.0, 1.0);  // Blue
    else
        nodeBaseColor = vec3(1.0, 1.0, 0.0);   // Yellow

    // Flow effect calculation
    float flowEffect = flow(uv * 15.0, iTime * 0.2 + float(chainId));
    float glowSize = nodeSize * (1.8 + 0.4 * sin(iTime * 2.0 + float(chainId)));

    // Core and glow effect
    float core = smoothstep(nodeSize, nodeSize * 0.4, dist);
    float glow = smoothstep(glowSize, nodeSize, dist) * 0.8 * flowEffect;

    vec3 nodeColor = mix(nodeBaseColor, vec3(1.0), 0.3 + 0.3 * flowEffect);
    float alpha = max(core, glow * 0.8);
    vec3 finalColor = nodeColor * (core + glow * 1.2);

    return vec4(finalColor, alpha);
}

vec4 drawPlasmaConnection(vec2 uv, vec2 p1, vec2 p2, int connType, float seed) {
    // Direction vector and distance to the point
    vec2 dir = p2 - p1;
    float len = length(dir);
    dir = normalize(dir);
    vec2 normal = vec2(-dir.y, dir.x);

    // Project uv onto the line segment
    vec2 uv_rel = uv - p1;
    float alongLine = dot(uv_rel, dir);
    float perpLine = dot(uv_rel, normal);

    // Return if outside the line segment range
    if(alongLine < -0.01 || alongLine > len + 0.01)
        return vec4(0.0);

    // Normalize along-line position (0-1)
    float normAlong = clamp(alongLine / len, 0.0, 1.0);
    float time = iTime * 1.1;

    // Simplified color selection
    vec3 baseColor;
    switch(connType) {
        case 0:
            baseColor = vec3(1.0, 0.4, 0.3);
            break;  // Red - Middle to inner circle
        case 1:
            baseColor = vec3(0.9, 0.7, 0.3);
            break;  // Gold - Middle to outer circle (+10)
        case 2:
            baseColor = vec3(0.22, 0.59, 0.96);
            break; // Blue - Middle to outer circle (+15)
        case 3:
            baseColor = vec3(0.3, 0.9, 1.0);
            break;  // Cyan - Inner circle connections
        case 4:
            baseColor = vec3(1.0, 1.0, 0.21);
            break; // Yellow - Outer circle connections
        default:
            baseColor = vec3(0.7, 0.7, 0.7);        // Gray
    }

    // Base arc width remains constant
    float arcWidth = 0.0025 * (0.8 + 0.2 * len / 0.5);

    float distortionAmount;

    // Determine connection ring type
    if(connType == 3) {
        // Inner circle connections - Minimum distortion
        distortionAmount = 0.008;
    } else if(connType == 0) {
        // Middle to inner circle - Small distortion
        distortionAmount = 0.015;
    } else if(connType == 1 || connType == 2) {
        // Middle to outer circle - Moderate distortion
        distortionAmount = 0.02;
    } else if(connType == 4) {
        // Outer circle connections - Maximum distortion
        distortionAmount = 0.025;
    } else {
        // Default
        distortionAmount = 0.02;
    }

    float lowFreq = 5.0;
    float highFreq = 20.0;

    // Use only two noise layers, but adjust frequency based on connection type
    float noise1 = noise(vec2(normAlong * lowFreq + time * 0.5, seed * 10.0)) * 2.0 - 1.0;  // Low frequency
    float noise2 = noise(vec2(normAlong * highFreq - time * 0.7, seed * 5.0)) * 2.0 - 1.0;  // High frequency

    // Combine noise layers - Simplified to two layers
    float combinedNoise = noise1 * 0.7 + noise2 * 0.3;

    // Calculate distorted distance
    float distortedDist = abs(perpLine - distortionAmount * combinedNoise);

    // Main arc path, fixed thickness
    float thickness = arcWidth * (0.6 + 0.4 * noise(vec2(normAlong * 5.0, time * 0.3 + seed * 10.0)));

    // Main arc rendering
    float mainArc = smoothstep(thickness, thickness * 0.3, distortedDist);

    // Glow effect
    float glow = 0.2 / (1.0 + 15.0 * distortedDist * distortedDist);

    // Color variation
    vec3 arcColor = baseColor + 0.2 * sin(vec3(3.0, 1.0, 2.0) * (time * 0.5 + normAlong * 3.0));

    // Flicker effect - Adjust flicker speed and amplitude
    float flickerSpeed = 3.0;

    float flickerAmount;
    if(connType == 3) {
        // Inner circle - Slower flicker, smaller amplitude
        flickerAmount = 0.2;
    } else if(connType == 0) {
        // Middle to inner circle
        flickerAmount = 0.25;
    } else if(connType == 1 || connType == 2) {
        // Middle to outer circle
        flickerAmount = 0.3;
    } else {
        // Outer circle - Faster flicker, larger amplitude
        flickerAmount = 0.35;
    }

    float flicker = (1.0 - flickerAmount) + flickerAmount * sin(time * (flickerSpeed + seed * 3.0) + normAlong * 4.0);
    float arcIntensity = mainArc * flicker * 1.2 + glow * 0.9;

    vec3 finalColor = arcColor * arcIntensity;

    // Spark effect
    float sparkThreshold = 0.9;

    if(noise(vec2(time * 5.0 + seed * 15.0, normAlong * 10.0)) > sparkThreshold) {
        // Outer circle sparks are larger and brighter
        float sparkSize = (connType == 4) ? 25.0 : 20.0;
        float sparkDist = length(vec2(normAlong - noise(vec2(time * 1.5, seed)) * 0.08, perpLine) * sparkSize);
        float sparkBrightness = (connType == 4) ? 1.2 : 0.7;
        float spark = sparkBrightness / (1.0 + sparkDist * sparkDist);
        finalColor += arcColor * spark;
    }

    // Alpha value
    float alpha = min(arcIntensity * 0.8, 1.0);

    return vec4(finalColor, alpha);
}

// Circle drawing function
vec4 drawCircle(vec2 uv, float radius, vec3 color, float time) {
    // Distance to the center
    float dist = length(uv);

    // Fixed circle width
    float thickness = 0.003;

    // Simple circle
    float ring = smoothstep(radius + thickness, radius, dist) *
        smoothstep(radius - thickness, radius, dist);

    // Return color
    return vec4(color * ring, ring * 0.8);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Background color
    vec4 backgroundColor = vec4(0.02, 0.02, 0.05, 1.0);

    // Coordinate system
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);

    // Scaling
    float globalScale = 0.7;
    uv = uv / globalScale;

    // Rotation
    float rotation = iTime * 0.1;
    mat2 rotMat = mm2(rotation);
    vec2 rotatedUv = uv * rotMat;

    // Initialize color
    fragColor = backgroundColor;

    // 1. Draw concentric circles
    vec3 innerCircleColor = vec3(0.3, 0.8, 1.0) * 0.5;  // Inner circle color - Blue
    vec3 middleCircleColor = vec3(1.0, 0.5, 0.3) * 0.5; // Middle circle color - Red
    vec3 outerCircleColor = vec3(1.0, 1.0, 0.4) * 0.5;  // Outer circle color - Yellow

    vec4 innerCircle = drawCircle(rotatedUv, INNER_RADIUS, innerCircleColor, iTime);
    vec4 middleCircle = drawCircle(rotatedUv, MIDDLE_RADIUS, middleCircleColor, iTime * 0.8);
    vec4 outerCircle = drawCircle(rotatedUv, OUTER_RADIUS, outerCircleColor, iTime * 0.6);

    // Blend circles
    fragColor.rgb = mix(fragColor.rgb, innerCircle.rgb, innerCircle.a);
    fragColor.rgb = mix(fragColor.rgb, middleCircle.rgb, middleCircle.a);
    fragColor.rgb = mix(fragColor.rgb, outerCircle.rgb, outerCircle.a);

    // 2. Draw arcs
    for(int i = 0; i < 30; i++) {
        int fromId = CONNECTIONS[i].x;
        int toId = CONNECTIONS[i].y;
        int connType = CONN_TYPE[i];

        vec2 fromPos = getNodePosition(fromId) * rotMat;
        vec2 toPos = getNodePosition(toId) * rotMat;

        float seed = float(i) * 0.1;

        vec4 arcColor = drawPlasmaConnection(uv, fromPos, toPos, connType, seed);
        fragColor.rgb = mix(fragColor.rgb, arcColor.rgb, arcColor.a * 0.7);
    }

    // 3. Draw nodes
    for(int i = 0; i < 20; i++) {
        vec2 pos = getNodePosition(i) * rotMat;
        vec4 nodeColor = drawNode(uv, pos, i);
        fragColor.rgb = mix(fragColor.rgb, nodeColor.rgb, nodeColor.a * 0.9);
    }

    // Add vignette effect
    float vignette = 1.0 - smoothstep(0.5, 1.8, length(fragCoord / iResolution.xy - 0.5) * 1.1);
    fragColor.rgb *= vignette * 1.2;

    // Remove redundant background plasma effect

    // Ensure alpha is 1.0
    fragColor.a = 1.0;
}

/** SHADERDATA
{
    "title": "Petersen Plasma Graph",
    "author": "Vootaa Labs",
    "description": "Mathematical graph theory visualization with Chainweb inspiration",
    "href": "https://github.com/vootaa/3DVL"
}
*/
`

const petersenGraph = `

precision highp float;

float gTime = 0.;
const float PI = 3.14159265;

// Efficient rotation function
mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, s, -s, c);
}

// Polar to Cartesian coordinate conversion
vec2 polar(float r, float a) {
    return vec2(r * cos(a), r * sin(a));
}

// Simplified noise function
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Dynamic Color Palette System
struct ColorScheme {
    vec3 primary;      // Primary color
    vec3 secondary;    // Secondary color
    vec3 accent;       // Accent color
    vec3 dark;         // Dark tone
};

// Get color scheme by index
ColorScheme getColorScheme(int index) {
    ColorScheme scheme;
    
    if(index == 0) { // Neon Magenta
        scheme.primary = vec3(1.0, 0.0, 0.5);    // Magenta
        scheme.secondary = vec3(0.6, 0.0, 0.8);  // Purple
        scheme.accent = vec3(1.0, 0.2, 0.6);     // Light magenta
        scheme.dark = vec3(0.2, 0.0, 0.15);      // Deep purple
    } else if(index == 1) { // Electronic Cyan-Blue
        scheme.primary = vec3(0.0, 0.8, 1.0);    // Cyan
        scheme.secondary = vec3(0.0, 0.4, 0.8);  // Blue
        scheme.accent = vec3(0.2, 0.9, 1.0);     // Light cyan
        scheme.dark = vec3(0.0, 0.1, 0.2);       // Deep blue
    } else if(index == 2) { // Matrix Green
        scheme.primary = vec3(0.0, 1.0, 0.3);    // Neon green
        scheme.secondary = vec3(0.0, 0.8, 0.2);  // Matrix green
        scheme.accent = vec3(0.5, 1.0, 0.0);     // Lime green
        scheme.dark = vec3(0.0, 0.15, 0.05);     // Deep green
    } else if(index == 3) { // Orange-Red Warning
        scheme.primary = vec3(1.0, 0.5, 0.0);    // Orange
        scheme.secondary = vec3(1.0, 0.0, 0.0);  // Red
        scheme.accent = vec3(1.0, 0.75, 0.0);    // Amber
        scheme.dark = vec3(0.2, 0.05, 0.0);      // Deep orange-red
    } else if(index == 4) { // Golden Data
        scheme.primary = vec3(1.0, 0.84, 0.0);   // Gold
        scheme.secondary = vec3(1.0, 1.0, 0.0);  // Yellow
        scheme.accent = vec3(1.0, 0.6, 0.0);     // Amber
        scheme.dark = vec3(0.2, 0.15, 0.0);      // Deep gold
    } else { // Violet (index == 5)
        scheme.primary = vec3(0.5, 0.0, 1.0);    // Violet
        scheme.secondary = vec3(0.3, 0.0, 0.5);  // Indigo
        scheme.accent = vec3(0.7, 0.5, 1.0);     // Lavender
        scheme.dark = vec3(0.1, 0.0, 0.2);       // Deep violet
    }
    
    return scheme;
}

// Smooth interpolation between two color schemes
ColorScheme interpolateSchemes(ColorScheme a, ColorScheme b, float t) {
    ColorScheme result;
    result.primary = mix(a.primary, b.primary, t);
    result.secondary = mix(a.secondary, b.secondary, t);
    result.accent = mix(a.accent, b.accent, t);
    result.dark = mix(a.dark, b.dark, t);
    return result;
}

// Get current dynamic color scheme based on time
ColorScheme getCurrentColorScheme(float time) {
    float cycleDuration = 15.0; // Switch color scheme every 15 seconds
    float totalCycles = 6.0; // 6 color schemes total
    
    float globalTime = mod(time, cycleDuration * totalCycles);
    float schemeTime = globalTime / cycleDuration;
    
    int currentScheme = int(floor(schemeTime));
    int nextScheme = (currentScheme + 1) % 6;
    float blendFactor = fract(schemeTime);
    
    // Use smoothstep for smoother transitions
    float smoothBlend = smoothstep(0.0, 1.0, blendFactor);
    
    ColorScheme current = getColorScheme(currentScheme);
    ColorScheme next = getColorScheme(nextScheme);
    
    return interpolateSchemes(current, next, smoothBlend);
}

// Enhanced color functions for different elements
vec3 getBackgroundColor(ColorScheme scheme, bool isTop) {
    return isTop ? scheme.dark * 2.0 : scheme.dark * 0.5;
}

vec3 getCityscapeColor(ColorScheme scheme) {
    return scheme.dark * 1.5;
}

vec3 getCityLightsColor(ColorScheme scheme) {
    return scheme.accent;
}

vec3 getDistortionColor(ColorScheme scheme) {
    return scheme.primary;
}

vec3 getNeonInnerColor(ColorScheme scheme) {
    return scheme.primary;
}

vec3 getNeonOuterColor(ColorScheme scheme) {
    return scheme.secondary;
}

vec3 getSpectrumColor(ColorScheme scheme, int index) {
    if(index == 0) return scheme.primary;
    else return mix(scheme.secondary, scheme.accent, 0.5);
}

vec3 getEdgeColor(ColorScheme scheme) {
    return mix(scheme.primary, scheme.accent, 0.7);
}

vec3 getFillColor(ColorScheme scheme) {
    return scheme.dark * 0.8;
}

vec3 getCircuitColor(ColorScheme scheme) {
    return scheme.secondary * 0.6;
}

// Simplified spacetime warp
vec2 spacetimeWarp(vec2 p) {
    float dist = length(p);
    float ripple = sin(dist * 12.0 - gTime * 6.0) * 0.08;
    return p * (1.0 + ripple);
}

// Simplified neon glow
float balancedNeonGlow(float d, float width, float intensity) {
    return width / (abs(d) + width) * intensity;
}

// Fixed polygon distance field
float sdPolygon(vec2 p, vec2 vertices[7], int n) {
    float d = dot(p - vertices[0], p - vertices[0]);
    float s = 1.0;

    for(int i = 0, j = n - 1; i < n; j = i, i++) {
        vec2 e = vertices[j] - vertices[i];
        vec2 w = p - vertices[i];
        vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
        d = min(d, dot(b, b));

        bvec3 c = bvec3(p.y >= vertices[i].y, p.y < vertices[j].y, e.x * w.y > e.y * w.x);
        if(all(c) || all(not(c)))
            s *= -1.0;
    }

    return s * sqrt(d);
}

// Triangle distance field
float sdTriangle(vec2 p, vec2 a, vec2 b, vec2 c) {
    vec2 vertices[7];
    vertices[0] = a; vertices[1] = b; vertices[2] = c;
    return sdPolygon(p, vertices, 3);
}

// Quadrilateral distance field
float sdQuad(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
    vec2 vertices[7];
    vertices[0] = a; vertices[1] = b; vertices[2] = c; vertices[3] = d;
    return sdPolygon(p, vertices, 4);
}

// Pentagon distance field
float sdPentagon(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d, vec2 e) {
    vec2 vertices[7];
    vertices[0] = a; vertices[1] = b; vertices[2] = c; vertices[3] = d; vertices[4] = e;
    return sdPolygon(p, vertices, 5);
}

// Heptagon distance field
float sdHeptagon(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d, vec2 e, vec2 f, vec2 g) {
    vec2 vertices[7];
    vertices[0] = a; vertices[1] = b; vertices[2] = c; vertices[3] = d;
    vertices[4] = e; vertices[5] = f; vertices[6] = g;
    return sdPolygon(p, vertices, 7);
}

// Shrink shape to create gaps
float shrinkShape(float d, float amount) {
    return d + amount;
}

// Central pentagon of the Petersen graph
float petersenCenterPentagon(vec2 p) {
    float scale = 2.0;
    p /= scale;
    float shrink = 0.005;

    vec2 pentagon_a = polar(0.06, radians(36.0));
    vec2 pentagon_b = polar(0.06, radians(108.0));
    vec2 pentagon_c = polar(0.06, radians(180.0));
    vec2 pentagon_d = polar(0.06, radians(252.0));
    vec2 pentagon_e = polar(0.06, radians(324.0));

    return shrinkShape(sdPentagon(p, pentagon_a, pentagon_b, pentagon_c, pentagon_d, pentagon_e), shrink);
}

// 1/5 part of the Petersen graph
float petersenPart(vec2 p) {
    float scale = 2.0;
    p /= scale;
    float shrink = 0.005;

    // P1 Triangle
    vec2 p1a = polar(0.060, radians(36.0));
    vec2 p1b = polar(0.060, radians(324.0));
    vec2 p1c = polar(0.150, 0.0);
    float d1 = shrinkShape(sdTriangle(p, p1a, p1b, p1c), shrink);

    // P2 Heptagon
    vec2 p2a = polar(0.060, radians(36.0));
    vec2 p2b = polar(0.150, 0.0);
    vec2 p2c = polar(0.300, 0.0);
    vec2 p2d = polar(0.390, radians(6.0));
    vec2 p2e = polar(0.390, radians(66.0));
    vec2 p2f = polar(0.300, radians(72.0));
    vec2 p2g = polar(0.150, radians(72.0));
    float d2 = shrinkShape(sdHeptagon(p, p2a, p2b, p2c, p2d, p2e, p2f, p2g), shrink);

    // P3 Quadrilateral
    vec2 p3a = polar(0.300, 0.0);
    vec2 p3b = polar(0.390, radians(354.0));
    vec2 p3c = polar(0.416, 0.0);
    vec2 p3d = polar(0.390, radians(6.0));
    float d3 = shrinkShape(sdQuad(p, p3a, p3b, p3c, p3d), shrink);

    // P4 Triangle
    vec2 p4a = polar(0.390, radians(6.0));
    vec2 p4b = polar(0.416, 0.0);
    vec2 p4c = polar(0.480, radians(10.0));
    float d4 = shrinkShape(sdTriangle(p, p4a, p4b, p4c), shrink);

    // P5 Quadrilateral
    vec2 p5a = polar(0.390, radians(6.0));
    vec2 p5b = polar(0.480, radians(10.0));
    vec2 p5c = polar(0.480, radians(62.0));
    vec2 p5d = polar(0.390, radians(66.0));
    float d5 = shrinkShape(sdQuad(p, p5a, p5b, p5c, p5d), shrink);

    // P6 Triangle
    vec2 p6a = polar(0.390, radians(66.0));
    vec2 p6b = polar(0.480, radians(62.0));
    vec2 p6c = polar(0.416, radians(72.0));
    float d6 = shrinkShape(sdTriangle(p, p6a, p6b, p6c), shrink);

    return min(min(min(min(min(d1, d2), d3), d4), d5), d6);
}

// Complete Petersen graph
float petersenGraph(vec2 p) {
    float d = 1e6;

    // Slow rotation
    p *= rot(gTime * 0.08);

    // Central pentagon
    float centerPentagon = petersenCenterPentagon(p);
    d = min(d, centerPentagon);

    // 5-fold rotational symmetry
    for(int i = 0; i < 5; i++) {
        float angle = float(i) * 72.0 * PI / 180.0;
        vec2 rotP = p * rot(-angle);
        d = min(d, petersenPart(rotP));
    }

    return d;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
    gTime = iTime;

    // Get current dynamic color scheme
    ColorScheme currentScheme = getCurrentColorScheme(gTime);

    // Apply simplified spacetime distortion
    vec2 warpedP = spacetimeWarp(p);
    float d = petersenGraph(warpedP);

    // Dynamic background gradient
    vec3 bottomColor = getBackgroundColor(currentScheme, false);
    vec3 topColor = getBackgroundColor(currentScheme, true);
    vec3 col = mix(bottomColor, topColor, p.y * 0.2 + 0.5);

    // Dynamic cityscape
    float cityHeight = 0.4 + sin(p.x * 8.0) * 0.03;
    float cityscape = smoothstep(0.0, 0.01, p.y + cityHeight);
    vec3 cityscapeColor = getCityscapeColor(currentScheme);
    col = mix(col, cityscapeColor, 1.0 - cityscape);

    // Dynamic city lights
    float cityLights = pow(noise(p * 30.0), 8.0) * (1.0 - cityscape);
    vec3 lightsColor = getCityLightsColor(currentScheme);
    col += cityLights * lightsColor * 0.15;

    // Dynamic distortion visualization
    float warpVis = length(warpedP - p) * 8.0;
    vec3 distortionColor = getDistortionColor(currentScheme);
    col += warpVis * distortionColor * 0.15;

    // Dynamic neon glow layers
    float neonInner = balancedNeonGlow(d, 0.01, 1.5);
    float neonOuter = balancedNeonGlow(d, 0.03, 0.6);

    vec3 neonInnerColor = getNeonInnerColor(currentScheme);
    vec3 neonOuterColor = getNeonOuterColor(currentScheme);

    col += neonInner * neonInnerColor;
    col += neonOuter * neonOuterColor;

    // Dynamic chromatic aberration
    vec3 rgbSplit = vec3(0.0);
    for(int i = 0; i < 2; i++) {
        float offset = float(i) * 0.0015;
        vec2 chromaP = warpedP + vec2(offset, -offset);
        float chromaD = petersenGraph(chromaP);

        float edge = smoothstep(0.005, 0.0, abs(chromaD));
        vec3 spectrumColor = getSpectrumColor(currentScheme, i);

        rgbSplit += edge * spectrumColor * 0.5;
    }

    col += rgbSplit;

    // Dynamic main edge
    float edge = smoothstep(0.005, 0.0, abs(d));
    vec3 edgeColor = getEdgeColor(currentScheme);
    col += edge * edgeColor * 0.6;

    // Dynamic fill
    float solid = smoothstep(0.002, -0.002, d);
    vec3 fillColor = getFillColor(currentScheme);

    // Dynamic circuit pattern
    float circuit = step(0.7, noise(warpedP * 25.0));
    vec3 circuitColor = getCircuitColor(currentScheme);
    fillColor += circuit * circuitColor * 0.2;

    col += solid * fillColor;

    // Enhanced visual feedback for color transitions
    float transitionIndicator = abs(sin(gTime * 2.0 * PI / 15.0)) * 0.05;
    col += transitionIndicator * currentScheme.accent;

    // Standard post-processing
    col = pow(col, vec3(0.85));
    col *= 1.4;

    // Vignette effect
    float vignette = 1.0 - length(p) * 0.3;
    col *= clamp(vignette, 0.0, 1.0);

    fragColor = vec4(col, 1.0);
}

/** SHADERDATA
{
    "title": "Petersen Graph - Dynamic Color Cycling System - Ripple Cyberpunk",
    "author": "Vootaa Labs",
    "description": "6-scheme cyberpunk color palette with smooth transitions",
    "href": "https://github.com/vootaa/PetersenGraph-Effects"
}
*/
`

export const mainImage = gamesOfSinus

export const shaderToySrc = {
    gamesOfSinus,
    sinusoidalTresJS,
    sinusoidalTresJS2,
    petersenPlasmaGraph,
    petersenGraph,
}