<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Color, Vector3, CatmullRomCurve3 } from 'three'
import { useRenderLoop, useThree } from '@tresjs/core'

// Remove unused imports
// import { TresCanvas } from '@tresjs/core'
// import { onMounted } from 'vue'

const props = defineProps({
    startPosition: {
        type: Object as () => Vector3,
        default: () => new Vector3(-0.2, 0, 0)
    },
    endPosition: {
        type: Object as () => Vector3,
        default: () => new Vector3(0.2, 0, 0)
    },
    color: {
        type: [Number, String],
        default: 0x55aaff
    },
    thickness: {
        type: Number,
        default: 0.01
    },
    arcType: {
        type: String,
        default: 'inter-layer' // 'inter-layer' or 'same-chain'
    },
    arcHeight: {
        type: Number,
        default: 0.05
    },
    flowSpeed: {
        type: Number,
        default: 1.0
    }
})

// Convert color to Three.js color if it's a string
const arcColor = computed(() => {
    if (typeof props.color === 'string') {
        return new Color(props.color)
    }
    return new Color(props.color)
})

// Create path for the arc
const path = computed(() => {
    const start = props.startPosition
    const end = props.endPosition
    const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5)

    // Add some height variation based on arcType
    if (props.arcType === 'inter-layer') {
        // More jagged, lightning-like path for inter-layer connections
        const randOffset = new Vector3(
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05
        )
        mid.add(randOffset)

        // Create two additional control points for more jagged appearance
        const ctrl1 = new Vector3().lerpVectors(start, mid, 0.25)
            .add(new Vector3(
                (Math.random() - 0.5) * 0.03,
                (Math.random() - 0.5) * 0.03,
                (Math.random() - 0.5) * 0.03
            ))

        const ctrl2 = new Vector3().lerpVectors(mid, end, 0.75)
            .add(new Vector3(
                (Math.random() - 0.5) * 0.03,
                (Math.random() - 0.5) * 0.03,
                (Math.random() - 0.5) * 0.03
            ))

        return new CatmullRomCurve3([start, ctrl1, mid, ctrl2, end])
    } else {
        // Smoother arc for same-chain connections
        const midPoint = mid.clone()

        // Add vertical offset based on distance
        const dist = start.distanceTo(end)
        midPoint.z += props.arcHeight * dist

        return new CatmullRomCurve3([start, midPoint, end])
    }
})

// Configure shader uniforms
const uniforms = ref({
    color: { value: arcColor.value },
    time: { value: 0 },
    arcType: { value: props.arcType === 'same-chain' ? 1.0 : 0.0 },
    flowSpeed: { value: props.flowSpeed }
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

// Performance optimization: Adaptive tube segments based on distance
const { camera } = useThree()
const tubeSegments = computed(() => {
    if (!camera.value) return 64

    // Calculate average distance from camera to both endpoints
    const avgDist = (
        camera.value.position.distanceTo(props.startPosition) +
        camera.value.position.distanceTo(props.endPosition)
    ) / 2

    // Scale segments based on distance and connection type
    if (props.arcType === 'inter-layer') {
        // Inter-layer connections need more segments for jagged appearance
        if (avgDist > 100) return 16
        if (avgDist > 50) return 32
        return 64
    } else {
        // Same-chain connections can use fewer segments
        if (avgDist > 100) return 8
        if (avgDist > 50) return 16
        return 32
    }
})

// Performance optimization: Only render when visible
const isVisible = ref(true)
onLoop(() => {
    if (!camera.value) return

    // Simple frustum culling
    const avgDist = (
        camera.value.position.distanceTo(props.startPosition) +
        camera.value.position.distanceTo(props.endPosition)
    ) / 2

    // Only render if reasonably close to camera
    isVisible.value = avgDist < 150
})
</script>

<template>
    <TresMesh v-if="isVisible">
        <TresTubeGeometry :path="path" :tubular-segments="tubeSegments" :radius="thickness" :radial-segments="8"
            :closed="false" />
        <TresShaderMaterial :uniforms="uniforms" vertex-shader="
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    " fragment-shader="
      uniform vec3 color;
      uniform float time;
      uniform float arcType; // 0.0 for inter-layer, 1.0 for same-chain
      uniform float flowSpeed;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        float v = vUv.x; // Position along the tube
        
        if (arcType < 0.5) {
          // Inter-layer: Electric arc effect
          float noise = sin(v * 50.0 + time * 5.0 * flowSpeed) * 0.5 + 0.5;
          float pulse = sin(v * 20.0 - time * 10.0 * flowSpeed) * 0.5 + 0.5;
          
          // Edge effect
          float edge = pow(1.0 - vUv.y, 2.0) * 2.0;
          
          // Combine effects
          vec3 finalColor = color * (1.0 + noise * 0.3) * (0.8 + pulse * 0.4);
          finalColor *= (0.6 + edge * 0.4);
          
          gl_FragColor = vec4(finalColor, 0.9);
        } else {
          // Same-chain: Smooth energy flow effect
          float flow = fract(v * 3.0 - time * flowSpeed);
          float glow = pow(sin(flow * 3.14159), 2.0) * 0.7 + 0.3;
          
          // Core and edge
          float core = smoothstep(0.4, 0.5, 1.0 - abs(vUv.y - 0.5) * 2.0);
          float edge = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.0);
          
          // Combine effects
          vec3 finalColor = color * (glow * 0.7 + 0.3);
          finalColor = mix(finalColor, finalColor * 1.5, core);
          finalColor *= (0.7 + edge * 0.3);
          
          gl_FragColor = vec4(finalColor, 0.85);
        }
      }
    " transparent depthWrite />
    </TresMesh>
</template>
