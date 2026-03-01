import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import type { Guest } from "@/types";

interface GuestState {
  guests: Guest[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchGuests: () => Promise<void>;
  searchGuests: (query: string) => Promise<Guest[]>;
  createGuest: (guest: Partial<Guest>) => Promise<{ error: any; data?: Guest }>;
  updateGuest: (id: string, guest: Partial<Guest>) => Promise<{ error: any }>;
}

export const useGuestStore = create<GuestState>((set, get) => ({
  guests: [],
  loading: false,
  error: null,

  fetchGuests: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      set({ guests: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  searchGuests: async (query: string) => {
    try {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .or(
          `full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`
        )
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("Error searching guests:", error);
      return [];
    }
  },

  createGuest: async (guest) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("guests")
        .insert([guest])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        guests: [data, ...state.guests],
        loading: false,
      }));

      return { error: null, data };
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { error };
    }
  },

  updateGuest: async (id, guest) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("guests")
        .update(guest)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        guests: state.guests.map((g) => (g.id === id ? data : g)),
        loading: false,
      }));

      return { error: null };
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { error };
    }
  },
}));
