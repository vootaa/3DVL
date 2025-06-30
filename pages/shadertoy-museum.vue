<script setup>
import ShadertoyMuseum from '~/components/projects/shadertoy-museum/index.vue';

definePageMeta({
  layout: 'experiment'
});

useHead({
  title: 'Shadertoy Museum - 3DVL',
  meta: [
    { name: 'description', content: 'A curated collection of interactive and mesmerizing GLSL shader art.' },
  ],
});
</script>

<template>
  <ShadertoyMuseum />
</template>
