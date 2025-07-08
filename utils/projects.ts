export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  heroImage: string;
  title: string;
  metaDescription: string;
  buttonText?: string; // Optional button text for project links
}

export const projects: Project[] = [
  {
    id: 'petersen-expanse',
    name: ' Petersen Expanse',
    description: 'Where the Origins Pulse in Silent Harmony',
    path: '/petersen-expanse',
    heroImage: '/images/petersen-expanse.png',
    title: 'Petersen Expanse - VOOTAA: Vibrations Of Origins, Tethers And Auroras',
    metaDescription: 'An evolutionary galaxy simulation showing the transition from chaos to orbital structure.',
    buttonText: 'Explore',
  },
  {
    id: 'echo-mission',
    name: 'Echo Mission',
    description: 'Following the Vibrations that Awaken Memory',
    path: '/echo-mission',
    heroImage: '/images/echo-mission.png',
    title: 'Echo Mission - VOOTAA: Vibrations Of Origins, Tethers And Auroras',
    metaDescription: 'A Web3D gaming & visualization of the Kadena Chainweb braided structure.',
    buttonText: 'Play Now',
  },
  {
    id: 'auroras-city',
    name: 'City of Auroras',
    description: 'Where Tethers Converge, and Lights Remember',
    path: '/auroras-city',
    heroImage: '/images/auroras-city.png',
    title: 'City of Auroras - VOOTAA: Vibrations Of Origins, Tethers And Auroras',
    metaDescription: 'A 3D visualization of the Kadena Chainweb and Petersen Graph topology.',
    buttonText: 'Discover',
  },

];
