<script setup>
import EchoMission from '~/components/projects/echo-mission/index.vue';
import { projects } from '~/utils/projects';

const project = projects.find(p => p.id === 'echo-mission');

definePageMeta({
  layout: 'experiment'
});

useHead({
  title: project?.title || 'Echo Mission - VOOTAA: Vibrations Of Origins, Tethers And Auroras',
  meta: [
    { name: 'description', content: project?.metaDescription || 'A space exploration game where you pilot a spacecraft through a procedurally generated universe, collecting resources and avoiding dangers.' },
  ],
});
</script>

<template>
  <EchoMission />
</template>
