export interface Category {
  id: string;
  name: string;
}

export interface MarketLink {
  id: string;
  title: string;
  url: string;
}

export interface Stock {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  createdAt: number;
  price?: string;
  priceUpdatedAt?: number;
}
