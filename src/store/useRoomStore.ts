import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import type { Room, RoomStatus } from "@/types";

interface RoomState {
  rooms: Room[];
  loading: boolean;
  error: string | null;

  // Filters
  statusFilter: RoomStatus | "all";
  categoryFilter: string | "all";
  floorFilter: number | "all";
  searchQuery: string;

  // Actions
  fetchRooms: () => Promise<void>;
  createRoom: (room: Partial<Room>) => Promise<{ error: any; data?: Room }>;
  updateRoom: (id: string, room: Partial<Room>) => Promise<{ error: any }>;
  deleteRoom: (id: string) => Promise<{ error: any }>;
  updateRoomStatus: (id: string, status: RoomStatus) => Promise<{ error: any }>;
  markRoomClean: (id: string, notes?: string) => Promise<{ error: any }>;

  // Filter Actions
  setStatusFilter: (status: RoomStatus | "all") => void;
  setCategoryFilter: (categoryId: string | "all") => void;
  setFloorFilter: (floor: number | "all") => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Getters
  getFilteredRooms: () => Room[];
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  loading: false,
  error: null,

  // Filters
  statusFilter: "all",
  categoryFilter: "all",
  floorFilter: "all",
  searchQuery: "",

  fetchRooms: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          category:room_categories(*)
        `)
        .order("room_number", { ascending: true });

      if (error) throw error;
      set({ rooms: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createRoom: async (room) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert([room])
        .select(`
          *,
          category:room_categories(*)
        `)
        .single();

      if (error) throw error;

      set((state) => ({
        rooms: [...state.rooms, data],
        loading: false,
      }));

      return { error: null, data };
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { error };
    }
  },

  updateRoom: async (id, room) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("rooms")
        .update(room)
        .eq("id", id)
        .select(`
          *,
          category:room_categories(*)
        `)
        .single();

      if (error) throw error;

      set((state) => ({
        rooms: state.rooms.map((r) => (r.id === id ? data : r)),
        loading: false,
      }));

      return { error: null };
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { error };
    }
  },

  deleteRoom: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", id);

      if (error) throw error;

      set((state) => ({
        rooms: state.rooms.filter((r) => r.id !== id),
        loading: false,
      }));

      return { error: null };
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { error };
    }
  },

  updateRoomStatus: async (id, status) => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .update({ status })
        .eq("id", id)
        .select(`
          *,
          category:room_categories(*)
        `)
        .single();

      if (error) throw error;

      set((state) => ({
        rooms: state.rooms.map((r) => (r.id === id ? data : r)),
      }));

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  markRoomClean: async (id, notes) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.rpc('mark_room_clean', {
        p_room_id: id,
        p_cleaned_by: user.id,
        p_notes: notes || null,
      });

      if (error) throw error;

      // Refresh rooms to get updated status and metadata
      await get().fetchRooms();

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  // Filter Actions
  setStatusFilter: (status) => set({ statusFilter: status }),
  setCategoryFilter: (categoryId) => set({ categoryFilter: categoryId }),
  setFloorFilter: (floor) => set({ floorFilter: floor }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearFilters: () =>
    set({
      statusFilter: "all",
      categoryFilter: "all",
      floorFilter: "all",
      searchQuery: "",
    }),

  // Getters
  getFilteredRooms: () => {
    const state = get();
    let filtered = state.rooms;

    // Status filter
    if (state.statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === state.statusFilter);
    }

    // Category filter
    if (state.categoryFilter !== "all") {
      filtered = filtered.filter((r) => r.category_id === state.categoryFilter);
    }

    // Floor filter
    if (state.floorFilter !== "all") {
      filtered = filtered.filter((r) => r.floor === state.floorFilter);
    }

    // Search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.room_number.toLowerCase().includes(query) ||
          r.category?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  },
}));
