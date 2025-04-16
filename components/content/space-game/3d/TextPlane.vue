<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { CanvasTexture } from 'three'
import type { PropType } from 'vue'

const props = defineProps({
    position: {
        type: Array as unknown as PropType<[number, number, number]>,
        required: true
    },
    rotation: {
        type: Array as unknown as PropType<[number, number, number]>,
        required: true
    },
    scale: {
        type: Number,
        default: 1
    },
    text: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#ffffff'
    },
    planeSize: {
        type: Number,
        default: 20
    }
});

// Create canvas texture for text
const textTexture = ref<CanvasTexture | null>(null);

// Generate text canvas on mounted
onMounted(() => {
    // We'll create this in browser environment only
    if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Set text properties
            const fontSize = 74;
            ctx.font = `bold ${fontSize}px "Kode Mono", monospace, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = props.color;

            const text = props.text;

            // Measure text width to ensure canvas can fit it
            const metrics = ctx.measureText(text);
            const textWidth = metrics.width;

            // Adjust canvas size if needed to fit text
            if (textWidth > canvas.width * 0.8) {
                const newFontSize = Math.floor(fontSize * (canvas.width * 0.8) / textWidth);
                ctx.font = `bold ${newFontSize}px "Kode Mono", monospace`;
            }

            // Draw text in a single line
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            ctx.fillText(text, centerX, centerY);
        }

        textTexture.value = new CanvasTexture(canvas);
    }
});
</script>

<template>
    <TresGroup :position="position" :rotation="rotation" :scale="[scale, scale, scale]">
        <!-- Text plane using canvas texture -->
        <TresSprite :scale="[planeSize, planeSize / 2, 1]">
            <TresSpriteMaterial v-if="textTexture" :map="textTexture" :transparent="true" :depthWrite="false" />
        </TresSprite>
    </TresGroup>
</template>