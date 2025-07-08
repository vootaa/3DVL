<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { projects } from '~/utils/projects';
import { siteConfig } from '~/utils/site-config';

definePageMeta({
  layout: 'default',
});

const heroTitles = siteConfig.hero.main.titles;

// Typewriter effect logic
const currentHeroIndex = ref(0);
const displayedText = ref('');
const isTyping = ref(true);
let typewriterTimeout: NodeJS.Timeout;

const typeWriter = (text: string, index: number = 0) => {
  if (index < text.length) {
    displayedText.value = text.substring(0, index + 1);
    typewriterTimeout = setTimeout(() => typeWriter(text, index + 1), 100);
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

// Project carousel logic
const currentProjectIndex = ref(0);
const projectsContainer = ref<HTMLElement>();

const nextProject = () => {
  if (currentProjectIndex.value < projects.length - 1) {
    currentProjectIndex.value++;
  }
};

const prevProject = () => {
  if (currentProjectIndex.value > 0) {
    currentProjectIndex.value--;
  }
};

const goToProject = (index: number) => {
  currentProjectIndex.value = index;
};

onMounted(() => {
  typeWriter(heroTitles[0]);
});

onUnmounted(() => {
  if (typewriterTimeout) {
    clearTimeout(typewriterTimeout);
  }
});
</script>

<template>
  <!-- SEO Head Component -->
  <SeoHead />

  <div class="showcase-container flex flex-col items-center w-full">
    <!-- Main Hero Section -->
    <div class="main-hero flex flex-col items-center mt-8 mb-12">
      <h1 class="main-title text-5xl font-bold mb-8">{{ siteConfig.hero.main.title }}</h1>
    </div>

    <!-- Projects Carousel -->
    <div class="projects-section mb-12">
      <div class="projects-carousel">
        <button @click="prevProject" :disabled="currentProjectIndex === 0" class="carousel-button carousel-button-left">
          <i class="i-carbon-chevron-left w-6 h-6" />
        </button>

        <div class="projects-container" ref="projectsContainer">
          <div class="projects-track" :style="{ transform: `translateX(-${currentProjectIndex * 100}%)` }">
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

        <button @click="nextProject" :disabled="currentProjectIndex === projects.length - 1"
          class="carousel-button carousel-button-right">
          <i class="i-carbon-chevron-right w-6 h-6" />
        </button>
      </div>

      <!-- Carousel indicators -->
      <div class="carousel-indicators">
        <button v-for="(project, index) in projects" :key="index" @click="goToProject(index)"
          :class="['indicator', { active: index === currentProjectIndex }]" />
      </div>
    </div>

    <!-- Secondary Hero Section with Typewriter Effect -->
    <div class="secondary-hero flex flex-col items-center mt-8 mb-8">
      <div class="typewriter-container">
        <h2 class="secondary-title text-2xl font-semibold mb-2">
          {{ displayedText }}
          <span v-if="isTyping" class="cursor">|</span>
        </h2>
      </div>
      <p class="secondary-subtitle text-sm opacity-70">{{ siteConfig.hero.secondary.subtitle }}</p>
    </div>
  </div>
</template>

<style scoped>
.showcase-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  overflow-y: auto;
  position: relative;
  padding: 2rem 0;
}

.main-hero {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.main-title {
  background: linear-gradient(135deg, var(--accent), var(--text));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Projects Carousel Styles */
.projects-section {
  width: 100%;
  max-width: 1200px;
  padding: 0 2rem;
}

.projects-carousel {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.carousel-button {
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
  flex-shrink: 0;
  z-index: 10;
}

.carousel-button:hover:not(:disabled) {
  background-color: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
}

.carousel-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.projects-container {
  flex: 1;
  overflow: hidden;
  border-radius: 1rem;
}

.projects-track {
  display: flex;
  transition: transform 0.5s ease;
  width: calc(100% * var(--project-count, 3));
}

.project-card {
  width: 100%;
  flex-shrink: 0;
  border-radius: 1rem;
  overflow: hidden;
  background-color: var(--bg);
  border: 1px solid var(--border);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin: 0 0.5rem;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 5px 10px -5px rgba(0, 0, 0, 0.04);
}

.dark .project-card:hover {
  box-shadow: 0 10px 25px -5px rgba(255, 255, 255, 0.1), 0 5px 10px -5px rgba(255, 255, 255, 0.04);
}

.card-image-container {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
  height: 60px;
  flex-grow: 1;
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
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* Carousel Indicators */
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

/* Secondary Hero Styles */
.secondary-hero {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.typewriter-container {
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.secondary-title {
  color: var(--text);
  font-weight: 600;
}

.cursor {
  animation: blink 1s infinite;
}

@keyframes blink {

  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0;
  }
}

.secondary-subtitle {
  color: var(--text);
  opacity: 0.6;
  font-size: 0.875rem;
  text-align: center;
}

/* Responsive design */
@media (max-width: 768px) {
  .main-title {
    font-size: 3rem;
  }

  .carousel-button {
    width: 40px;
    height: 40px;
  }

  .projects-section {
    padding: 0 1rem;
  }

  .card-image-container {
    height: 150px;
  }

  .secondary-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .projects-carousel {
    flex-direction: column;
    gap: 0.5rem;
  }

  .carousel-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 20;
  }

  .carousel-button-left {
    left: 0.5rem;
  }

  .carousel-button-right {
    right: 0.5rem;
  }
}
</style>