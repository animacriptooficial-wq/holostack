export const routes = {
  dashboard: "/",
  workspace: "/workspace",
}

export const getRoute = (route: keyof typeof routes) => {
  return routes[route]
}
