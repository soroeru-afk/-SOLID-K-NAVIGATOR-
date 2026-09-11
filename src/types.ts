export interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface MarketLink {
  id: string;
  title: string;
  url: string;
}

export interface StockMemo {
  text: string;
  targetPrice?: string;
  savedAt?: string;
}

export interface StockBwp {
  price: string;
  comment?: string;
  setAt?: string;
}

export interface Stock {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  createdAt: number;
  price?: string;
  priceUpdatedAt?: number;
  description?: string;
}

export type FolderColor = 'theme' | 'amber' | 'blue' | 'white' | 'black' | 'gray';

