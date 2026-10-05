export type User = {
  id: string;
  name: string;
  email: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export type Order = {
  id: string;
  userId: string;
  productIds: string[];
  total: number;
  date: Date;
};