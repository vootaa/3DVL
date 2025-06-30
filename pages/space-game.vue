<script setup>
import SpaceGame from '~/components/projects/space-game/index.vue';

definePageMeta({
  layout: 'experiment'
});

useHead({
  title: 'Space Game - 3DVL',
  meta: [
    { name: 'description', content: 'A minimalist prototype for a 3D space exploration and combat game.' },
  ],
});
</script>

<template>
  <SpaceGame />
</template>
