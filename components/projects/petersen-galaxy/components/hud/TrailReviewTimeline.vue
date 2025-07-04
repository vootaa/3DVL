<script setup lang="ts">
const props = defineProps<{ progress: number, mode?: string }>()
</script>

<template>
  <div class="trail-review-timeline">
    <div class="timeline-content">
      <div class="timeline-info">
        <span class="timeline-title" v-if="props.mode === 'available'">Galaxy Drift Replay Mode Available</span>
        <span class="timeline-title" v-else>Galaxy Drift Replay In Progress...</span>
        <span class="timeline-hint" v-if="props.mode === 'available'">
          Please click "Drift Follow" in Camera Presets to watch the replay.
        </span>
      </div>
      <template v-if="props.mode !== 'available'">
        <span class="timeline-progress-text">{{ (props.progress * 100).toFixed(0) }}%</span>
        <div class="timeline-progress">
          <div class="progress-bar" :style="{ width: `${props.progress * 100}%` }"></div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.trail-review-timeline {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  animation: slideDown 0.5s;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px);}
  to { opacity: 1; transform: translateX(-50%) translateY(0);}
}
.timeline-content {
  background: linear-gradient(135deg, #001a2a 90%, #003366 100%);
  border: 1px solid #00ccff;
  border-radius: 10px;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 320px;
  box-shadow: 0 8px 32px #00ccff33;
}
.timeline-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.timeline-title {
  color: #66ddff;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-size: 16px;
  font-weight: 700;
}
.timeline-hint {
  color: #99ccff;
  font-size: 10px;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-weight: 500;
  margin-top: 2px;
}
.timeline-progress-text {
  color: #00ccff;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-size: 16px;
  font-weight: 700;
}
.timeline-progress {
  width: 90px;
  height: 5px;
  background: #003366;
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #00ccff, #66ddff);
  border-radius: 2px;
  transition: width 0.1s;
}
</style>
