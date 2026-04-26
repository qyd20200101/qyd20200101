import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    user: null,
    isDarkMode: true,
  }),
  actions: {
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode;
    }
  }
});
