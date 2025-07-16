<script setup lang="ts">
import { onMounted, onUnmounted, inject } from 'vue'
import { useTresContext } from '@tresjs/core'
import { Euler, Vector3 } from 'three'

interface Props {
    moveSpeed?: number
    rotateSpeed?: number
}
const props = withDefaults(defineProps<Props>(), {
    moveSpeed: 0.1,
    rotateSpeed: 0.005,
})

const { camera } = useTresContext()
const getTerrainHeight = inject<(x: number, z: number) => number>('getTerrainHeight')
const CAMERA_HEIGHT = 1.7

let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false
let rotateLeft = false, rotateRight = false, rotateUp = false, rotateDown = false

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
        // move
        const direction = new Vector3()
        camera.value.getWorldDirection(direction)
        direction.y = 0
        direction.normalize()
        const right = new Vector3().crossVectors(camera.value.up, direction).normalize()
        if (moveForward) camera.value.position.addScaledVector(direction, props.moveSpeed)
        if (moveBackward) camera.value.position.addScaledVector(direction, -props.moveSpeed)
        if (moveLeft) camera.value.position.addScaledVector(right, props.moveSpeed)
        if (moveRight) camera.value.position.addScaledVector(right, -props.moveSpeed)

        // Bind terrain height
        if (getTerrainHeight) {
            const x = camera.value.position.x
            const z = camera.value.position.z
            const terrainY = getTerrainHeight(x, z)
            camera.value.position.y = terrainY + CAMERA_HEIGHT
        }

        // rotate
        const euler = new Euler(
            camera.value.rotation.x + (rotateUp ? -props.rotateSpeed : 0) + (rotateDown ? props.rotateSpeed : 0),
            camera.value.rotation.y + (rotateLeft ? props.rotateSpeed : 0) + (rotateRight ? -props.rotateSpeed : 0),
            0,
            'YXZ'
        )
        camera.value.rotation.copy(euler)
    }
    requestAnimationFrame(animate)
}

onMounted(() => {
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    animate()
})
onUnmounted(() => {
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup', onKeyUp)
})
</script>