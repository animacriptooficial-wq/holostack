export const routes = {
  home: '/',
  cars: '/cars',
  carDetails: (id: string) => `/cars/${id}`
};

export const carData: CarCollection = {
  cars: [
    {
      id: '1',
      name: 'Lamborghini Revuelto',
      price: '€610,000',
      horsepower: 1015,
      imageUrl: '/images/lamborghini-revuelto.jpg',
      description: 'The Lamborghini Revuelto is a marvel of engineering with a hybrid V12 engine producing 1015 horsepower, offering an unparalleled driving experience.'
    },
    {
      id: '2',
      name: 'Ferrari SF90 Stradale',
      price: '€450,000',
      horsepower: 986,
      imageUrl: '/images/ferrari-sf90-stradale.jpg',
      description: 'The Ferrari SF90 Stradale blends performance and elegance with a plug-in hybrid powertrain delivering 986 horsepower.'
    },
    {
      id: '3',
      name: 'Porsche 911 Turbo S',
      price: '€207,000',
      horsepower: 640,
      imageUrl: '/images/porsche-911-turbo-s.jpg',
      description: 'The Porsche 911 Turbo S is the pinnacle of the 911 range, with a twin-turbocharged engine delivering 640 horsepower and unmatched handling dynamics.'
    }
  ]
};
