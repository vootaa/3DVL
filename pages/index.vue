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

// Screen size detection
const isMobile = ref(false);

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
    <!-- Main Hero Section with Typewriter Effect - Only on Desktop -->
    <div v-if="!isMobile" class="hero-section">
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

      <!-- Mobile: Vertical Stack -->
      <div v-else class="projects-stack">
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

    <!-- Team Info Section - Only on Desktop -->
    <div v-if="!isMobile" class="team-section">
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

/* Mobile Stack Layout */
.projects-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 400px;
  align-items: center;
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

/* Team Section */
.team-section {
  flex: 0 0 auto;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.team-name {
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.team-vision {
  font-size: 0.8rem;
  color: var(--text);
  opacity: 0.8;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 1280px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
    max-width: 800px;
  }
}

@media (max-width: 1024px) {
  .showcase-container {
    padding-top: 2rem;
  }
  
  .projects-section {
    margin-bottom: 2rem;
  }
}

@media (max-width: 768px) {
  .showcase-container {
    padding: 0 1rem;
    padding-top: 2rem;
  }
  
  .project-card {
    width: 100%;
    max-width: 350px;
    height: 380px;
  }
  
  .card-image-container {
    height: 160px;
  }
}

@media (max-width: 480px) {
  .project-card {
    height: 360px;
  }
  
  .card-image-container {
    height: 140px;
  }
  
  .card-content {
    padding: 1rem;
  }
}
</style>