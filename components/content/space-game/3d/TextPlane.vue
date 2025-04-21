<script setup lang="ts">
import { watch, onMounted, ref } from 'vue'
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

// Function to render text on canvas
function renderTextToCanvas() {
    if (typeof document === 'undefined') return;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fontAvailable = document.fonts.check(`bold 10px "Kode Mono"`)

    if (fontAvailable) {
        // Set text properties
        const fontSize = 74;
        ctx.font = `bold ${fontSize}px "Kode Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = props.color;

        // Measure text width to ensure canvas can fit it
        const metrics = ctx.measureText(props.text);
        const textWidth = metrics.width;

        // Adjust canvas size if needed to fit text
        if (textWidth > canvas.width * 0.8) {
            const newFontSize = Math.floor(fontSize * (canvas.width * 0.8) / textWidth);
            ctx.font = `bold ${newFontSize}px "Kode Mono", "Teko", monospace, sans-serif`;
        }

        // Draw text in a single line
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.fillText(props.text, centerX, centerY);
    }

    const texture = new CanvasTexture(canvas);
    texture.premultiplyAlpha = true;
    texture.needsUpdate = true;
    textTexture.value = texture;
}

// Generate text canvas on mounted, with font loading check
onMounted(async () => {
    if (typeof document === 'undefined') return;

    // Render an initial blank transparent texture
    renderTextToCanvas();

    // Preload fonts
    if ('fonts' in document) {
        try {
            // Fix font URL, using correct font file URL instead of CSS URL
            await document.fonts.load('bold 74px "Kode Mono"');

            // Wait for all fonts to be ready
            await document.fonts.ready;

            // Render again after fonts are loaded
            renderTextToCanvas();
        } catch (error) {
            console.error("Error loading fonts:", error);
        }

        // Set delayed retry to ensure font loading
        setTimeout(() => {
            renderTextToCanvas();
        }, 1000);
    }
});

// Add watchers to ensure texture updates when mode changes
watch(() => props.text, () => {
    renderTextToCanvas();
});
</script>

<template>
    <TresGroup :position="position" :rotation="rotation" :scale="[scale, scale, scale]">
        <!-- Text plane using canvas texture -->
        <TresSprite :scale="[planeSize, planeSize / 2, 1]">
            <TresSpriteMaterial v-if="textTexture" :map="textTexture" :transparent="true" :depthWrite="false"
                :depthTest="true" :alphaTest="0.01" :side="2" />
        </TresSprite>
    </TresGroup>
</template>