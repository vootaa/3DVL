<script setup>
import AurorasCity from '~/components/projects/auroras-city/index.vue';
import { projects } from '~/utils/projects';

const project = projects.find(p => p.id === 'auroras-city');

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
  <AurorasCity />
</template>
