export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  imageUrl: string;
}

export interface AppState {
  cars: Car[];
  selectedCarId: string | null;
  setSelectedCarId: (id: string | null) => void;
}
