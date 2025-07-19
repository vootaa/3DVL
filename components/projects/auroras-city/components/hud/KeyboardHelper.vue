<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

const isCompactMode = computed(() => windowWidth.value < 768 || windowHeight.value < 600)
const isUltraCompactMode = computed(() => windowWidth.value < 480 || windowHeight.value < 400)

const displayMode = computed(() => {
    if (isUltraCompactMode.value) return 'ultra'
    if (isCompactMode.value) return 'compact'
    return 'full'
})

const keyList = [
    { key: 'W/S', desc: 'Move Forward/Backward', compact: 'Forward/Back' },
    { key: 'A/D', desc: 'Move Left/Right', compact: 'Move L/R' },
    { key: 'I/K', desc: 'Move Up/Down', compact: 'Move Up/Down' },
    { key: '↑/↓', desc: 'Look Up/Down', compact: 'Look Up/Down' },
    { key: '←/→', desc: 'Turn Left/Right', compact: 'Turn L/R' },
    { key: 'Q/E', desc: 'Turn Left/Right', compact: 'Turn L/R' }
]

const handleResize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})
</script>

<template>
    <div class="keyboard-hud" :class="{
        'compact': displayMode === 'compact',
        'ultra-compact': displayMode === 'ultra'
    }">
        <div class="hud-title">
            <i class="i-carbon-keyboard hud-title-icon" aria-hidden="true" />
            <span v-if="displayMode === 'full'">Keyboard Controls</span>
            <span v-else-if="displayMode === 'compact'">Keys</span>
        </div>
        <div class="hud-divider"></div>
        <ul>
            <li v-for="item in keyList" :key="item.key">
                <b>{{ item.key }}</b>
                <template v-if="displayMode === 'full'">
                    : {{ item.desc }}
                </template>
                <template v-else-if="displayMode === 'compact'">
                    <span class="desc">: {{ item.compact }}</span>
                </template>
                <!-- No description in ultra-compact mode -->
            </li>
        </ul>
    </div>
</template>

<style scoped>
.keyboard-hud {
    position: fixed;
    left: 24px;
    bottom: 24px;
    background: rgba(10, 10, 20, 0.85);
    color: #fff;
    padding: 16px 20px;
    border-radius: 10px;
    font-size: 12px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    min-width: 220px;
    max-width: 320px;
    transition: all 0.2s;
}

.hud-title {
    font-weight: bold;
    margin-bottom: 8px;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.hud-divider {
    height: 1px;
    background: linear-gradient(90deg, #00ccff33 0%, #00ccff99 50%, #00ccff33 100%);
    margin-bottom: 10px;
    border: none;
}

.hud-title-icon {
    font-size: 18px;
    color: #00ccff;
    filter: drop-shadow(0 0 4px #00ccff88);
}

ul {
    margin: 0;
    padding: 0;
    list-style: none;
}

li {
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
}

b {
    color: #00ccff;
}

/* Compact mode */
.compact {
    padding: 10px 14px;
    font-size: 11px;
    max-width: 180px;
    min-width: 140px;
}

.compact .hud-title {
    font-size: 13px;
    gap: 6px;
}

.compact .hud-title-icon {
    font-size: 15px;
}

.compact .hud-divider {
    margin-bottom: 7px;
}

.compact li {
    margin-bottom: 3px;
}

.compact b {
    font-size: 11px;
}

.compact .desc {
    color: #99ccff;
    font-size: 10px;
}

/* Ultra-compact mode */
.ultra-compact {
    padding: 6px 8px;
    font-size: 10px;
    max-width: 80px;
    min-width: 30px;
}

.ultra-compact .hud-title {
    font-size: 11px;
    gap: 4px;
}

.ultra-compact .hud-title-icon {
    font-size: 12px;
}

.ultra-compact .hud-divider {
    margin-bottom: 4px;
}

.ultra-compact li {
    margin-bottom: 2px;
}

.ultra-compact b {
    font-size: 10px;
}

.ultra-compact .desc {
    display: none;
}
</style>