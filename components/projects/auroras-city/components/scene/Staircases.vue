<script setup lang="ts">
import { computed } from 'vue'
import { Vector3, Euler } from 'three'
import type { SceneConfig } from '../../config/scene-config'
import { petersenNodes, degToRad } from '../../config/scene-config'

interface Props {
  config: SceneConfig
}

const props = defineProps<Props>()

interface Step {
  index: number
  position: Vector3
  width: number
  height: number
  depth: number
}

interface Staircase {
  position: Vector3
  rotation: Euler
  steps: Step[]
}

const staircases = computed(() => {
  const result: Staircase[] = []
  const middleNodes = petersenNodes.filter(node => node.orbit === 'middle')
  
  for (let i = 0; i < props.config.stairs.count; i++) {
    const currentNode = middleNodes[i]
    const nextNode = middleNodes[(i + 1) % middleNodes.length]
    
    // Calculate stair position (between two middle nodes)
    const midAngle = (currentNode.theta + nextNode.theta) / 2
    const stairRadius = (currentNode.r + nextNode.r) / 2
    
    const position = new Vector3(
      stairRadius * Math.cos(degToRad(midAngle)),
      0,
      stairRadius * Math.sin(degToRad(midAngle))
    )
    
    const rotation = new Euler(0, degToRad(midAngle), 0)
    
    // Create steps
    const steps: Step[] = []
    const stepHeight = props.config.stairs.height / props.config.stairs.steps
    
    for (let j = 0; j < props.config.stairs.steps; j++) {
      const stepY = (j + 0.5) * stepHeight
      const stepRadius = stairRadius - (j * 0.1) // Steps get narrower as they go up
      
      steps.push({
        index: j,
        position: new Vector3(0, stepY, 0),
        width: props.config.stairs.width,
        height: stepHeight,
        depth: 0.3
      })
    }
    
    result.push({ position, rotation, steps })
  }
  
  return result
})
</script>

<template>
    <TresGroup>
        <TresGroup v-for="(stair, index) in staircases" :key="index" :position="stair.position"
            :rotation="stair.rotation">
            <TresMesh v-for="step in stair.steps" :key="step.index" :position="step.position">
                <TresBoxGeometry :args="[step.width, step.height, step.depth]" />
                <TresMeshLambertMaterial color="#8fbc8f" />
            </TresMesh>
        </TresGroup>
    </TresGroup>
</template>