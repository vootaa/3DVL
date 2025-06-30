export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  heroImage: string;
}

export const projects: Project[] = [
  {
    id: 'synthwave-landscape',
    name: 'Synthwave Landscape',
    description: 'An infinitely generating retro-futuristic landscape with vaporwave aesthetics.',
    path: '/synthwave-landscape',
    heroImage: '/synthwave-landscape.png',
  },
  {
    id: 'galaxy-generator',
    name: 'Galaxy Generator',
    description: 'Create stunning, unique galaxies with procedural noise and particle simulation.',
    path: '/galaxy-generator',
    heroImage: '/galaxy-generator.png',
  },
  {
    id: 'shadertoy-museum',
    name: 'Shadertoy Museum',
    description: 'A curated collection of interactive and mesmerizing GLSL shader art.',
    path: '/shadertoy-museum',
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
