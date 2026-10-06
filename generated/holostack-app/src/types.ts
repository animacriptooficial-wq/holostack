export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  description: string;
  imageUrl: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  favorites: string[]; // array of car ids
}