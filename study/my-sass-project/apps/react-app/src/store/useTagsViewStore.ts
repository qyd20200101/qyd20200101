import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TagItem {
  path: string;
  title: string;
  name?: string;
}

interface TagsViewState {
  visitedViews: TagItem[];
  cacheViews: string[];
  addView: (view: TagItem) => void;
  delView: (path: string) => void;
  delOthersViews: (path: string) => void;
  delAllViews: () => void;
}

export const useTagsViewStore = create<TagsViewState>()(
  persist(
    (set) => ({
      visitedViews: [],
      cacheViews: [],

      addView: (view) =>
        set((state) => {
          const exists = state.visitedViews.some((v) => v.path === view.path);
          if (exists) return state;

          const cacheViews = [...state.cacheViews];
          if (view.name && !cacheViews.includes(view.name)) {
            cacheViews.push(view.name);
          }

          return {
            visitedViews: [...state.visitedViews, { ...view }],
            cacheViews,
          };
        }),

      delView: (path) =>
        set((state) => {
          const target = state.visitedViews.find((v) => v.path === path);
          return {
            visitedViews: state.visitedViews.filter((v) => v.path !== path),
            cacheViews: target?.name
              ? state.cacheViews.filter((n) => n !== target.name)
              : state.cacheViews,
          };
        }),

      delOthersViews: (path) =>
        set((state) => {
          const keep = state.visitedViews.find((v) => v.path === path);
          return {
            visitedViews: keep ? [keep] : [],
            cacheViews: keep?.name ? [keep.name] : [],
          };
        }),

      delAllViews: () => set({ visitedViews: [], cacheViews: [] }),
    }),
    {
      name: 'tagsview-storage',
      partialize: (state) => ({ visitedViews: state.visitedViews, cacheViews: state.cacheViews }),
    }
  )
);
