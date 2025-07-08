<script setup>
import AurorasCity from '~/components/projects/auroras-city/index.vue';
import { projects } from '~/utils/projects';

const project = projects.find(p => p.id === 'auroras-city');

definePageMeta({
  layout: 'experiment'
});

</script>

<template>
  <SeoHead :title="project?.title || 'Auroras City'"
    :description="project?.metaDescription || 'Immersive 3D city visualization with aurora effects.'"
    :keywords="['3D city', 'aurora effects', 'immersive visualization']" />

  <AurorasCity />
</template>
