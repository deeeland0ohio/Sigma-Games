import { LucideIcon } from 'lucide-react';

export type Game = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  type: 'component' | 'iframe' | 'folder';
  url?: string;
  srcdoc?: string;
  popularity?: number;
  series?: string;
  seriesOrder?: number;
  keywords?: string[];
  image?: string;
  isExternal?: boolean;
};
