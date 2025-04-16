<script setup lang="ts">
import {
    Color, DoubleSide, MeshBasicMaterial, RingGeometry, SphereGeometry, BufferGeometry,
    LineBasicMaterial, Float32BufferAttribute, Vector3, Euler
} from 'three';

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
    },
    showLayerConnections: {
        type: Boolean,
        default: false
    },
    nextLayerPosition: {
        type: Array as unknown as () => [number, number, number],
        default: () => [0, 0, 0]
    },
    nextLayerRotation: {
        type: Array as unknown as () => [number, number, number],
        default: () => [0, 0, 0]
    },
    nextLayerScale: {
        type: Number,
        default: 1
    },
    layerId: {
        type: Number,
        default: 0
    }, connectionColor: {
        type: String,
        default: 'white'
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
const getNodeWorldPositions = () => {
    const worldPositions = [];

    const rotation = new Vector3(props.rotation[0], props.rotation[1], props.rotation[2]);
    const position = new Vector3(props.position[0], props.position[1], props.position[2]);
    const scale = props.scale;

    for (let i = 0; i < 20; i++) {
        let angle = ANGLES[i];
        let radius;

        if (i < 5) {
            radius = props.middleRadius;
        } else if (i < 10) {
            radius = props.innerRadius;
        } else {
            radius = props.outerRadius;
        }

        const localPos = new Vector3(
            radius * Math.cos(angle) * scale,
            radius * Math.sin(angle) * scale,
            0
        );

        localPos.applyEuler(new Euler(rotation.x, rotation.y, rotation.z));

        const worldPos = new Vector3(
            localPos.x + position.x,
            localPos.y + position.y,
            localPos.z + position.z
        );

        worldPositions.push(worldPos);
    }

    return worldPositions;
};

const getNextLayerNodeWorldPositions = () => {
    if (!props.showLayerConnections) return [];

    const worldPositions = [];

    const rotation = new Vector3(props.nextLayerRotation[0], props.nextLayerRotation[1], props.nextLayerRotation[2]);
    const position = new Vector3(props.nextLayerPosition[0], props.nextLayerPosition[1], props.nextLayerPosition[2]);
    const scale = props.nextLayerScale;

    for (let i = 0; i < 20; i++) {
        let angle = ANGLES[i];
        let radius;

        if (i < 5) {
            radius = props.middleRadius;
        } else if (i < 10) {
            radius = props.innerRadius;
        } else {
            radius = props.outerRadius;
        }

        const localPos = new Vector3(
            radius * Math.cos(angle) * scale,
            radius * Math.sin(angle) * scale,
            0
        );

        localPos.applyEuler(new Euler(rotation.x, rotation.y, rotation.z));

        const worldPos = new Vector3(
            localPos.x + position.x,
            localPos.y + position.y,
            localPos.z + position.z
        );

        worldPositions.push(worldPos);
    }

    return worldPositions;
};

const layerConnections = computed(() => {
    if (!props.showLayerConnections) return [];

    const connections = [];
    const currentPositions = getNodeWorldPositions();
    const nextPositions = getNextLayerNodeWorldPositions();

    if (currentPositions.length === 0 || nextPositions.length === 0) return [];

    for (let i = 0; i < 20; i++) {
        const geometry = new BufferGeometry();

        const vertices = new Float32Array([
            currentPositions[i].x, currentPositions[i].y, currentPositions[i].z,
            nextPositions[i].x, nextPositions[i].y, nextPositions[i].z
        ]);

        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

        connections.push({
            geometry,
            material: new LineBasicMaterial({
                color: getChainColor(i),
                transparent: true,
                opacity: 0.7
            }),
            chainId: i
        });
    }

    return connections;
});

function getChainColor(chainId: number): Color {
    if (chainId < 5) {
        return new Color(props.middleColor).multiplyScalar(0.9);
    } else if (chainId < 10) {
        return new Color(props.innerColor).multiplyScalar(0.9);
    } else {
        return new Color(props.outerColor).multiplyScalar(0.9);
    }
}

defineExpose({
    getNodeWorldPositions
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
    <TresLine v-for="connection in layerConnections" :key="`connection-${connection.chainId}`"
        :geometry="connection.geometry" :material="connection.material" />
</template>