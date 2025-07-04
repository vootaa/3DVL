<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{ progress: number }>()
</script>

<template>
  <div class="trail-review-timeline">
    <div class="timeline-content">
    <span class="timeline-title">Galaxy drift playback in progress...</span>
      <span class="timeline-progress-text">{{ (progress * 100).toFixed(0) }}%</span>
      <div class="timeline-progress">
        <div class="progress-bar" :style="{ width: `${progress * 100}%` }"></div>
      </div>
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
  padding: 10px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 260px;
  box-shadow: 0 8px 32px #00ccff33;
}
.timeline-title {
  color: #66ddff;
  font-size: 13px;
  font-weight: 600;
}
.timeline-progress-text {
  color: #00ccff;
  font-size: 13px;
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
