export interface GnMathZone {
  id: string;
  name: string;
  url: string;
  image?: string;
}

export const GNMATH_CONFIG = {
  id: 'gn-math',
  title: 'GN-Math',
  zonesUrl: 'https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json',
  cdnHost: 'https://cdn.jsdelivr.net/gh/freebuisness/'
};
