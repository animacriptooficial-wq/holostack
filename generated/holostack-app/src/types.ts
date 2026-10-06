export interface Car {
  id: string;
  model: string;
  brand: string;
  year: number;
  price: number;
  imageUrl: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  favorites: string[]; // array of car IDs
}