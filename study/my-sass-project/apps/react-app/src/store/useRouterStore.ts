import { create } from 'zustand';

interface MenuRoute {
  path: string;
  name?: string;
  title?: string;
  icon?: string;
  children?: MenuRoute[];
  meta?: Record<string, unknown>;
}

interface RouterState {
  menuRoutes: MenuRoute[];
  setRoutes: (routes: MenuRoute[]) => void;
  addRoute: (route: MenuRoute) => void;
  removeRoute: (path: string) => void;
  reset: () => void;
}

export const useRouterStore = create<RouterState>((set) => ({
  menuRoutes: [],

  setRoutes: (routes) => set({ menuRoutes: routes }),

  addRoute: (route) =>
    set((state) => ({
      menuRoutes: [...state.menuRoutes, route],
    })),

  removeRoute: (path) =>
    set((state) => ({
      menuRoutes: state.menuRoutes.filter((r) => r.path !== path),
    })),

  reset: () => set({ menuRoutes: [] }),
}));
