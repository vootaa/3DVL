<script setup>
import SynthwaveLandscape from '~/components/projects/synthwave-landscape/index.vue';

definePageMeta({
  layout: 'experiment'
});

useHead({
  title: 'Synthwave Landscape - 3DVL',
  meta: [
    { name: 'description', content: 'An infinitely generating retro-futuristic landscape with vaporwave aesthetics.' },
  ],
});
</script>

<template>
  <SynthwaveLandscape />
</template>
