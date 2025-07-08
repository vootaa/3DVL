<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { projects } from '~/utils/projects';
import { siteConfig } from '~/utils/site-config';

definePageMeta({
  layout: 'default',
});

const heroTitles = siteConfig.hero.titles;

// Typewriter effect logic
const currentHeroIndex = ref(0);
const displayedText = ref('');
const isTyping = ref(true);
let typewriterTimeout: NodeJS.Timeout;

const typeWriter = (text: string, index: number = 0) => {
  if (index < text.length) {
    displayedText.value = text.substring(0, index + 1);
    typewriterTimeout = setTimeout(() => typeWriter(text, index + 1), 80);
  } else {
    isTyping.value = false;
    typewriterTimeout = setTimeout(() => {
      nextHero();
    }, 3000);
  }
};

const nextHero = () => {
  displayedText.value = '';
  currentHeroIndex.value = (currentHeroIndex.value + 1) % heroTitles.length;
  isTyping.value = true;
  typewriterTimeout = setTimeout(() => {
    typeWriter(heroTitles[currentHeroIndex.value]);
  }, 500);
};

// Project carousel logic - mobile view
const currentProjectIndex = ref(0);
const isMobile = ref(false);

const nextProject = () => {
  if (currentProjectIndex.value < projects.length - 1) {
    currentProjectIndex.value++;
  } else {
    currentProjectIndex.value = 0; // first project
  }
};

const prevProject = () => {
  if (currentProjectIndex.value > 0) {
    currentProjectIndex.value--;
  } else {
    currentProjectIndex.value = projects.length - 1; // last project
  }
};

const goToProject = (index: number) => {
  currentProjectIndex.value = index;
};

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 1024; // lg breakpoint
};

onMounted(() => {
  typeWriter(heroTitles[0]);
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  if (typewriterTimeout) {
    clearTimeout(typewriterTimeout);
  }
  window.removeEventListener('resize', checkScreenSize);
});
</script>

<template>
  <!-- SEO Head Component -->
  <SeoHead />

  <div class="showcase-container">
    <!-- Main Hero Section with Typewriter Effect -->
    <div class="hero-section">
      <div class="typewriter-container">
        <h1 class="hero-title">
          {{ displayedText }}
          <span v-if="isTyping" class="cursor">|</span>
        </h1>
      </div>
    </div>

    <!-- Projects Section -->
    <div class="projects-section">
      <!-- Desktop: Fixed 3 columns -->
      <div v-if="!isMobile" class="projects-grid">
        <div v-for="project in projects" :key="project.id" class="project-card">
          <div class="card-image-container">
            <img :src="project.heroImage" :alt="`${project.name} preview`" class="card-image" loading="lazy" />
          </div>
          <div class="card-content">
            <h3 class="card-title">{{ project.name }}</h3>
            <p class="card-description">{{ project.description }}</p>
            <div class="card-footer">
              <NuxtLink :to="project.path" class="card-button">
                <span>Launch</span>
                <i class="i-carbon-launch w-4 h-4" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile: loop  -->
      <div v-else class="projects-carousel">
        <button @click="prevProject" class="carousel-button carousel-button-left">
          <i class="i-carbon-chevron-left w-6 h-6" />
        </button>

        <div class="carousel-container">
          <div class="carousel-track" :style="{ transform: `translateX(-${currentProjectIndex * 100}%)` }">
            <div v-for="project in projects" :key="project.id" class="project-card">
              <div class="card-image-container">
                <img :src="project.heroImage" :alt="`${project.name} preview`" class="card-image" loading="lazy" />
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ project.name }}</h3>
                <p class="card-description">{{ project.description }}</p>
                <div class="card-footer">
                  <NuxtLink :to="project.path" class="card-button">
                    <span>Launch</span>
                    <i class="i-carbon-launch w-4 h-4" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button @click="nextProject" class="carousel-button carousel-button-right">
          <i class="i-carbon-chevron-right w-6 h-6" />
        </button>

        <!-- Carousel indicators -->
        <div class="carousel-indicators">
          <button v-for="(project, index) in projects" :key="index" @click="goToProject(index)"
            :class="['indicator', { active: index === currentProjectIndex }]" />
        </div>
      </div>
    </div>

    <!-- Team Info Section -->
    <div class="team-section">
      <h2 class="team-name">{{ siteConfig.team.name }}</h2>
      <p class="team-vision">{{ siteConfig.team.vision }}</p>
    </div>
  </div>
</template>

<style scoped>
.showcase-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 2rem;
  padding-top: 6rem; /* Space for top logo */
}

/* Hero Section */
.hero-section {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 25vh;
  margin-bottom: 4rem;
}

.typewriter-container {
  text-align: center;
  max-width: 900px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, var(--accent), var(--text));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.cursor {
  animation: blink 1s infinite;
  color: var(--accent);
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Projects Section */
.projects-section {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 4rem;
}

/* Desktop Grid Layout */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1200px;
  width: 100%;
}

/* Mobile Carousel Layout */
.projects-carousel {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.carousel-container {
  overflow: hidden;
  border-radius: 1rem;
  margin: 0 3rem;
}

.carousel-track {
  display: flex;
  transition: transform 0.5s ease;
  width: calc(100% * 3); /* 假设有3个项目 */
}

.carousel-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--bg);
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.carousel-button-left {
  left: 0;
}

.carousel-button-right {
  right: 0;
}

.carousel-button:hover {
  background-color: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background-color: var(--border);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.indicator.active {
  background-color: var(--accent);
}

/* Project Cards */
.project-card {
  background-color: var(--bg);
  border: 1px solid var(--border);
  border-radius: 1rem;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  width: 350px; /* fixed width */
  height: 400px; /* fixed height */
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.card-image-container {
  width: 100%;
  height: 180px;
  overflow: hidden;
  flex-shrink: 0;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.card-description {
  font-size: 0.9rem;
  color: var(--text);
  opacity: 0.8;
  margin-bottom: 1.5rem;
  flex-grow: 1;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}

.card-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--accent);
  color: var(--bg);
  text-decoration: none;
  font-weight: bold;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.card-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* team Section */
.team-section {
  flex: 0 0 auto;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.team-name {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.team-vision {
  font-size: 1rem;
  color: var(--text);
  opacity: 0.8;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.team-description {
  font-size: 0.875rem;
  color: var(--text);
  opacity: 0.6;
  line-height: 1.5;
}

/* Responsive Design */
@media (max-width: 1280px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
    max-width: 800px;
  }
}

@media (max-width: 768px) {
  .showcase-container {
    padding: 0 1rem;
    padding-top: 5rem;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-section {
    margin-bottom: 3rem;
  }
  
  .project-card {
    width: 300px;
    height: 350px;
  }
  
  .card-image-container {
    height: 150px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.8rem;
  }
  
  .project-card {
    width: 280px;
    height: 320px;
  }
  
  .carousel-container {
    margin: 0 2.5rem;
  }
}
</style>