<script setup lang="ts">
import type { SceneConfig } from '../../config/scene-config'

interface Props {
    config: SceneConfig
}

defineProps<Props>()
</script>

<template>
    <TresMesh :position="[0, 0, 0]">
        <TresSphereGeometry :args="[
            config.dome.radius,
            config.dome.segments,
            config.dome.segments / 2,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        ]" />
        <TresMeshLambertMaterial color="#87CEEB" :transparent="true" :opacity="0.3" :side="2" />
    </TresMesh>
</template>