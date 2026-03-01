import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import type { HotelSettings, RoomCategory } from "@/types";

interface SettingsState {
  hotelSettings: HotelSettings | null;
  roomCategories: RoomCategory[];
  loading: boolean;
  error: string | null;

  // Hotel Settings Actions
  fetchHotelSettings: () => Promise<void>;
  updateHotelSettings: (settings: Partial<HotelSettings>) => Promise<{ error: any }>;

  // Room Categories Actions
  fetchRoomCategories: () => Promise<void>;
  createRoomCategory: (category: Partial<RoomCategory>) => Promise<{ error: any }>;
  updateRoomCategory: (id: string, category: Partial<RoomCategory>) => Promise<{ error: any }>;
  deleteRoomCategory: (id: string) => Promise<{ error: any }>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hotelSettings: null,
  roomCategories: [],
  loading: false,
  error: null,

  fetchHotelSettings: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("hotel_settings")
        .select("*")
        .single();

      if (error) throw error;
      set({ hotelSettings: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateHotelSettings: async (settings) => {
    set({ loading: true, error: null });
    try {
      const currentSettings = get().hotelSettings;
      if (!currentSettings) {
        throw new Error("No hotel settings found");
      }

      const { data, error } = await supabase
        .from("hotel_settings")
        .update(settings)
        .eq("id", currentSettings.id)
        .select()
        .single();

      if (error) throw error;
      
      set({ hotelSettings: data, loading: false });
      return { error: null };
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { error };
    }
  },

  fetchRoomCategories: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("room_categories")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      set({ roomCategories: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createRoomCategory: async (category) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("room_categories")
        .insert([category])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        roomCategories: [...state.roomCategories, data],
        loading: false,
      }));

      return { error: null };
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { error };
    }
  },

  updateRoomCategory: async (id, category) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("room_categories")
        .update(category)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        roomCategories: state.roomCategories.map((cat) =>
          cat.id === id ? data : cat
        ),
        loading: false,
      }));

      return { error: null };
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { error };
    }
  },

  deleteRoomCategory: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from("room_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      set((state) => ({
        roomCategories: state.roomCategories.filter((cat) => cat.id !== id),
        loading: false,
      }));

      return { error: null };
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { error };
    }
  },
}));
