// Define TypeScript types and interfaces

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  imageUrl: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  favorites: string[]; // Array of car IDs
}
