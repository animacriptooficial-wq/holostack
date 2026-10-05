export const routes = {
  home: '/',
  cars: '/cars',
  carDetail: (id: string) => `/cars/${id}`,
  about: '/about',
  contact: '/contact'
};

export const apiEndpoints = {
  cars: '/api/cars',
  users: '/api/users'
};