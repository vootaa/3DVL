<script setup lang="ts">
definePageMeta({
  layout: 'experiment',
})
const { path } = useRoute()
const { data } = await useAsyncData(`content-${path}`, () => queryContent().where({ _path: path }).findOne())

useHead({
  title: `${data?.value?.title} - 3DVL`,
  meta: [
    {
      key: 'description',
      name: 'description',
      content: data?.value?.description,
    },
    {
      key: 'keywords',
      property: 'keywords',
      content: data?.value?.tags?.join(', '),
    },
    // og
    {
      key: 'og:description',
      property: 'og:description',
      content: data?.value?.description,
    },
    {
      key: 'og:title',
      property: 'og:title',
      content: `${data?.value?.title} made with TresJS by @${data?.value?.author}`,
    },
    {
      key: 'og:type',
      property: 'og:type',
      content: 'project',
    },
    {
      key: 'og:image',
      property: 'og:image',
      content: data?.value?.thumbnail ?? `/${data?.value?._path?.split('/').pop()}.png`,
    },
    {
      key: 'og:image:alt',
      property: 'og:image:alt',
      content: data?.value?.title,
    },
    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@alvarosabu' },
    {
      key: 'twitter:title',
      property: 'twitter:title',
      content: `${data?.value?.title} - Tres`,
    },
    {
      key: 'twitter:description',
      name: 'twitter:description',
      content: data?.value?.description,
    },
    {
      key: 'twitter:image',
      name: 'twitter:image',
      content: data?.value?.thumbnail ?? `/${data?.value?._path?.split('/').pop()}.png`,
    },
    {
      key: 'twitter:image:alt',
      name: 'twitter:image:alt',
      content: data?.value?.title,
    },
  ],
})
</script>

<template>
  <main>
    <ClientOnly>
      <ContentRenderer v-if="data" :value="data" class="w-full h-100vh relative" />
    </ClientOnly>
  </main>
</template>
