export interface Car {
  id: string;
  name: string;
  price: string;
  horsepower: number;
  imageUrl: string;
  description: string;
}

export interface CarCollection {
  cars: Car[];
}