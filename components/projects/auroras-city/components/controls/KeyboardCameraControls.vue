<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useTresContext } from '@tresjs/core'
import { Euler, Vector3 } from 'three'

import type { SceneConfig } from '../../config/scene-config'

interface Props {
    moveSpeed?: number
    rotateSpeed?: number
    config: SceneConfig
    minHeight?: number  // Minimum camera height above ground
    maxHeight?: number  // Maximum camera height
}

const props = withDefaults(defineProps<Props>(), {
    moveSpeed: 0.15,
    rotateSpeed: 0.005,
    minHeight: 1.5,  // First person height
    maxHeight: 10.0  // Maximum jump/climb height
})

const { camera } = useTresContext()

let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false
let rotateLeft = false, rotateRight = false, rotateUp = false, rotateDown = false

// Movement boundary constraint function
function constrainPosition(position: Vector3): Vector3 {
    const constrainedPosition = position.clone()
    
    // Calculate distance from center (origin) in XZ plane
    const distanceFromCenter = Math.sqrt(
        constrainedPosition.x * constrainedPosition.x + 
        constrainedPosition.z * constrainedPosition.z
    )
    
    // If outside boundary, clamp to boundary circle
    if (distanceFromCenter > props.config.movement.boundaryRadius) {
        const scale = props.config.movement.boundaryRadius / distanceFromCenter
        constrainedPosition.x *= scale
        constrainedPosition.z *= scale
    }
    
    // Constrain Y position (height)
    constrainedPosition.y = Math.max(
        props.minHeight, 
        Math.min(props.maxHeight, constrainedPosition.y)
    )
    
    return constrainedPosition
}

// Check if a potential new position would be valid
function isValidPosition(newPosition: Vector3): boolean {
    const distanceFromCenter = Math.sqrt(
        newPosition.x * newPosition.x + 
        newPosition.z * newPosition.z
    )
    
    return distanceFromCenter <= props.config.movement.boundaryRadius &&
           newPosition.y >= props.minHeight &&
           newPosition.y <= props.maxHeight
}

function onKeyDown(e: KeyboardEvent) {
    switch (e.code) {
        case 'KeyW': moveForward = true; break
        case 'KeyS': moveBackward = true; break
        case 'KeyA': moveLeft = true; break
        case 'KeyD': moveRight = true; break
        case 'ArrowLeft': rotateLeft = true; break
        case 'ArrowRight': rotateRight = true; break
        case 'ArrowUp': rotateUp = true; break
        case 'ArrowDown': rotateDown = true; break
        case 'KeyQ': rotateLeft = true; break
        case 'KeyE': rotateRight = true; break
    }
}

function onKeyUp(e: KeyboardEvent) {
    switch (e.code) {
        case 'KeyW': moveForward = false; break
        case 'KeyS': moveBackward = false; break
        case 'KeyA': moveLeft = false; break
        case 'KeyD': moveRight = false; break
        case 'ArrowLeft': rotateLeft = false; break
        case 'ArrowRight': rotateRight = false; break
        case 'ArrowUp': rotateUp = false; break
        case 'ArrowDown': rotateDown = false; break
        case 'KeyQ': rotateLeft = false; break
        case 'KeyE': rotateRight = false; break
    }
}

function animate() {
    if (camera.value) {
        // Calculate movement directions
        const direction = new Vector3()
        camera.value.getWorldDirection(direction)
        direction.y = 0 // Keep movement horizontal
        direction.normalize()
        
        const right = new Vector3().crossVectors(camera.value.up, direction).normalize()
        
        // Calculate potential new position
        let newPosition = camera.value.position.clone()
        
        if (moveForward) {
            const testPosition = newPosition.clone().addScaledVector(direction, props.moveSpeed)
            if (isValidPosition(testPosition)) {
                newPosition = testPosition
            }
        }
        
        if (moveBackward) {
            const testPosition = newPosition.clone().addScaledVector(direction, -props.moveSpeed)
            if (isValidPosition(testPosition)) {
                newPosition = testPosition
            }
        }
        
        if (moveLeft) {
            const testPosition = newPosition.clone().addScaledVector(right, props.moveSpeed)
            if (isValidPosition(testPosition)) {
                newPosition = testPosition
            }
        }
        
        if (moveRight) {
            const testPosition = newPosition.clone().addScaledVector(right, -props.moveSpeed)
            if (isValidPosition(testPosition)) {
                newPosition = testPosition
            }
        }
        
        // Apply constrained position
        camera.value.position.copy(constrainPosition(newPosition))
        
        // Handle rotation
        const euler = new Euler(
            camera.value.rotation.x + (rotateUp ? -props.rotateSpeed : 0) + (rotateDown ? props.rotateSpeed : 0),
            camera.value.rotation.y + (rotateLeft ? props.rotateSpeed : 0) + (rotateRight ? -props.rotateSpeed : 0),
            0,
            'YXZ'
        )
        
        // Limit vertical rotation to prevent camera flipping
        euler.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, euler.x))
        
        camera.value.rotation.copy(euler)
    }
    
    requestAnimationFrame(animate)
}

onMounted(() => {
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    
    // Set initial camera position within bounds if needed
    if (camera.value) {
        camera.value.position.copy(constrainPosition(camera.value.position))
    }
    
    animate()
})

onUnmounted(() => {
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup', onKeyUp)
})
</script>

<template>
  <!-- This component doesn't render anything visible -->
</template>