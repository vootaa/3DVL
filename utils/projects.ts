export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  heroImage: string;
  title: string;
  metaDescription: string;
}

export const projects: Project[] = [
  {
    id: 'galaxy',
    name: 'Galaxy',
    description: 'An evolutionary galaxy simulation showing the transition from chaos to orbital structure.',
    path: '/petersen-galaxy',
    heroImage: '/petersen-galaxy.png',
    title: 'Petersen Galaxy Evolution - 3DVL',
    metaDescription: 'An evolutionary galaxy simulation showing the transition from chaos to orbital structure.',
  },
  {
    id: 'museum',
    name: 'Museum',
    description: 'A curated collection of interactive and mesmerizing GLSL shader art.',
    path: '/museum',
    heroImage: '/shadertoy-museum.png',
    title: 'Shadertoy Museum - 3DVL',
    metaDescription: 'A curated collection of interactive and mesmerizing GLSL shader art.',
  },
  {
    id: 'space-game',
    name: 'Space Game',
    description: 'A Web3D gaming & visualization of the Kadena Chainweb braided structure.',
    path: '/space-game',
    heroImage: '/space-game.png',
    title: 'Space Game - 3DVL',
    metaDescription: 'A Web3D gaming & visualization of the Kadena Chainweb braided structure.',
  },
];
