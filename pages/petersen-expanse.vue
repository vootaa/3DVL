<script setup>
import PetersenExpanse from '~/components/projects/petersen-expanse/index.vue';
import { projects } from '~/utils/projects';

const project = projects.find(p => p.id === 'petersen-expanse');

definePageMeta({
  layout: 'experiment'
});
</script>

<template>
  <SeoHead :title="project?.title || 'Petersen Expanse'"
    :description="project?.metaDescription || 'Explore the Petersen Expanse, a 3D visualization of the Petersen Graph and Kadena ChainWeb.'"
    :keywords="['galaxy']" />

  <PetersenExpanse />
</template>