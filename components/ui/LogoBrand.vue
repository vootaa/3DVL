<template>
  <div class="logo-brand">
    <div class="logo-compact flex items-center gap-3 md:hidden">
      <NuxtImg src="/logo.svg" alt="Vootaa Logo" class="w-12 h-12" />
      <span class="font-bold tracking-wide select-none text-2xl">VOOTAA</span>
    </div>

    <div class="logo-expanded hidden md:flex items-center gap-4">
      <NuxtImg src="/logo.svg" alt="Vootaa Logo" class="w-12 h-12" />
      <div class="brand-text">
        <div class="brand-name font-bold tracking-wide text-2xl mb-1">VOOTAA</div>
        <div class="brand-tagline text-sm font-medium tracking-wider">
          <span class="first-letter">V</span>ibrations
          <span class="first-letter">O</span>f
          <span class="first-letter">O</span>rigins,
          <span class="first-letter">T</span>ethers
          <span class="first-letter">A</span>nd
          <span class="first-letter">A</span>uroras
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo-brand {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 50;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  color: var(--text);
}

.brand-tagline {
  color: var(--text);
  opacity: 0.8;
  line-height: 1.2;
}

.first-letter {
  font-weight: bold;
  font-size: 1.1em;
  color: var(--accent);
  text-shadow: 0 0 4px var(--accent);
}

@media (max-width: 1024px) {
  .logo-expanded .brand-tagline {
    font-size: 0.75rem;
  }
}

@media (max-width: 768px) {
  .logo-brand {
    top: 1rem;
    left: 1rem;
  }
}
</style>