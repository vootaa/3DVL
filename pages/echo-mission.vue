<script setup>
import EchoMission from '~/components/projects/echo-mission/index.vue';
import { projects } from '~/utils/projects';

const project = projects.find(p => p.id === 'echo-mission');

definePageMeta({
  layout: 'experiment'
});

</script>

<template>
  <SeoHead :title="project?.title || 'Echo Mission'"
    :description="project?.metaDescription || 'A space exploration game where you pilot a spacecraft through a procedurally generated universe, collecting resources and avoiding dangers.'"
    :keywords="['space exploration', '3D gaming']" />

  <EchoMission />
</template>