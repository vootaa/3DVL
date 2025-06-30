<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { projects } from '~/utils/projects';

const route = useRoute();
const showPanel = ref(false);

const currentProject = computed(() => {
  return projects.find(p => p.path === route.path) || null;
});

const otherProjects = computed(() => {
  return projects.filter(p => p.path !== route.path);
});
</script>

<template>
  <div class="relative">
    <button
      v-if="currentProject"
      @click="showPanel = !showPanel"
      class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-800/50 backdrop-blur-sm rounded-md hover:bg-gray-700/70 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24">
        <path fill="currentColor" d="M16 20h4v-4h-4m-6 0h4v-4h-4m-6 0h4v-4H4m12-6h4V4h-4m-6 0h4V4h-4m-6 0h4V4H4v4Z" />
      </svg>
      <span>{{ currentProject.name }}</span>
    </button>
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="showPanel" class="absolute bottom-full right-0 mb-2 w-64 origin-bottom-right bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-lg">
        <ul class="p-2">
          <li v-for="project in otherProjects" :key="project.id">
            <NuxtLink :to="project.path" @click="showPanel = false" class="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-md">
              {{ project.name }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
