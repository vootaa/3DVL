<script setup lang="ts">
import { extend, useLoop, useTres } from '@tresjs/core'
import { shallowRef, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Logger } from './logger'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

extend({ EffectComposer, RenderPass, UnrealBloomPass, OutputPass, ShaderPass })

interface Props {
  bloomStrength?: number
  bloomRadius?: number
  bloomThreshold?: number
  noiseShader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  bloomStrength: 0.3,
  bloomRadius: 0.4,
  bloomThreshold: 0.1,
  noiseShader: false
})

const { renderer, scene, camera, sizes } = useTres()
const composer = shallowRef<EffectComposer>()

const noiseShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    noiseInfluence: { value: 0.2 }
  },
  vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
  fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float time;
            uniform float noiseInfluence;
            varying vec2 vUv;

            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy));
                vec2 x0 = v - i + dot(i, C.xx);
                vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
                m = m*m;
                m = m*m;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                vec3 g;
                g.x = a0.x * x0.x + h.x * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                vec2 uv = vUv;
                float noise = snoise(uv * 8.0 + time * 0.2) * noiseInfluence;
                uv.x += noise * 0.02;
                uv.y += noise * 0.02;
                vec4 texel = texture2D(tDiffuse, uv);
                float colorNoise = snoise(uv * 3.0 - time * 0.1) * 0.1;
                texel.r += colorNoise * texel.r;
                texel.b -= colorNoise * 0.5 * texel.b;
                gl_FragColor = texel;
            }
        `,
}

const noisePass = shallowRef<ShaderPass>()

onMounted(() => {
  nextTick(() => {
    if (composer.value) {
      composer.value.setSize(sizes.width.value, sizes.height.value)
      Logger.log('PostEffects', 'Composer setSize onMounted', { width: sizes.width.value, height: sizes.height.value })

      if (props.noiseShader) {
        noisePass.value = new ShaderPass(noiseShader)
        composer.value.addPass(noisePass.value)
        Logger.log('PostEffects', 'Noise ShaderPass added', noiseShader)
      }
    }
  })
})

watch([() => sizes.width.value, () => sizes.height.value], () => {
  if (composer.value) {
    composer.value.setSize(sizes.width.value, sizes.height.value)
    Logger.log('PostEffects', 'Composer setSize on resize', { width: sizes.width.value, height: sizes.height.value })
  }
})

onUnmounted(() => {
  if (composer.value) {
    composer.value.dispose()
    Logger.log('PostEffects', 'Composer disposed')
  }
})

useLoop().render(({ elapsed }) => {
  try {
    if (props.noiseShader && noisePass.value) {
      noisePass.value.uniforms.time.value = elapsed
    }
    if (composer.value) {
      composer.value.render()
    }
  }
  catch (error) {
    Logger.error('PostEffects', 'Render Error', error)
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)
      Logger.warn('PostEffects', 'Fallback to renderer.render')
    }
  }
})
</script>

<template>
  <TresEffectComposer ref="composer" :args="[renderer]" :set-size="[sizes.width.value, sizes.height.value]">
    <TresRenderPass :args="[scene, camera]" attach="passes-0" />
    <TresUnrealBloomPass
      :args="[[sizes.width.value, sizes.height.value], props.bloomStrength, props.bloomRadius, props.bloomThreshold]"
      attach="passes-1" />
    <TresOutputPass attach="passes-2" />
    <TresShaderPass />
  </TresEffectComposer>
</template>