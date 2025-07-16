<template>
<!-- Controller has no UI, only logic -->
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useTresContext } from '@tresjs/core'
import { Vector3 } from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'

let controls: PointerLockControls
let velocity = new Vector3()
let direction = new Vector3()
let moveForward = false
let moveBackward = false
let moveLeft = false
let moveRight = false
let prevTime = performance.now()

const { camera, renderer } = useTresContext()

function onKeyDown(event: KeyboardEvent) {
  switch (event.code) {
    case 'KeyW': moveForward = true; break
    case 'KeyS': moveBackward = true; break
    case 'KeyA': moveLeft = true; break
    case 'KeyD': moveRight = true; break
  }
}

function onKeyUp(event: KeyboardEvent) {
  switch (event.code) {
    case 'KeyW': moveForward = false; break
    case 'KeyS': moveBackward = false; break
    case 'KeyA': moveLeft = false; break
    case 'KeyD': moveRight = false; break
  }
}

function animate() {
  const time = performance.now()
  if (controls && controls.isLocked) {
    const delta = (time - prevTime) / 1000
    velocity.x -= velocity.x * 10.0 * delta
    velocity.z -= velocity.z * 10.0 * delta

    direction.z = Number(moveForward) - Number(moveBackward)
    direction.x = Number(moveRight) - Number(moveLeft)
    direction.normalize()

    if (moveForward || moveBackward) velocity.z -= direction.z * 40.0 * delta
    if (moveLeft || moveRight) velocity.x -= direction.x * 40.0 * delta

    controls.moveRight(-velocity.x * delta)
    controls.moveForward(-velocity.z * delta)
  }
  prevTime = time
  requestAnimationFrame(animate)
}

onMounted(() => {
  if (camera.value && renderer.value) {
    controls = new PointerLockControls(camera.value, renderer.value.domElement)
    document.addEventListener('click', () => controls.lock())
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    animate()
  } else {
    console.error('Camera or renderer is undefined')
  }
})

onUnmounted(() => {
  if (controls && controls.unlock) controls.unlock()
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
})
</script>