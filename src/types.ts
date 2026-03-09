import { LucideIcon } from 'lucide-react';

export type Game = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  type: 'component' | 'iframe' | 'folder' | 'html';
  url?: string;
  srcdoc?: string;
  html?: string;
  popularity?: number;
  series?: string;
  seriesOrder?: number;
};
