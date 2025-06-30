<script setup>
const colorMode = useColorMode();

const toggleMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};
</script>

<template>
  <button @click="toggleMode"
    class="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
    <i v-if="colorMode.value === 'dark'" class="i-carbon-sun w-6 h-6 text-yellow-300" />
    <i v-else class="i-carbon-moon w-6 h-6 text-blue-500" />
  </button>
</template>
