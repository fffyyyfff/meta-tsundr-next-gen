'use client';

import {
  BookOpenIcon,
  SmartphoneIcon,
  ShoppingCartIcon,
  UtensilsCrossedIcon,
  ShirtIcon,
  Gamepad2Icon,
  PackageIcon,
} from 'lucide-react';

type ItemCategory = 'BOOK' | 'ELECTRONICS' | 'DAILY_GOODS' | 'FOOD' | 'CLOTHING' | 'HOBBY' | 'OTHER';

const CATEGORY_ICON_MAP: Record<ItemCategory, typeof BookOpenIcon> = {
  BOOK: BookOpenIcon,
  ELECTRONICS: SmartphoneIcon,
  DAILY_GOODS: ShoppingCartIcon,
  FOOD: UtensilsCrossedIcon,
  CLOTHING: ShirtIcon,
  HOBBY: Gamepad2Icon,
  OTHER: PackageIcon,
};

const CATEGORY_LABEL_MAP: Record<ItemCategory, string> = {
  BOOK: '書籍',
  ELECTRONICS: '家電',
  DAILY_GOODS: '日用品',
  FOOD: '食品',
  CLOTHING: '衣類',
  HOBBY: '趣味',
  OTHER: 'その他',
};

export function getCategoryIcon(category: string) {
  return CATEGORY_ICON_MAP[category as ItemCategory] ?? PackageIcon;
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABEL_MAP[category as ItemCategory] ?? 'その他';
}

interface CategoryIconProps {
  category: string;
  className?: string;
}

export function CategoryIcon({ category, className = 'size-4' }: CategoryIconProps) {
  const Icon = getCategoryIcon(category);
  return <Icon className={className} />;
}
