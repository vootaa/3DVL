<script setup lang="ts">
import { shallowRef } from 'vue'
import { DoubleSide, AdditiveBlending } from 'three'

const props = defineProps({
  position: {
    type: Array as unknown as () => [number, number, number],
    required: true,
  },
  rotation: {
    type: Array as unknown as () => [number, number, number],
    required: true,
  },
  scale: {
    type: Number,
    default: 1,
  },
  planeSize: {
    type: Number,
    default: 20,
  },
})

const uniforms = shallowRef({
  iTime: { value: 0.0 },
})

const meshRef = ref()

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  if (!meshRef.value || !uniforms.value) return
  uniforms.value.iTime.value = elapsed * 0.5
})

const fragmentShader = `
uniform float iTime;
varying vec2 vUv;

// Node angle positions (in radians)
const float ANGLES[20] = float[20](
    5.0265, 0.0, 1.2566, 2.5133, 3.7699,
    5.0265, 0.0, 1.2566, 2.5133, 3.7699,
    4.8521, 0.1745, 1.0821, 2.6878, 3.5954, 5.2009, 6.1087, 1.4312, 2.3387, 3.9444 
);

// Radius constants for the three concentric rings
const float INNER_RADIUS = 0.15;
const float MIDDLE_RADIUS = 0.3;
const float OUTER_RADIUS = 0.48;

// Connection lookup table defining the graph edges
const ivec2 CONNECTIONS[30] = ivec2[30](
    ivec2(0, 5), ivec2(1, 6), ivec2(2, 7), ivec2(3, 8), ivec2(4, 9),
    ivec2(0, 10), ivec2(1, 11), ivec2(2, 12), ivec2(3, 13), ivec2(4, 14),
    ivec2(0, 15), ivec2(1, 16), ivec2(2, 17), ivec2(3, 18), ivec2(4, 19),
    ivec2(5, 7), ivec2(6, 8), ivec2(7, 9), ivec2(8, 5), ivec2(9, 6),
    ivec2(10, 11), ivec2(11, 12), ivec2(12, 13), ivec2(13, 14), ivec2(14, 15), 
    ivec2(15, 16), ivec2(16, 17), ivec2(17, 18), ivec2(18, 19), ivec2(19, 10)
);

// Simple 2D rotation matrix
mat2 rotate2D(float angle) {
    float c = cos(angle), s = sin(angle);
    return mat2(c, s, -s, c);
}

// Calculate node position based on its ID
vec2 getNodePosition(int chainId) {
    float angle = ANGLES[chainId];
    float radius = chainId < 5 ? MIDDLE_RADIUS : (chainId < 10 ? INNER_RADIUS : OUTER_RADIUS);
    return vec2(radius * cos(angle), radius * sin(angle));
}

// Draw a line between two points with specified thickness
float drawLine(vec2 uv, vec2 p1, vec2 p2, float thickness) {
    vec2 dir = p2 - p1;
    float len = length(dir);
    dir /= len;
    
    vec2 perpDir = vec2(-dir.y, dir.x);
    float h = dot(uv - p1, dir);
    float d = abs(dot(uv - p1, perpDir));
    
    float mask = step(0.0, h) * step(h, len);
    return step(d, thickness) * mask;
}

// Draw a circle at specified position and radius
float drawCircle(vec2 uv, vec2 pos, float radius) {
    float d = length(uv - pos);
    return step(d, radius);
}

// Draw a ring with specified radius and thickness
float drawRing(vec2 uv, float radius, float thickness) {
    float dist = length(uv);
    return step(radius - thickness, dist) * step(dist, radius);
}

void main() {
    // Normalize UV coordinates to [-1, 1] range
    vec2 uv = vUv * 2.0 - 1.0;
    
    // Scale to fit the view
    uv *= 1.3;
    
    // Rotate the entire graph slowly
    uv = rotate2D(iTime) * uv;
    
    // Initialize color components
    vec3 linesColor = vec3(0.0);
    vec3 nodesColor = vec3(0.0);
    vec3 ringsColor = vec3(0.0);
    float alpha = 0.0;

    // Draw the three concentric rings
    float innerRing = drawRing(uv, INNER_RADIUS, 0.003);
    float middleRing = drawRing(uv, MIDDLE_RADIUS, 0.003);
    float outerRing = drawRing(uv, OUTER_RADIUS, 0.003);

    // Updated ring colors to match TripleRing component:
    // innerColor: 'dodgerblue', middleColor: 'hotpink', outerColor: 'gold'
    vec3 innerRingColor = vec3(0.12, 0.56, 1.0) * 1.2;  // dodgerblue (30, 144, 255)
    vec3 middleRingColor = vec3(1.0, 0.41, 0.71) * 1.2; // hotpink (255, 105, 180)
    vec3 outerRingColor = vec3(1.0, 0.84, 0.0) * 1.2;   // gold (255, 215, 0)

    // Add ring colors to the final output
    ringsColor += innerRingColor * innerRing;
    ringsColor += middleRingColor * middleRing;
    ringsColor += outerRingColor * outerRing;

    // Update alpha for the rings
    alpha += innerRing + middleRing + outerRing;
    
    // Draw all connection lines
    for(int i = 0; i < 30; i++) {
        vec2 p1 = getNodePosition(CONNECTIONS[i].x);
        vec2 p2 = getNodePosition(CONNECTIONS[i].y);
        
        float thickness = 0.001;
        float line = drawLine(uv, p1, p2, thickness);
        
        // Different line colors based on connection type for better distinction
        vec3 color;
        if (i < 5) {
            // Middle-to-inner connections: mix of hotpink and dodgerblue
            color = vec3(0.56, 0.49, 0.85) * 1.5; // Purple-ish mix
        } else if (i < 15) {
            // Middle-to-outer connections: mix of hotpink and gold
            color = vec3(1.0, 0.63, 0.48) * 1.5; // Peach/coral mix
        } else if (i < 20) {
            // Inner circle connections: based on dodgerblue
            color = vec3(0.2, 0.7, 1.0) * 1.5; // Lighter blue
        } else {
            // Outer circle connections: based on gold
            color = vec3(1.0, 0.78, 0.2) * 1.5; // Darker gold/amber
        }
        
        linesColor += color * line;
        alpha += line;
    }
    
    // Draw all nodes
    for(int i = 0; i < 20; i++) {
        vec2 pos = getNodePosition(i);
        float radius = i < 5 ? 0.01 : (i < 10 ? 0.008 : 0.006);
        float node = drawCircle(uv, pos, radius);
        
        // Updated node colors to match their respective rings
        vec3 color;
        if (i < 5) {
            color = vec3(1.0, 0.41, 0.71) * 1.8; // Bright hotpink (middle ring)
        } else if (i < 10) {
            color = vec3(0.12, 0.56, 1.0) * 1.8; // Bright dodgerblue (inner ring)
        } else {
            color = vec3(1.0, 0.84, 0.0) * 1.8; // Bright gold (outer ring)
        }
        
        nodesColor += color * node;
        alpha += node;
    }
    
    // Combine all color components
    vec3 finalColor = linesColor + nodesColor + ringsColor;
    
    // Apply mild color correction to make it more vibrant
    finalColor = pow(finalColor, vec3(0.9));
    
    // Output final color with transparency
    gl_FragColor = vec4(finalColor, min(1.0, alpha));
}
`

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const blending = {
  blending: AdditiveBlending,
  depthWrite: false,
}
</script>

<template>
  <TresGroup
    :position="props.position"
    :rotation="props.rotation"
    :scale="[props.scale, props.scale, props.scale]"
  >
    <TresMesh ref="meshRef">
      <TresPlaneGeometry :args="[props.planeSize, props.planeSize, 1, 1]" />
      <TresShaderMaterial
        v-bind="blending"
        :uniforms="uniforms"
        :fragment-shader="fragmentShader"
        :vertex-shader="vertexShader"
        :transparent="true"
        :side="DoubleSide"
      />
    </TresMesh>
  </TresGroup>
</template>