import React from 'react';
import {
  Tag,
  Coffee,
  Gamepad2,
  Dumbbell,
  Sparkles,
  Plane,
  Heart,
  BookOpen,
  Music,
  Laptop,
  Utensils,
  Car,
  Receipt,
  Home,
  ShoppingBag,
  Film,
  HeartPulse,
  GraduationCap,
  Tv,
  HelpCircle,
  Briefcase,
  DollarSign,
  Gift,
  Building,
} from 'lucide-react';
import { CustomCategory } from '../types';

export const PRESET_CATEGORY_COLORS = [
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#0d9488', // teal-600
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#a855f7', // purple-500
  '#f43f5e', // rose-500
  '#f59e0b', // amber-500
  '#f97316', // orange-500
  '#64748b', // slate-500
];

export const PRESET_CATEGORY_ICONS: Array<{ key: string; label: string; icon: React.FC<{ className?: string }> }> = [
  { key: 'Tag', label: 'Tag', icon: Tag },
  { key: 'Coffee', label: 'Coffee', icon: Coffee },
  { key: 'Gamepad2', label: 'Gaming', icon: Gamepad2 },
  { key: 'Dumbbell', label: 'Fitness', icon: Dumbbell },
  { key: 'Sparkles', label: 'Beauty', icon: Sparkles },
  { key: 'Plane', label: 'Travel', icon: Plane },
  { key: 'Heart', label: 'Personal', icon: Heart },
  { key: 'BookOpen', label: 'Books', icon: BookOpen },
  { key: 'Music', label: 'Music', icon: Music },
  { key: 'Laptop', label: 'Tech', icon: Laptop },
];

export const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Tag,
  Coffee,
  Gamepad2,
  Dumbbell,
  Sparkles,
  Plane,
  Heart,
  BookOpen,
  Music,
  Laptop,
  // Built-in
  Food: Utensils,
  Transport: Car,
  Bills: Receipt,
  Rent: Home,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Health: HeartPulse,
  Education: GraduationCap,
  Subscriptions: Tv,
  Other: HelpCircle,
  // Income
  Salary: Briefcase,
  Freelance: DollarSign,
  Business: Building,
  Investments: DollarSign,
  Gift: Gift,
  Rental: Home,
};

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  Food: '#0d9488', // teal-600
  Transport: '#0284c7', // sky-600
  Bills: '#eab308', // yellow-500
  Rent: '#6366f1', // indigo-500
  Shopping: '#ec4899', // pink-500
  Entertainment: '#8b5cf6', // purple-500
  Health: '#10b981', // emerald-500
  Education: '#f97316', // orange-500
  Subscriptions: '#14b8a6', // teal-500
  Other: '#64748b', // slate-500
};

export function getCategoryColor(categoryName: string, customCategories: CustomCategory[] = []): string {
  if (DEFAULT_CATEGORY_COLORS[categoryName]) {
    return DEFAULT_CATEGORY_COLORS[categoryName];
  }
  const custom = customCategories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (custom?.color) {
    return custom.color;
  }
  return '#64748b';
}

export function getCategoryIcon(categoryName: string, customCategories: CustomCategory[] = []): React.FC<{ className?: string }> {
  // Check if built-in
  if (ICON_MAP[categoryName]) {
    return ICON_MAP[categoryName];
  }
  // Check custom
  const custom = customCategories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (custom && custom.icon && ICON_MAP[custom.icon]) {
    return ICON_MAP[custom.icon];
  }
  return Tag;
}
