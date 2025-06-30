<script setup>
import Galaxy from '~/components/projects/galaxy/index.vue';
import { projects } from '~/utils/projects';

const project = projects.find(p => p.id === 'galaxy');

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
  <Galaxy />
</template>
