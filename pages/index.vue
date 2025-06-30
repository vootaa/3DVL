<script setup lang="ts">
import { projects } from '~/utils/projects';

definePageMeta({
    layout: 'default',
});

useHead({
  title: '3DVL - A 3D Visualization Lab',
  meta: [
    { name: 'description', content: 'An experimental platform for 3D web projects and interactive art.' },
  ],
});

</script>

<template>
  <div class="project-showcase">
    <section v-for="(project, index) in projects" :key="project.id" class="project-hero">
      <div class="hero-background">
        <img :src="project.heroImage" :alt="`${project.name} background`" />
      </div>
      <div class="hero-content">
        <h2 class="project-title">{{ project.name }}</h2>
        <p class="project-description">{{ project.description }}</p>
        <NuxtLink :to="project.path" class="visit-button">
          Launch Experiment
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.project-showcase {
  display: flex;
  flex-direction: column;
}

.project-hero {
  position: relative;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  color: var(--color-secondary);
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.hero-background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.6);
}

.hero-content {
  padding: 2rem;
  background-color: var(--color-hero-bg);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  max-width: 600px;
}

.project-title {
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.project-description {
  font-size: 1.125rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.visit-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-accent);
  color: var(--color-background);
  text-decoration: none;
  font-weight: bold;
  border-radius: 0.5rem;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.visit-button:hover {
  transform: scale(1.05);
  background-color: var(--color-primary);
}
</style>
