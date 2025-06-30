<script setup>
const colorMode = useColorMode();

const toggleMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};
</script>

<template>
  <button @click="toggleMode" class="p-2 rounded-full bg-gray-200 dark:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
    <svg v-if="colorMode.value === 'dark'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-yellow-300" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1m0 14a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1m8.243-10.243a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0M5.172 17.414a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0m13.656 0a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 1 1-1.414 1.414l-1.414-1.414a1 1 0 0 1 0-1.414M6.586 5.172a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 1 1-1.414 1.414L6.586 6.586a1 1 0 0 1 0-1.414M4 11a1 1 0 1 1 0 2H2a1 1 0 1 1 0-2zm16 0a1 1 0 1 1 0 2h2a1 1 0 1 1 0-2z"/></svg>
    <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-blue-500" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21q-3.75 0-6.375-2.625T3 12q0-3.75 2.625-6.375T12 3q.35 0 .688.025t.662.075q-1.025.725-1.638 1.888T11.1 9.525q0 1.475.813 2.7t2.137 1.825q.15.05.3.063t.3.012q.15 0 .288-.013t.287-.037q.05-.2.088-.4t.037-.4q0-.2-.025-.387t-.05-.363q-.875-1.9-2.862-3.025T9.5 7.5q0-1.525.788-2.837T12.25 3.1q.2-.05.4-.063t.4-.012q.15 0 .288.013t.287.037q.05.2.088.4t.037.4q0 .2-.025.388t-.05.362q-.875 1.9-2.862 3.025T8.5 9.5q0 1.525.788 2.838T11.25 13.9q.2.05.4.063t.4.012q.15 0 .288-.013t.287-.037q.05-.2.088-.4t.037-.4q0-.2-.025-.387t-.05-.363q.125.025.25.038t.25.012q3.75 0 6.375-2.625T21 12q0 3.75-2.625 6.375T12 21"/></svg>
  </button>
</template>
