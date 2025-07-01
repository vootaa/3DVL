<script setup lang="ts">
import { projects } from '~/utils/projects';
import { siteConfig } from '~/utils/site-config';

definePageMeta({
  layout: 'default',
});

useHead({
  title: siteConfig.title,
  meta: [
    { name: 'description', content: siteConfig.description },
  ],
});
</script>

<template>
  <div class="showcase-container flex flex-col items-center w-full">
    <!-- Title and Subtitle at the top -->
    <div class="flex flex-col items-center mt-20 mb-8">
      <h1 class="text-4xl font-bold mb-1">{{ siteConfig.hero.title }}</h1>
      <h2 class="text-lg subtitle mt-0">{{ siteConfig.hero.subtitle }}</h2>
    </div>
    <div class="projects-grid">
      <div v-for="project in projects" :key="project.id" class="project-card">
        <div class="card-image-container">
          <img 
            :src="project.heroImage" 
            :alt="`${project.name} preview`" 
            class="card-image"
            loading="lazy"
          />
        </div>
        <div class="card-content">
          <h2 class="card-title">{{ project.name }}</h2>
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
</template>

<style scoped>
.showcase-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.projects-grid {
  display: flex;
  gap: 2rem;
  justify-content: center;
  padding: 2rem;
}

.project-card {
  width: 450px;
  flex-shrink: 0;
  border-radius: 1rem;
  overflow: hidden;
  background-color: var(--bg);
  border: 1px solid var(--border);
  transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}

.project-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.dark .project-card:hover {
  box-shadow: 0 20px 25px -5px rgba(255, 255, 255, 0.1), 0 10px 10px -5px rgba(255, 255, 255, 0.04);
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.card-description {
  font-size: 1rem;
  color: var(--text);
  opacity: 0.8;
  margin-bottom: 1.5rem;
  height: 70px;
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

.subtitle {
  color: var(--text);
  opacity: 0.6;
  font-size: 1rem;
}

.card-image-container {
  width: 100%;
  height: 250px;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>