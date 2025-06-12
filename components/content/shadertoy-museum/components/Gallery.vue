<script setup lang="ts">
import { inject } from 'vue'
import { Box3, Color, MeshPhongMaterial, Vector3 } from 'three'

import { Logger } from '../../logger'

import { shaderToySrc } from '../fns/shaderToySrc'
import { shaderToyLights } from '../fns/shaderToyLights'

import type { Camera, Light, Mesh } from 'three'
import type { State } from '../index.vue'

const state = inject('state') as State

const { scene } = await useGLTF('/models/shadertoy-museum/gallery.glb', { draco: true })


// Custom mapping table: each display stand corresponds to a shader array, the first one is the default best
const customMappings = {
  ShaderToy000: ['petersenGraphDCC'],
  ShaderToy001: ['sinusoidalTresJS'],
  ShaderToy002: ['sinusoidalTresJS'],
  ShaderToy003: ['gamesOfSinus'],
  ShaderToy004: ['sinusoidalTresJS2']
}

Logger.log('Gallery', '🎨 Custom mappings configured:')
Object.entries(customMappings).forEach(([stand, shaders]) => {
  Logger.log('Gallery', `${stand}: [${shaders.join(', ')}] (default: ${shaders[0]})`)
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

  return {
    shader,
    lightFn,
    name: `${standName}_${shaderName}`,
    dimensions,
    cameras: (obj.children.filter((c: { isPerspectiveCamera: any }) => 'isPerspectiveCamera' in c && c.isPerspectiveCamera) ?? []) as Camera[],
    lights: (obj.children.filter((c: { isLight: any }) => 'isLight' in c && c.isLight) ?? []) as Light[],
    target: (obj.children.filter((c: { name: string }) => c.name.startsWith('Target')))[0] as Mesh,
    floor: (obj.children.filter((c: { name: string }) => c.name.startsWith('Floor')))[0] as Mesh,
  }
}

// Create shader targets based on mapping table
scene.traverse((obj) => {
  if (obj.name.startsWith('ShaderToy')) {
    Logger.log('Gallery', `🏛️ Processing stand: ${obj.name}`)

    if ('material' in obj) {
      obj.material = new MeshPhongMaterial({
        color: new Color('#ffffff'),
        emissive: new Color('#111133'), // Subtle emissive glow
        shininess: 100
      })
    }

    const assignedShaders = customMappings[obj.name as keyof typeof customMappings]

    if (assignedShaders && assignedShaders.length > 0) {
      Logger.log('Gallery', `📋 Assigned shaders for ${obj.name}:`, assignedShaders)
      // Create all assigned shader targets for this display stand
      assignedShaders.forEach((shaderName, index) => {
        // Check if shader exists
        if (!(shaderName in shaderToySrc)) {
          Logger.error('Gallery', `⚠️ Shader "${shaderName}" not found in shaderToySrc, skipping`)
          return
        }

        const isDefault = index === 0
        Logger.log('Gallery', `${isDefault ? '✅' : '🔄'} Creating target: ${obj.name} → ${shaderName} ${isDefault ? '(default)' : ''}`)

        try {
          const target = createShaderTarget(obj.name, shaderName, obj)
          state.shaderToyTargets.push(target)
        } catch (error) {
          Logger.error('Gallery', `💥 Error creating target for ${obj.name} → ${shaderName}:`, error)
        }
      })
    } else {
      Logger.error('Gallery', `⚠️ No shaders assigned to ${obj.name}`)
    }
  }
})

Logger.log('Gallery', `🎯 Created ${state.shaderToyTargets.length} total targets`)

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
          Logger.error('Gallery', 'Error processing light userData:', e)
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