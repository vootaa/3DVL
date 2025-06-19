<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { getNebulaIdentity, resetNebulaIdentity, appendAchievement } from '../core/nebula-id'

interface Props {
    achievement?: string
    showReset?: boolean
    autoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    achievement: '💎',
    showReset: true,
    autoRefresh: false
})

const nebulaId = ref('')
const isLoading = ref(true)
const error = ref<string | null>(null)

// 添加防抖的加载函数
let loadTimeout: NodeJS.Timeout
const debouncedLoad = () => {
    clearTimeout(loadTimeout)
    loadTimeout = setTimeout(load, 300)
}

const displayId = computed(() => {
    if (isLoading.value) return '🌌 加载中...'
    if (error.value) return '❌ 加载失败'
    return appendAchievement(nebulaId.value, props.achievement)
})

const load = async () => {
    try {
        isLoading.value = true
        error.value = null
        const identity = await getNebulaIdentity()
        nebulaId.value = identity.nebulaId
    } catch (err) {
        console.error('Failed to load Nebula identity:', err)
        error.value = '加载失败'
    } finally {
        isLoading.value = false
    }
}

const reset = async () => {
    if (isLoading.value) return

    try {
        resetNebulaIdentity()
        await debouncedLoad() // 使用防抖版本
    } catch (err) {
        console.error('Failed to reset Nebula identity:', err)
        error.value = '重置失败'
    }
}

// 监听achievement变化
watch(() => props.achievement, () => {
    // achievement变化时不需要重新加载，只是显示变化
})

onMounted(() => {
    load()
})
</script>

<template>
    <div class="nebula-badge">
        <span class="nebula-id" :class="{
            'loading': isLoading,
            'error': error
        }">
            {{ displayId }}
        </span>
        <button v-if="props.showReset && !isLoading" @click="reset" class="reset-btn" :disabled="isLoading">
            刷新
        </button>
    </div>
</template>

<style scoped>
.nebula-badge {
    @apply flex items-center gap-2;
}

.nebula-id {
    @apply text-2xl transition-opacity duration-200;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.nebula-id.loading {
    @apply opacity-60;
}

.nebula-id.error {
    @apply text-red-500;
}

.reset-btn {
    @apply text-xs text-blue-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed;
    font-family: monospace;
    transition: all 0.2s ease;
}

.reset-btn:hover:not(:disabled) {
    @apply text-blue-600;
}
</style>