<script setup lang="ts">
interface SeoProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  keywords?: string[]
}

const props = withDefaults(defineProps<SeoProps>(), {
  title: '',
  description: '',
  image: '',
  url: '',
  type: 'website',
  keywords: () => []
})

const { siteConfig } = await import('~/utils/site-config')
const route = useRoute()

const fullTitle = computed(() =>
  props.title ? `${props.title} | ${siteConfig.title}` : siteConfig.title
)

const fullDescription = computed(() =>
  props.description || siteConfig.description
)

const fullUrl = computed(() =>
  props.url || `${siteConfig.url}${route.path}`
)

const fullImage = computed(() => {
  if (props.image) return `${siteConfig.url}${props.image}`
  return `${siteConfig.url}${siteConfig.images.og}`
})

const twitterImage = computed(() => {
  return `${siteConfig.url}${siteConfig.images.twitter}`
})

const allKeywords = computed(() =>
  [...siteConfig.keywords, ...props.keywords].join(', ')
)

useHead({
  title: fullTitle.value,
  meta: [
    // Basic Meta Tags
    { name: 'description', content: fullDescription.value },
    { name: 'keywords', content: allKeywords.value },
    { name: 'author', content: siteConfig.author },
    { name: 'robots', content: 'index, follow' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },

    // Open Graph
    { property: 'og:title', content: fullTitle.value },
    { property: 'og:description', content: fullDescription.value },
    { property: 'og:type', content: props.type },
    { property: 'og:url', content: fullUrl.value },
    { property: 'og:image', content: fullImage.value },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:site_name', content: 'Vootaa' },
    { property: 'og:locale', content: 'en_US' },

    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: siteConfig.social.twitterHandle },
    { name: 'twitter:creator', content: siteConfig.social.twitterHandle },
    { name: 'twitter:title', content: fullTitle.value },
    { name: 'twitter:description', content: fullDescription.value },
    { name: 'twitter:image', content: twitterImage.value },

    // Additional SEO
    { name: 'theme-color', content: '#000000' },
    { name: 'msapplication-TileColor', content: '#000000' },
  ],
  link: [
    { rel: 'canonical', href: fullUrl.value },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/png', href: siteConfig.images.icon },
    { rel: 'apple-touch-icon', href: siteConfig.images.icon },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.title,
        description: siteConfig.description,
        url: siteConfig.url,
        image: fullImage.value,
        author: {
          '@type': 'Organization',
          name: siteConfig.author,
          url: siteConfig.url,
          sameAs: [
            siteConfig.social.github,
            siteConfig.social.twitter
          ]
        }
      })
    }
  ]
})
</script>

<template>
  <div></div>
</template>