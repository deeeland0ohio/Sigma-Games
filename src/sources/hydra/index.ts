export interface HydraGame {
  name: string;
  url: string;
  image?: string;
}

export const HYDRA_CONFIG = {
  id: 'hydra',
  title: 'Hydra Games',
  cdnUrl: 'https://cdn.jsdelivr.net/gh/zennedu/hydra@main/gmes.json',
  fallbackHost: 'https://raw.githubusercontent.com/zennedu/hydra/main/gmes.json'
};
