<script setup>
import SpaceGame from '~/components/projects/space-game/index.vue';
import { projects } from '~/utils/projects';

const project = projects.find(p => p.id === 'space-game');

definePageMeta({
  layout: 'experiment'
});

useHead({
  title: project?.title,
  meta: [
    { name: 'description', content: project?.metaDescription },
  ],
});
</script>

<template>
  <SpaceGame />
</template>
