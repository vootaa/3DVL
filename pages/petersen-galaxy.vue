<script setup>
import PetersenExpanse from '~/components/projects/petersen-expanse/index.vue';
import { projects } from '~/utils/projects';

const project = projects.find(p => p.id === 'petersen-expanse');

definePageMeta({
  layout: 'experiment'
});

useHead({
  title: project?.title || 'Petersen Expanse - VOOTAA: Vibrations Of Origins, Tethers And Auroras',
  meta: [
    { name: 'description', content: project?.metaDescription || 'A Web3D gaming & visualization of the Kadena Chainweb braided structure.' },
  ],
});
</script>

<template>
  <PetersenExpanse />
</template>