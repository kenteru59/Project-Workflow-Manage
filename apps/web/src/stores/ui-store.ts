import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Member } from "@workflow-app/shared";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  currentUser: Member | null;
  setCurrentUser: (user: Member | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
