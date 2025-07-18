<script setup lang="ts">
import type { SceneConfig } from '../../config/scene-config'

interface Props {
    config: SceneConfig
}

defineProps<Props>()
</script>

<template>
    <TresGroup>
        <!-- Ground plane -->
        <TresMesh :position="[0, 0, 0]">
            <TresPlaneGeometry :args="[config.ground.size, config.ground.size]" />
            <TresMeshLambertMaterial color="#2d5a27" />
        </TresMesh>

        <!-- Mountain boundary -->
        <TresMesh :position="[0, 0.5, 0]">
            <TresRingGeometry :args="[
                config.movement.boundaryRadius,
                config.ground.size / 2,
                32,
                1
            ]" />
            <TresMeshLambertMaterial color="#4a4a4a" />
        </TresMesh>

        <!-- Mountain walls -->
        <TresMesh :position="[0, 1, 0]">
            <TresCylinderGeometry :args="[
                config.movement.boundaryRadius,
                config.movement.boundaryRadius,
                2,
                32,
                1,
                true
            ]" />
            <TresMeshLambertMaterial color="#6b6b6b" :side="2" />
        </TresMesh>
    </TresGroup>
</template>