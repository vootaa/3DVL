import { ref, computed } from 'vue';
import { colorSchemes, type ColorScheme } from '~/utils/colorSchemes';

const currentScheme = ref<ColorScheme | null>(null);

export function useTheme() {
  const initializeTheme = () => {
    if (!currentScheme.value) {
      const randomIndex = Math.floor(Math.random() * colorSchemes.length);
      currentScheme.value = colorSchemes[randomIndex];
    }
  };

  const setTheme = (schemeName: string) => {
    const scheme = colorSchemes.find(s => s.name === schemeName);
    if (scheme) {
      currentScheme.value = scheme;
    }
  };

  const themeStyles = computed(() => {
    if (!currentScheme.value) return {};
    return currentScheme.value.colors;
  });

  return {
    initializeTheme,
    setTheme,
    themeStyles,
    currentScheme,
    availableSchemes: colorSchemes,
  };
}
