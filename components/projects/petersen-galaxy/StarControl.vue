<script setup lang="ts">
import { ref, watch } from 'vue'

// Star cluster control state
const showStars = ref(true)
const starClusterRef = ref()

// Star configuration by orbits
const orbitConfig = {
  inner: { 
    count: 5, 
    color: '#FFD700', 
    name: 'Inner Orbit',
    stars: Array.from({ length: 5 }, (_, i) => ({ id: i + 5, active: false }))
  },
  middle: { 
    count: 5, 
    color: '#87CEEB', 
    name: 'Middle Orbit',
    stars: Array.from({ length: 5 }, (_, i) => ({ id: i, active: false }))
  },
  outer: { 
    count: 10, 
    color: '#FF4500', 
    name: 'Outer Orbit',
    stars: Array.from({ length: 10 }, (_, i) => ({ id: i + 10, active: false }))
  }
}

// Toggle star cluster display
const toggleStars = () => {
  showStars.value = !showStars.value
  // Reset stars position when toggling to avoid re-evolution
  if (showStars.value && starClusterRef.value?.resetStarsPosition) {
    starClusterRef.value.resetStarsPosition()
  }
}

// Handle star button click (for future interaction)
const handleStarClick = (orbitKey: string, starIndex: number) => {
  const orbit = orbitConfig[orbitKey as keyof typeof orbitConfig]
  orbit.stars[starIndex].active = !orbit.stars[starIndex].active
  // Future: Add star-specific effects or interactions
  console.log(`Star ${orbit.stars[starIndex].id} in ${orbit.name} ${orbit.stars[starIndex].active ? 'activated' : 'deactivated'}`)
}

// Expose state to parent component
defineExpose({
  showStars,
  starClusterRef
})
</script>

<template>
  <div class="star-control-container">
    <!-- Main control panel -->
    <div class="star-control" @click="toggleStars">
      <div class="control-label">STAR CLUSTER</div>
      <div class="control-value">{{ showStars ? 'ON' : 'OFF' }}</div>
    </div>
    
    <!-- Orbital star buttons panel - shows when stars are ON -->
    <div v-show="showStars" class="orbital-panel">
      <h3>ORBITAL STARS</h3>
      
      <!-- Inner Orbit -->
      <div class="orbit-section">
        <div class="orbit-label" :style="{ color: orbitConfig.inner.color }">
          INNER
        </div>
        <div class="star-buttons">
          <button 
            v-for="(star, index) in orbitConfig.inner.stars" 
            :key="`inner-${index}`"
            class="star-button inner"
            :class="{ active: star.active }"
            :style="{ 
              borderColor: orbitConfig.inner.color,
              backgroundColor: star.active ? orbitConfig.inner.color : 'transparent'
            }"
            :title="`Inner Star ${star.id + 1}`"
            @click="handleStarClick('inner', index)"
          >
            <span class="star-number">{{ index + 1 }}</span>
          </button>
        </div>
      </div>
      
      <!-- Middle Orbit -->
      <div class="orbit-section">
        <div class="orbit-label" :style="{ color: orbitConfig.middle.color }">
          MIDDLE
        </div>
        <div class="star-buttons">
          <button 
            v-for="(star, index) in orbitConfig.middle.stars" 
            :key="`middle-${index}`"
            class="star-button middle"
            :class="{ active: star.active }"
            :style="{ 
              borderColor: orbitConfig.middle.color,
              backgroundColor: star.active ? orbitConfig.middle.color : 'transparent'
            }"
            :title="`Middle Star ${star.id + 1}`"
            @click="handleStarClick('middle', index)"
          >
            <span class="star-number">{{ index + 1 }}</span>
          </button>
        </div>
      </div>
      
      <!-- Outer Orbit - Split into two rows -->
      <div class="orbit-section">
        <div class="orbit-label" :style="{ color: orbitConfig.outer.color }">
          OUTER
        </div>
        <div class="star-buttons">
          <button 
            v-for="(star, index) in orbitConfig.outer.stars" 
            :key="`outer-${index}`"
            class="star-button outer"
            :class="{ active: star.active }"
            :style="{ 
              borderColor: orbitConfig.outer.color,
              backgroundColor: star.active ? orbitConfig.outer.color : 'transparent'
            }"
            :title="`Outer Star ${star.id + 1}`"
            @click="handleStarClick('outer', index)"
          >
            <span class="star-number">{{ index + 1 }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.star-control-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

/* Main star control panel (mirroring GridControl) */
.star-control {
  background: rgba(0, 12, 20, 0.85);
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  padding: 10px 15px;
  color: #FFD700;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-weight: 500;
  font-variant-numeric: slashed-zero tabular-nums;
  text-transform: uppercase;
  line-height: 1em;
  transform: skew(0.5deg, -1.5deg) rotate(-1deg); /* Mirror of GridControl transform */
  transform-origin: center center;
  pointer-events: all;
  cursor: pointer;
  width: 160px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  transition: all 0.2s ease;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
  /* Helmet concave/convex effect - opposite direction from GridControl */
  background-image: 
    linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%),
    radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.05) 0%, transparent 70%);
}

.star-control:hover {
  background: rgba(20, 12, 0, 0.9);
  border-color: rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.4);
  transform: skew(0.5deg, -1.5deg) rotate(-1deg) scale(1.02);
  /* Enhanced helmet effect on hover */
  background-image: 
    linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, transparent 50%, rgba(0, 0, 0, 0.3) 100%),
    radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.08) 0%, transparent 70%);
}

.control-label {
  font-size: 0.9em;
  opacity: 0.8;
}

.control-value {
  font-size: 1.6em;
  line-height: 1em;
  margin: 2px 0;
  text-align: right;
}

/* Orbital stars panel */
.orbital-panel {
  background: rgba(0, 8, 17, 0.95);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
  color: #ffffff;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  width: 200px; /* Fixed width for 5 circles */
  margin-top: 20px; /* Add distance from main button */
  animation: fadeInDown 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transform: skew(0.25deg, -0.75deg) rotate(-0.5deg); /* Subtle helmet angle */
}

.orbital-panel h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #FFD700;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 8px;
  text-transform: uppercase;
  font-weight: 600;
  text-align: center;
}

.orbit-section {
  margin-bottom: 12px;
}

.orbit-section:last-child {
  margin-bottom: 0;
}

.orbit-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 6px;
  opacity: 0.9;
  letter-spacing: 0.5px;
  text-align: center;
}

.star-buttons {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* Exactly 5 columns */
  gap: 6px;
  justify-items: center;
}

.star-button {
  width: 24px;
  height: 24px;
  border: 2px solid;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.star-button:hover {
  transform: scale(1.1);
  box-shadow: 0 0 8px currentColor;
}

.star-button.active {
  box-shadow: 0 0 12px currentColor;
  transform: scale(1.05);
}

.star-number {
  font-size: 9px;
  font-weight: bold;
  color: currentColor;
  line-height: 1;
  opacity: 0.8;
}

.star-button:hover .star-number {
  opacity: 1;
}

.star-button.active .star-number {
  color: rgba(0, 0, 0, 0.8); /* Dark text on active background */
  opacity: 1;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px) skew(0.25deg, -0.75deg) rotate(-0.5deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) skew(0.25deg, -0.75deg) rotate(-0.5deg);
  }
}

@media only screen and (max-width: 900px) {
  .star-control {
    padding: 8px 12px;
    width: 140px;
    min-height: 50px;
    transform: skew(0.25deg, -1deg) rotate(-0.75deg); /* Mirror responsive transform */
  }

  .control-value {
    font-size: 1.4em;
  }
  
  .orbital-panel {
    width: 180px; /* Smaller width on mobile */
    padding: 12px;
    margin-top: 15px;
  }
  
  .star-button {
    width: 20px;
    height: 20px;
  }
  
  .star-number {
    font-size: 8px;
  }
}
</style>
