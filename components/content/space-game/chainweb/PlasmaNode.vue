<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Color, Vector3 } from 'three'
import { useRenderLoop, useThree } from '@tresjs/core'

const props = defineProps({
    position: {
        type: Object as () => Vector3,
        default: () => new Vector3(0, 0, 0)
    },
    color: {
        type: [Number, String],
        default: 0x5588ff
    },
    radius: {
        type: Number,
        default: 0.03
    },
    segments: {
        type: Number,
        default: 16
    },
    pulseSpeed: {
        type: Number,
        default: 1.5
    },
    pulseIntensity: {
        type: Number,
        default: 0.2
    }
})

// Convert color to Three.js color if it's a string
const nodeColor = computed(() => {
    if (typeof props.color === 'string') {
        return new Color(props.color)
    }
    return new Color(props.color)
})

// Update shader uniforms
const uniforms = ref({
    color: { value: nodeColor.value },
    time: { value: 0 },
    radius: { value: props.radius },
    pulseSpeed: { value: props.pulseSpeed },
    pulseIntensity: { value: props.pulseIntensity }
})

// Update color when prop changes
watch(() => props.color, (newColor) => {
    uniforms.value.color.value = typeof newColor === 'string' ? new Color(newColor) : new Color(newColor)
})

// Update time uniform for animation
const { onLoop } = useRenderLoop()
onLoop(({ elapsed }) => {
    uniforms.value.time.value = elapsed * 0.001
})

// Performance optimization: Adaptive segments based on distance from camera
const { camera } = useThree()
const adaptiveSegments = computed(() => {
    if (!camera.value) return props.segments

    const distance = camera.value.position.distanceTo(props.position)

    // Reduce complexity for distant nodes
    if (distance > 50) return Math.max(8, Math.floor(props.segments * 0.5))
    return props.segments
})
</script>

<template>
    <TresMesh :position="position">
        <TresSphereGeometry :args="[radius, adaptiveSegments, adaptiveSegments]" />
        <TresShaderMaterial :uniforms="uniforms" vertex-shader="
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    " fragment-shader="
      uniform vec3 color;
      uniform float time;
      uniform float radius;
      uniform float pulseSpeed;
      uniform float pulseIntensity;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Base plasma effect
        float plasma = sin(vPosition.x * 10.0 + time * pulseSpeed) * 
                       cos(vPosition.y * 10.0 + time * pulseSpeed) * 
                       sin(vPosition.z * 10.0 + time * pulseSpeed);
        
        // Pulse effect
        float pulse = 1.0 + pulseIntensity * sin(time * pulseSpeed * 2.0);
        
        // Edge glow effect
        float edge = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
        
        // Combine effects
        vec3 finalColor = color * (1.0 + 0.3 * plasma) * pulse;
        finalColor += color * edge * 0.5;
        
        // Add brightness at the center
        float dist = length(vPosition) / radius;
        finalColor *= 1.0 + (1.0 - min(1.0, dist)) * 0.5;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    " />
    </TresMesh>
</template>
