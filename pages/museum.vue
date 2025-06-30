<script setup>
import Museum from '~/components/projects/museum/index.vue';
import { projects } from '~/utils/projects';

const project = projects.find(p => p.id === 'museum');

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
  <Museum />
</template>
