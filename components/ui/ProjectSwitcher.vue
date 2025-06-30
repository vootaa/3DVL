<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { projects } from '~/utils/projects';

const route = useRoute();
const showPanel = ref(false);

const currentProject = computed(() => {
  return projects.find(p => p.path === route.path) || null;
});

const projectsToList = computed(() => {
  // If on a project page, show other projects. Otherwise (on homepage), show all.
  return currentProject.value
    ? projects.filter(p => p.path !== route.path)
    : projects;
});
</script>

<template>
  <div class="relative kode-mono-font">
    <button
      @click="showPanel = !showPanel"
      class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-800/50 backdrop-blur-sm rounded-md hover:bg-gray-700/70 transition-colors border border-gray-700 hover:border-gray-600"
    >
      <i class="i-carbon-grid w-4 h-4" />
      <span>{{ currentProject ? currentProject.name : 'Switch Project' }}</span>
    </button>
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="showPanel" class="absolute bottom-full right-0 mb-2 w-40 origin-bottom-right bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-lg">
        <ul class="p-1">
          <li v-for="project in projectsToList" :key="project.id">
            <NuxtLink :to="project.path" @click="showPanel = false" class="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-md">
              {{ project.name }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.kode-mono-font {
  font-family: 'Kode Mono', monospace;
}
</style>
