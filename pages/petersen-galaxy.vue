<script setup>
import PetersenGalaxy from '~/components/projects/petersen-galaxy/index.vue';
import { projects } from '~/utils/projects';

const project = projects.find(p => p.id === 'petersen-galaxy');

definePageMeta({
  layout: 'experiment'
});

useHead({
  title: project?.title || 'Petersen Galaxy - 3DVL',
  meta: [
    { name: 'description', content: project?.metaDescription || 'An evolutionary galaxy simulation showing the transition from chaos to orbital structure.' },
  ],
});
</script>

<template>
  <PetersenGalaxy />
</template>
