<script setup lang="ts">
import type { Camera, Light, Mesh } from 'three'
import { Box3, Color, MeshPhongMaterial, Quaternion, Vector3 } from 'three'
import { inject } from 'vue'
import { shaderToySrc } from '../fns/shaderToySrc'
import type { State } from '../index.vue'
import { shaderToyLights } from '../fns/shaderToyLights'

const state = inject('state') as State

const { scene } = await useGLTF('/models/shadertoy-museum/gallery.glb', { draco: true })

const material = new MeshPhongMaterial({ color: new Color('#000022') })

// 定制映射表：每个展示台对应的着色器数组，第一个是默认最佳的
const customMappings = {
  ShaderToy000: ['octgrams', 'tiles', 'truchet'],                    // 几何图案类
  ShaderToy001: ['sinusoidalTresJS', 'sinusoidalTresJS2', 'rainbow'], // 波浪效果类
  ShaderToy002: ['mandelbulb', 'fractalPyramid', 'star'],            // 3D 分形类
  ShaderToy003: ['gamesOfSinus', 'prettyHip', 'raymarchingBasic'],   // 游戏风格类
  ShaderToy004: ['sinusoidalTresJS2', 'seventiesMelt']   // 波浪变体类
} as const

console.log('🎨 Custom mappings configured:')
Object.entries(customMappings).forEach(([stand, shaders]) => {
  console.log(`${stand}: [${shaders.join(', ')}] (default: ${shaders[0]})`)
})

function createShaderTarget(standName: string, shaderName: string, obj: any) {
  const shader = shaderToySrc[shaderName as keyof typeof shaderToySrc] as string
  const lightFn = shaderToyLights[shaderName as keyof typeof shaderToyLights] ?? (() => { })

  const box = new Box3()
  box.setFromObject(obj)
  const size = new Vector3()
  box.getSize(size)

  const dimensions = new Vector3(1, 1, 0)
  dimensions.setFromMatrixPosition(obj.matrixWorld)
  dimensions.setFromMatrixScale(obj.matrixWorld)
  dimensions.multiplyScalar(128)
  dimensions.x = Math.floor(dimensions.x)
  dimensions.y = Math.floor(dimensions.y)

  const shaderDataStr = (shader.split('/** SHADERDATA')[1] ?? '*/').split('*/')[0] ?? '{}'
  const shaderMetaData = (() => {
    let data = { title: '', author: '', description: '', href: 'https://www.shadertoy.com/' }
    try {
      data = { ...data, ...JSON.parse(shaderDataStr) }
    } catch (_) { }
    return data
  })()

  return {
    shader,
    ...shaderMetaData,
    lightFn,
    name: `${standName}_${shaderName}`,
    dimensions,
    cameras: (obj.children.filter((c: { isPerspectiveCamera: any }) => 'isPerspectiveCamera' in c && c.isPerspectiveCamera) ?? []) as Camera[],
    lights: (obj.children.filter((c: { isLight: any }) => 'isLight' in c && c.isLight) ?? []) as Light[],
    target: (obj.children.filter((c: { name: string }) => c.name.startsWith('Target')))[0] as Mesh,
    floor: (obj.children.filter((c: { name: string }) => c.name.startsWith('Floor')))[0] as Mesh,
  }
}

// 根据映射表创建着色器目标
scene.traverse((obj) => {
  if ('material' in obj) {
    obj.material = material
  }

  if (obj.name.startsWith('ShaderToy')) {
    console.log(`🏛️ Processing stand: ${obj.name}`)

    const assignedShaders = customMappings[obj.name as keyof typeof customMappings]

    if (assignedShaders && assignedShaders.length > 0) {
      console.log(`📋 Assigned shaders for ${obj.name}:`, assignedShaders)

      // 为这个展示台创建所有分配的着色器目标
      assignedShaders.forEach((shaderName, index) => {
        // 检查着色器是否存在
        if (!(shaderName in shaderToySrc)) {
          console.warn(`⚠️ Shader "${shaderName}" not found in shaderToySrc, skipping`)
          return
        }

        const isDefault = index === 0
        console.log(`${isDefault ? '✅' : '🔄'} Creating target: ${obj.name} → ${shaderName} ${isDefault ? '(default)' : ''}`)

        try {
          const target = createShaderTarget(obj.name, shaderName, obj)
          state.shaderToyTargets.push(target)
        } catch (error) {
          console.error(`💥 Error creating target for ${obj.name} → ${shaderName}:`, error)
        }
      })
    } else {
      console.warn(`⚠️ No shaders assigned to ${obj.name}`)
    }
  }
})

console.log(`🎯 Created ${state.shaderToyTargets.length} total targets`)

state.shaderToyTargets.sort((a, b) => (a.name).localeCompare(b.name))

for (const info of state.shaderToyTargets) {
  for (const light of info.lights) {
    light.getWorldPosition(light.position)
    light.removeFromParent()

    const userData = light.userData
    for (const key of Object.keys(userData)) {
      if ((typeof userData[key]) === 'string' && userData[key].startsWith('{')) {
        try {
          if (key === 'x' || key === 'y' || key === 'z') {
            const data = JSON.parse(userData[key])
            data.init = light.position[key]
            userData[key] = data
          }
          if (key === 'intensity') {
            const data = JSON.parse(userData[key])
            userData[key] = data
          }
        }
        catch (e) {
          console.error(e)
        }
      }
    }
  }

  for (const obj of [info.target, info.floor]) {
    obj.getWorldPosition(obj.position)
    obj.getWorldQuaternion(obj.quaternion)
    obj.getWorldScale(obj.scale)
    obj.removeFromParent()
  }
}

onMounted(
  () => setTimeout(() => {
    if (state.i < 0) {
      state.next()
    }
  }, 3000),
)
</script>

<template>
  <TresGroup>
    <primitive :object="scene" />
  </TresGroup>
</template>