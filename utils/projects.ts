export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  heroImage: string;
}

export const projects: Project[] = [
  {
    id: 'galaxy',
    name: 'Galaxy',
    description: 'Create stunning, unique galaxies with procedural noise and particle simulation.',
    path: '/galaxy',
    heroImage: '/galaxy-generator.png',
  },
  {
    id: 'museum',
    name: 'Museum',
    description: 'A curated collection of interactive and mesmerizing GLSL shader art.',
    path: '/museum',
    heroImage: '/shadertoy-museum.png',
  },
  {
    id: 'space-game',
    name: 'Space Game',
    description: 'A minimalist prototype for a 3D space exploration and combat game.',
    path: '/space-game',
    heroImage: '/space-game.png',
  },
];
