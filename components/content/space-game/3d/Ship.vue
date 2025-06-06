<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { BoxGeometry, Color, Group, MeshBasicMaterial, Vector3 } from 'three'
import { onMounted, inject, shallowRef, ref, computed } from 'vue'

import { gameStateManager } from '../core/GameStateManager'

import { ShipController } from './ship/controller'
import { ShipVisualEffects } from './ship/effects'
import { ShipModelLoader } from './ship/loader'

import type { ShipModelData } from './ship/types'
import type { GameStore } from '../GameStore'

// 游戏存储
const gameStore = inject('gameStore') as GameStore

// 模型数据
const modelData = ref<ShipModelData>({
  isLoaded: false,
})

// 几何体和材质
const geometry = new BoxGeometry(1, 1, 40)
const lightgreen = new Color('lightgreen')
const hotpink = new Color('hotpink')
const laserMaterial = new MeshBasicMaterial({ color: lightgreen })
const crossMaterial = new MeshBasicMaterial({ color: hotpink, fog: false })

// 向量
const position = new Vector3()
const direction = new Vector3()

// 3D对象引用
const main = shallowRef<Group>(new Group())
const laserGroup = shallowRef<Group | Group[]>(new Group())
const laserLight = shallowRef<any>(null)
const exhaust = shallowRef<Group>(new Group())
const cross = shallowRef<Group>(new Group())
const target = shallowRef<Group>(new Group())

// 鼠标位置
const mouseX = computed(() => gameStore.mutation.mouse.x)
const mouseY = computed(() => gameStore.mutation.mouse.y)

// 创建控制器和效果管理器
const shipRefs = {
  main, laserGroup, laserLight, exhaust, cross, target, position, direction
}
const shipController = new ShipController(shipRefs, gameStore, mouseX, mouseY)
const visualEffects = new ShipVisualEffects(shipRefs, gameStore, crossMaterial)

// 加载模型
onMounted(() => {
  ShipModelLoader.loadModel(modelData)
})

// 渲染循环
useLoop().onBeforeRender(() => {
  const time = gameStore.mutation.clock.getElapsedTime()
  
  // 通用浮动效果
  shipController.handleFloatEffect(time)
  
  // 根据游戏状态控制飞船
  if (gameStateManager.isObservationMode()) {
    shipController.handleObservationMode(time)
  } else if (gameStateManager.canFlightMode()) {
    shipController.handleFlightMode()
  }
  
  // 更新视觉效果
  visualEffects.updateVisualEffects(time)
  
  // 调试日志
  shipController.logDebugInfo()
})
</script>

<template>
  <TresGroup ref="main">
    <TresPointLight
      color="cornflowerblue"
      :intensity="500"
      :distance="500"
      :position-z="10"
    />
    <TresGroup :scale="[3.5, 3.5, 3.5]">
      <!-- 准心 -->
      <TresGroup
        ref="cross"
        :position="[0, 0, -300]"
        name="cross"
      >
        <TresMesh
          :render-order="1000"
          :material="crossMaterial"
        >
          <TresBoxGeometry :args="[20, 2, 2]" />
        </TresMesh>
        <TresMesh
          :render-order="1000"
          :material="crossMaterial"
        >
          <TresBoxGeometry :args="[2, 20, 2]" />
        </TresMesh>
      </TresGroup>
      
      <!-- 目标指示器 -->
      <TresGroup
        ref="target"
        :position="[0, 0, -300]"
        name="target"
      >
        <TresMesh
          :position="[0, 20, 0]"
          :render-order="1000"
          :material="crossMaterial"
        >
          <TresBoxGeometry :args="[40, 2, 2]" />
        </TresMesh>
        <TresMesh
          :position="[0, -20, 0]"
          :render-order="1000"
          :material="crossMaterial"
        >
          <TresBoxGeometry :args="[40, 2, 2]" />
        </TresMesh>
        <TresMesh
          :position="[20, 0, 0]"
          :render-order="1000"
          :material="crossMaterial"
        >
          <TresBoxGeometry :args="[2, 40, 2]" />
        </TresMesh>
        <TresMesh
          :position="[-20, 0, 0]"
          :render-order="1000"
          :material="crossMaterial"
        >
          <TresBoxGeometry :args="[2, 40, 2]" />
        </TresMesh>
      </TresGroup>
      
      <!-- 激光光效 -->
      <TresPointLight
        ref="laserLight"
        :position="[0, 0, -20]"
        :distance="100"
        :intensity="0"
        color="lightgreen"
      />
      
      <!-- 激光 -->
      <TresGroup
        v-for="_ in gameStore.lasers"
        :key="_"
        ref="laserGroup"
      >
        <TresMesh
          :position="[-2.8, 0, -0.8]"
          :geometry="geometry"
          :material="laserMaterial"
        />
        <TresMesh
          :position="[2.8, 0, -0.8]"
          :geometry="geometry"
          :material="laserMaterial"
        />
      </TresGroup>
      
      <!-- 飞船模型 -->
      <TresGroup :rotation="[Math.PI / 2, Math.PI, 0]">
        <template v-if="modelData.isLoaded">
          <TresMesh v-if="modelData.Renault_0" :geometry="modelData.Renault_0.geometry" :material="modelData.Renault_0.material" />
          <TresMesh v-if="modelData.Renault_1" :geometry="modelData.Renault_1.geometry" :material="modelData.Renault_1.material" />
          <TresMesh v-if="modelData.Renault_2" :geometry="modelData.Renault_2.geometry" :material="modelData.Renault_2.material" />
          <TresMesh v-if="modelData.Renault_3" :geometry="modelData.Renault_3.geometry" :material="modelData.Renault_3.material" />
          <TresMesh v-if="modelData.Renault_4" :geometry="modelData.Renault_4.geometry" :material="modelData.Renault_4.material" />
          <TresMesh v-if="modelData.Renault_5" :geometry="modelData.Renault_5.geometry" :material="modelData.Renault_5.material" />
        </template>
      </TresGroup>
    </TresGroup>
    
    <!-- 引擎尾焰 -->
    <TresMesh
      ref="exhaust"
      :scale="[1, 1, 30]"
      :position="[0, 1, 30]"
    >
      <TresDodecahedronGeometry :args="[1.5, 0]" />
      <TresMeshBasicMaterial color="lightblue" />
    </TresMesh>
  </TresGroup>
</template>