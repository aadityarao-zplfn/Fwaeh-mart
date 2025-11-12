import { create } from 'zustand';

export const useStore = create((set) => ({
  // Cart state
  cartCount: 0,
  setCartCount: (count) => set({ cartCount: count }),
  
  // Notification state
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, notification]
  })),
  
  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));