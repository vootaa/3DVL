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
  <div class="showcase-container">
    <div class="projects-grid">
      <div v-for="project in projects" :key="project.id" class="project-card">
        <div class="card-image">
          <img :src="project.heroImage" :alt="`${project.name} preview`" />
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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}

.card-image img {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.card-content {
  padding: 1.5rem;
  font-family: 'Kode Mono', monospace;
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
  height: 70px; /* Fixed height for description */
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
</style>