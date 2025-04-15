<script setup lang="ts">
import { shallowRef } from 'vue'
import { DoubleSide, Vector2, AdditiveBlending, Vector3 } from 'three'

const props = defineProps({
    position: {
        type: Array as unknown as () => [number, number, number],
        required: true
    },
    rotation: {
        type: Array as unknown as () => [number, number, number],
        required: true
    },
    scale: {
        type: Number,
        default: 1
    },
    planeSize: {
        type: Number,
        default: 20
    },

    visibilityThreshold: {
        type: Number,
        default: 1000
    }
});

const resolution = computed(() => {
    const size = 50 * props.planeSize;
    return new Vector2(size, size);
});


const uniforms = shallowRef({
    iTime: { value: 0.0 },
    iResolution: { value: resolution },
});

const meshRef = ref();
const isVisible = ref(true);

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed, camera }) => {
    if (!meshRef.value || !uniforms.value) return;

    const meshPosition = new Vector3().setFromMatrixPosition(meshRef.value.matrixWorld);
    const cameraPosition = new Vector3().setFromMatrixPosition(camera.matrixWorld);
    const distance = meshPosition.distanceTo(cameraPosition);

    const wasVisible = isVisible.value;
    isVisible.value = distance < props.visibilityThreshold;

    if (wasVisible !== isVisible.value && meshRef.value.material) {
        meshRef.value.material.visible = isVisible.value;
    }

    if (isVisible.value) {
        uniforms.value.iTime.value = elapsed * 0.1;
    }
});

// Complete fragment shader, including necessary uniform declarations
const fragmentShader = `
uniform float iTime;
uniform vec2 iResolution;
varying vec2 vUv;

// PetersenPlasmaGraph.glsl - Simplified visualization of PetersenGraph
// Preserving original node position data and connection data
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

// Simple 2D rotation matrix
mat2 rotate2D(float angle) {
    float c = cos(angle), s = sin(angle);
    return mat2(c, s, -s, c);
}

// Simplified node drawing function - simple circular node
float drawSimpleNode(vec2 uv, vec2 pos, float radius) {
    float d = length(uv - pos);
    return smoothstep(radius, radius * 0.8, d);
}

// Simplified connection line drawing function - thinner lines
float drawThinLine(vec2 uv, vec2 p1, vec2 p2, float thickness) {
    vec2 dir = p2 - p1;
    float len = length(dir);
    dir = normalize(dir);
    
    // Calculate perpendicular distance from point to line
    vec2 perpDir = vec2(-dir.y, dir.x);
    float h = dot(uv - p1, dir);
    float d = abs(dot(uv - p1, perpDir));
    
    // Ensure within line segment
    float mask = step(0.0, h) * step(h, len);
    
    // Thin line with no glow effect
    return smoothstep(thickness, thickness * 0.5, d) * mask;
}

// Simplified node color function
vec3 getSimpleNodeColor(int chainId, float t) {
    if(chainId < 5)
        return vec3(0.9, 0.8, 0.3); // Yellow
    else if(chainId < 10)
        return vec3(0.3, 0.7, 0.9); // Blue
    else
        return vec3(0.9, 0.4, 0.3); // Orange-red
}

// Simplified connection line color function
vec3 getSimpleConnectionColor(int connType) {
    if(connType == 0)
        return vec3(0.9, 0.3, 0.3); // Red
    else if(connType == 1)
        return vec3(0.3, 0.9, 0.3); // Green
    else if(connType == 2)
        return vec3(0.3, 0.3, 0.9); // Blue
    else if(connType == 3)
        return vec3(0.9, 0.7, 0.3); // Orange
    else
        return vec3(0.7, 0.3, 0.9); // Purple
}

void main() {
    // Normalize coordinates to [-1, 1] range
    vec2 uv = vUv * 2.0 - 1.0;
    
    // Center coordinate adjustment
    uv *= 1.3;
    
    // Rotate the entire graph for dynamic effect
    uv = rotate2D(iTime * 0.5) * uv;
    
    // Initialize color
    vec3 finalColor = vec3(0.0);
    float connectionMask = 0.0;
    
    // Draw connection lines (much thinner than original)
    for(int i = 0; i < 30; i++) {
        vec2 p1 = getNodePosition(CONNECTIONS[i].x);
        vec2 p2 = getNodePosition(CONNECTIONS[i].y);
        
        // Very thin lines
        float thickness = 0.001;
        
        // Draw thin line
        float conn = drawThinLine(uv, p1, p2, thickness);
        
        // Get simple color
        vec3 color = getSimpleConnectionColor(CONN_TYPE[i]);
        
        // Add to final color
        finalColor += color * conn;
        connectionMask += conn;
    }
    
    // Draw nodes (simple circles)
    for(int i = 0; i < 20; i++) {
        vec2 pos = getNodePosition(i);
        
        // Simple circles with appropriate size
        float radius = i < 5 ? 0.012 : (i < 10 ? 0.01 : 0.008);
        
        // Draw simple node
        float node = drawSimpleNode(uv, pos, radius);
        
        // Get node color
        vec3 color = getSimpleNodeColor(i, iTime);
        
        // Add to final color
        finalColor += color * node;
    }
    
    // Simple fade effect
    float vignette = 1.0 - dot(uv * 0.5, uv * 0.5);
    finalColor *= vignette;
    
    // Output color and transparency
    float alpha = min(1.0, connectionMask * 2.0 + length(finalColor) * 2.0);
    gl_FragColor = vec4(finalColor, alpha);
}
`;

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const blending = {
    blending: AdditiveBlending,
    depthWrite: false,
}
</script>

<template>
    <TresGroup :position="position" :rotation="rotation" :scale="[scale, scale, scale]">
        <TresMesh ref="meshRef">
            <TresPlaneGeometry :args="[planeSize, planeSize, 1, 1]" />
            <TresShaderMaterial v-bind="blending" :uniforms="uniforms" :fragment-shader="fragmentShader"
                :vertex-shader="vertexShader" :transparent="true" :side="DoubleSide" />
        </TresMesh>
    </TresGroup>
</template>