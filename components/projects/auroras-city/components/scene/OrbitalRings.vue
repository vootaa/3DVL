<script setup lang="ts">
import type { SceneConfig } from '../../config/scene-config'

interface Props {
    config: SceneConfig
}

defineProps<Props>()
</script>

<template>
    <TresGroup>
        <!-- Inner ring -->
        <TresMesh :position="[0, 0, 0]" :rotation="[-Math.PI / 2, 0, 0]">
            <TresRingGeometry :args="[
                config.rings.inner.radius - config.rings.inner.width / 2,
                config.rings.inner.radius + config.rings.inner.width / 2,
                32,
                1
            ]" />
            <TresMeshLambertMaterial color="#ffd700" />
        </TresMesh>

        <!-- Middle ring -->
        <TresMesh :position="[0, 0, 0]" :rotation="[-Math.PI / 2, 0, 0]">
            <TresRingGeometry :args="[
                config.rings.middle.radius - config.rings.middle.width / 2,
                config.rings.middle.radius + config.rings.middle.width / 2,
                32,
                1
            ]" />
            <TresMeshLambertMaterial color="#ff6b6b" />
        </TresMesh>

        <!-- Outer ring -->
        <TresMesh :position="[0, 0, 0]" :rotation="[-Math.PI / 2, 0, 0]">
            <TresRingGeometry :args="[
                config.rings.outer.radius - config.rings.outer.width / 2,
                config.rings.outer.radius + config.rings.outer.width / 2,
                32,
                1
            ]" />
            <TresMeshLambertMaterial color="#4ecdc4" />
        </TresMesh>
    </TresGroup>
</template>