// Configuration and route setup

export const routes = {
  home: '/',
  cars: '/cars',
  carDetails: (id: string) => `/cars/${id}`,
  about: '/about',
  contact: '/contact'
};

export const apiBaseUrl = 'https://api.luxurycars.com';
