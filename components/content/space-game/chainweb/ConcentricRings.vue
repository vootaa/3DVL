<script setup lang="ts">
import { computed, ref } from 'vue'
import { Color, Vector3 } from 'three'
import { useRenderLoop, useThree } from '@tresjs/core'

const props = defineProps({
    position: {
        type: Object as () => Vector3,
        default: () => new Vector3(0, 0, 0)
    },
    scale: {
        type: Number,
        default: 1
    },
    radii: {
        type: Array as () => number[],
        default: () => [0.15, 0.3, 0.48]
    },
    tubeWidth: {
        type: Number,
        default: 0.005
    },
    rotationSpeed: {
        type: Number,
        default: 0.2
    },
    colors: {
        type: Array as () => (string | number)[],
        default: () => [0x3366ff, 0x44aaff, 0x66ccff]
    }
})

// Convert colors to Three.js colors
const ringColors = computed(() => {
    return props.colors.map(color => {
        if (typeof color === 'string') {
            return new Color(color)
        }
        return new Color(color)
    })
})

// Configure shader uniforms
const uniforms = ref({
    time: { value: 0 },
    colors: { value: ringColors.value.map(c => ({ value: c })) },
    rotationSpeed: { value: props.rotationSpeed }
})

// Update time uniform for animation
const { onLoop } = useRenderLoop()
onLoop(({ elapsed }) => {
    uniforms.value.time.value = elapsed * 0.001
})

// Performance optimization: Adaptive tube segments based on distance
const { camera } = useThree()
const tubularSegments = computed(() => {
    if (!camera.value) return 96

    const distance = camera.value.position.distanceTo(props.position)

    // Scale segments based on distance
    if (distance > 100) return 48
    if (distance > 50) return 64
    return 96
})

// Performance optimization: Only render when visible
const isVisible = ref(true)
onLoop(() => {
    if (!camera.value) return

    const distance = camera.value.position.distanceTo(props.position)

    // Only render if reasonably close to camera
    isVisible.value = distance < 200
})
</script>

<template>
    <TresObject3D v-if="isVisible" :position="position" :scale="[scale, scale, scale]">
        <!-- Create a ring for each radius -->
        <template v-for="(radius, index) in radii" :key="index">
            <TresMesh>
                <TresTorusGeometry :args="[radius, tubeWidth, 8, tubularSegments]" :rotation="[Math.PI / 2, 0, 0]" />
                <TresShaderMaterial :uniforms="{
                    time: uniforms.time,
                    color: { value: ringColors[index % ringColors.length] },
                    radius: { value: radius },
                    rotationOffset: { value: index * Math.PI / props.radii.length },
                    rotationSpeed: uniforms.rotationSpeed
                }" vertex-shader="
          uniform float time;
          uniform float rotationOffset;
          uniform float rotationSpeed;
          
          varying vec2 vUv;
          varying vec3 vPosition;
          
          void main() {
            // Apply gentle rotation to add movement
            float angle = time * rotationSpeed + rotationOffset;
            vec3 pos = position;
            mat3 rotationMatrix = mat3(
              cos(angle), 0.0, sin(angle),
              0.0, 1.0, 0.0,
              -sin(angle), 0.0, cos(angle)
            );
            pos = rotationMatrix * pos;
            
            vUv = uv;
            vPosition = pos;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        " fragment-shader="
          uniform vec3 color;
          uniform float time;
          uniform float radius;
          
          varying vec2 vUv;
          varying vec3 vPosition;
          
          void main() {
            // Energy flow along ring
            float flow = fract(vUv.x * 8.0 - time * 0.5);
            float pulse = pow(sin(flow * 3.14159 * 2.0), 2.0) * 0.3 + 0.7;
            
            // Shimmer effect
            float shimmer = sin(vUv.x * 50.0 + time * 3.0) * 0.1 + 0.9;
            
            // Combine effects
            vec3 finalColor = color * pulse * shimmer;
            
            // Add some variation based on ring size
            finalColor *= 0.8 + (radius * 0.5);
            
            gl_FragColor = vec4(finalColor, 0.9);
          }
        " transparent depthWrite />
            </TresMesh>
        </template>
    </TresObject3D>
</template>
