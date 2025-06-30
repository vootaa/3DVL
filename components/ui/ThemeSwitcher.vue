<script setup lang="ts">
import { ref } from 'vue';
import { useTheme } from '~/composables/useTheme';

const { setTheme, availableSchemes, currentScheme } = useTheme();
const showPanel = ref(false);
</script>

<template>
  <div class="relative">
    <button @click="showPanel = !showPanel" class="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9h4m5 0h9m-9 12h9m-9-6h4m-4-6v18m5-18v18m9-18v18"/></svg>
    </button>
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="showPanel" class="absolute top-full right-0 mt-2 w-48 origin-top-right bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-lg">
        <ul class="p-2">
          <li v-for="scheme in availableSchemes" :key="scheme.name">
            <button @click="setTheme(scheme.name); showPanel = false;" class="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-md">
              {{ scheme.name }}
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
