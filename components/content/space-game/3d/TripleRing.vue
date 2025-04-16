<script setup lang="ts">
import { Color, DoubleSide, MeshBasicMaterial, RingGeometry, SphereGeometry } from 'three';

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
    },
    showNodes: {
        type: Boolean,
        default: true
    }
});

const geometryInner = new RingGeometry(props.innerRadius, props.innerRadius + props.innerThickness, props.segments)
const geometryMiddle = new RingGeometry(props.middleRadius, props.middleRadius + props.middleThickness, props.segments)
const geometryOuter = new RingGeometry(props.outerRadius, props.outerRadius + props.outerThickness, props.segments)

const materialInner = new MeshBasicMaterial({ color: new Color(props.innerColor), side: DoubleSide })
const materialMiddle = new MeshBasicMaterial({ color: new Color(props.middleColor), side: DoubleSide })
const materialOuter = new MeshBasicMaterial({ color: new Color(props.outerColor), side: DoubleSide })

const ANGLES = [
    5.0265, 0.0, 1.2566, 2.5133, 3.7699,
    5.0265, 0.0, 1.2566, 2.5133, 3.7699,
    4.8521, 0.1745, 1.0821, 2.6878, 3.5954, 5.2009, 6.1087, 1.4312, 2.3387, 3.9444
];

const nodes = computed(() => {
    if (!props.showNodes) return [];

    const result = [];

    const innerNodeGeometry = new SphereGeometry(0.01);
    const middleNodeGeometry = new SphereGeometry(0.01);
    const outerNodeGeometry = new SphereGeometry(0.008);

    const innerNodeMaterial = new MeshBasicMaterial({ color: new Color(props.innerColor).multiplyScalar(1.4) });
    const middleNodeMaterial = new MeshBasicMaterial({ color: new Color(props.middleColor).multiplyScalar(1.4) });
    const outerNodeMaterial = new MeshBasicMaterial({ color: new Color(props.outerColor).multiplyScalar(1.4) });


    for (let i = 0; i < 5; i++) {
        const angle = ANGLES[i];
        result.push({
            position: [
                props.middleRadius * Math.cos(angle),
                props.middleRadius * Math.sin(angle),
                0
            ] as [number, number, number],
            geometry: middleNodeGeometry,
            material: middleNodeMaterial,
            chainId: i
        });
    }

    for (let i = 5; i < 10; i++) {
        const angle = ANGLES[i];
        result.push({
            position: [
                props.innerRadius * Math.cos(angle),
                props.innerRadius * Math.sin(angle),
                0
            ] as [number, number, number],
            geometry: innerNodeGeometry,
            material: innerNodeMaterial,
            chainId: i
        });
    }

    for (let i = 10; i < 20; i++) {
        const angle = ANGLES[i];
        result.push({
            position: [
                props.outerRadius * Math.cos(angle),
                props.outerRadius * Math.sin(angle),
                0
            ] as [number, number, number],
            geometry: outerNodeGeometry,
            material: outerNodeMaterial,
            chainId: i
        });
    }

    return result;
});
</script>

<template>
    <TresGroup :position="position" :rotation="rotation" :scale="[scale, scale, scale]">
        <TresMesh :geometry="geometryInner" :material="materialInner" />
        <TresMesh :geometry="geometryMiddle" :material="materialMiddle" />
        <TresMesh :geometry="geometryOuter" :material="materialOuter" />

        <TresMesh v-for="node in nodes" :key="node.chainId" :geometry="node.geometry" :material="node.material"
            :position="node.position" />
    </TresGroup>
</template>