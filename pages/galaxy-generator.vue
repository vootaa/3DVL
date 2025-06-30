<script setup>
import GalaxyGenerator from '~/components/projects/galaxy-generator/index.vue';

definePageMeta({
  layout: 'experiment'
});

useHead({
  title: 'Galaxy Generator - 3DVL',
  meta: [
    { name: 'description', content: 'Create stunning, unique galaxies with procedural noise and particle simulation.' },
  ],
});
</script>

<template>
  <GalaxyGenerator />
</template>
