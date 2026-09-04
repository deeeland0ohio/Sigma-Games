export interface BaseGameItem {
  title: string;
  url?: string;
  image?: string;
  description?: string;
  category?: string;
  source?: string;
}

export interface GameSourceMeta {
  id: string;
  title: string;
  description: string;
  shortDesc: string;
  iconName?: string;
  route: string;
  colorScheme: {
    primary: string;
    border: string;
    hoverBorder: string;
    glow: string;
    badge: string;
  };
  totalCountEstimate?: number;
  externalHost?: string;
}
