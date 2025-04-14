<script setup lang="ts">
import { Color, DoubleSide, MeshBasicMaterial, RingGeometry } from 'three';

const props = defineProps({
    position: {
        type: Array as unknown as () => [number, number, number],
        required: true
    },
    rotation: {
        type: Array as unknown as () => [number, number, number],
        required: true
    },
    scale: {
        type: Number,
        required: true
    },
    innerColor: {
        type: String,
        default: 'dodgerblue'
    },
    middleColor: {
        type: String,
        default: 'hotpink'
    },
    outerColor: {
        type: String,
        default: 'gold'
    },
    innerRadius: {
        type: Number,
        default: 0.3
    },
    innerThickness: {
        type: Number,
        default: 0.005
    },
    middleRadius: {
        type: Number,
        default: 0.6
    },
    middleThickness: {
        type: Number,
        default: 0.005
    },
    outerRadius: {
        type: Number,
        default: 0.96
    },
    outerThickness: {
        type: Number,
        default: 0.005
    },
    segments: {
        type: Number,
        default: 64
    }
});

const geometryInner = new RingGeometry(props.innerRadius, props.innerRadius + props.innerThickness, props.segments)
const geometryMiddle = new RingGeometry(props.middleRadius, props.middleRadius + props.middleThickness, props.segments)
const geometryOuter = new RingGeometry(props.outerRadius, props.outerRadius + props.outerThickness, props.segments)

const materialInner = new MeshBasicMaterial({ color: new Color(props.innerColor), side: DoubleSide })
const materialMiddle = new MeshBasicMaterial({ color: new Color(props.middleColor), side: DoubleSide })
const materialOuter = new MeshBasicMaterial({ color: new Color(props.outerColor), side: DoubleSide })
</script>

<template>
    <TresGroup :position="position" :rotation="rotation" :scale="[scale, scale, scale]">
        <TresMesh :geometry="geometryInner" :material="materialInner" />
        <TresMesh :geometry="geometryMiddle" :material="materialMiddle" />
        <TresMesh :geometry="geometryOuter" :material="materialOuter" />
    </TresGroup>
</template>