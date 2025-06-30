<script setup>
import Museum from '~/components/projects/museum/index.vue';

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
  <Museum />
</template>
