export interface ColorScheme {
  name: string;
  colors: {
    '--color-primary': string;
    '--color-secondary': string;
    '--color-accent': string;
    '--color-background': string;
    '--color-hero-bg': string;
  };
}

export const colorSchemes: ColorScheme[] = [
  {
    name: 'Neon Dystopia',
    colors: {
      '--color-primary': '#ff00ff', // Magenta
      '--color-secondary': '#ffffff', // White
      '--color-accent': '#00ffff',   // Cyan
      '--color-background': '#0a0a0a', // Black
      '--color-hero-bg': 'rgba(10, 10, 10, 0.5)',
    },
  },
  {
    name: 'Synthwave Sunset',
    colors: {
      '--color-primary': '#FF4F7A', // Hot Pink
      '--color-secondary': '#FFFFFF', // White
      '--color-accent': '#00F6FF',   // Cyan
      '--color-background': '#200A40', // Deep Purple
      '--color-hero-bg': 'rgba(32, 10, 64, 0.5)',
    },
  },
  {
    name: 'Glitch City',
    colors: {
      '--color-primary': '#00FF00', // Lime Green
      '--color-secondary': '#FFFFFF', // White
      '--color-accent': '#FFD700',   // Gold
      '--color-background': '#0D0D1A', // Near Black
      '--color-hero-bg': 'rgba(13, 13, 26, 0.5)',
    },
  },
  {
    name: 'Hacker Green',
    colors: {
      '--color-primary': '#39FF14', // Neon Green
      '--color-secondary': '#000000', // Black
      '--color-accent': '#FFFFFF',   // White
      '--color-background': '#0A0A0A', // True Black
      '--color-hero-bg': 'rgba(10, 10, 10, 0.5)',
    },
  },
  {
    name: 'Arcade Dreams',
    colors: {
      '--color-primary': '#FFD700', // Gold
      '--color-secondary': '#FFFFFF', // White
      '--color-accent': '#FF4500',   // OrangeRed
      '--color-background': '#000020', // Navy Blue
      '--color-hero-bg': 'rgba(0, 0, 32, 0.5)',
    },
  },
  {
    name: 'Chrome & Rust',
    colors: {
      '--color-primary': '#C0C0C0', // Silver
      '--color-secondary': '#000000', // Black
      '--color-accent': '#B7410E',   // Rust
      '--color-background': '#222222', // Dark Gray
      '--color-hero-bg': 'rgba(34, 34, 34, 0.5)',
    },
  },
];
