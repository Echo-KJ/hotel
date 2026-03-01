import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import type { Booking, BookingStatus, BookingSource } from "@/types";

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;

  // Filters
  statusFilter: BookingStatus | "all";
  sourceFilter: BookingSource | "all";
  dateRange: { start: Date | null; end: Date | null };

  // Actions
  fetchBookings: () => Promise<void>;
  fetchBookingById: (id: string) => Promise<Booking | null>;
  createBooking: (booking: Partial<Booking>) => Promise<{ error: any; data?: Booking }>;
  updateBooking: (id: string, booking: Partial<Booking>) => Promise<{ error: any }>;
  cancelBooking: (id: string, reason: string) => Promise<{ error: any }>;
  checkInBooking: (id: string) => Promise<{ error: any }>;

  // Availability
  checkRoomAvailability: (
    categoryId: string,
    checkIn: string,
    checkOut: string
  ) => Promise<{ available: boolean; rooms: any[] }>;

  // Filter Actions
  setStatusFilter: (status: BookingStatus | "all") => void;
  setSourceFilter: (source: BookingSource | "all") => void;
  setDateRange: (start: Date | null, end: Date | null) => void;
  clearFilters: () => void;

  // Getters
  getFilteredBookings: () => Booking[];
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  loading: false,
  error: null,

  // Filters
  statusFilter: "all",
  sourceFilter: "all",
  dateRange: { start: null, end: null },

  fetchBookings: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          guest:guests(*),
          room:rooms(*),
          room_category:room_categories(*)
        `)
        .order("check_in_date", { ascending: false });

      if (error) throw error;
      set({ bookings: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchBookingById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          guest:guests(*),
          room:rooms(*),
          room_category:room_categories(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching booking:", error);
      return null;
    }
  },

  createBooking: async (booking) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert([booking])
        .select(`
          *,
          guest:guests(*),
          room:rooms(*),
          room_category:room_categories(*)
        `)
        .single();

      if (error) throw error;

      // Bug 2.1: Record advance payment in ledger
      if (data && data.advance_paid > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('payments').insert({
          booking_id: data.id,
          payment_type: 'advance',
          amount: data.advance_paid,
          payment_method: 'cash', // Default to cash
          notes: 'Advance payment at booking',
          collected_by: user?.id,
          collected_at: new Date().toISOString(),
          created_by: user?.id
        });
      }

      set((state) => ({
        bookings: [data, ...state.bookings],
        loading: false,
      }));

      return { error: null, data };
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { error };
    }
  },

  updateBooking: async (id, booking) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("bookings")
        .update(booking)
        .eq("id", id)
        .select(`
          *,
          guest:guests(*),
          room:rooms(*),
          room_category:room_categories(*)
        `)
        .single();

      if (error) throw error;

      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? data : b)),
        loading: false,
      }));

      return { error: null };
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { error };
    }
  },

  cancelBooking: async (id, reason) => {
    try {
      // 1. Fetch booking details to validate state
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('status, room_id, advance_paid')
        .eq('id', id)
        .single();

      if (fetchError || !booking) throw new Error('Booking not found');

      // 2. State guards
      if (booking.status === 'checked_in') {
        throw new Error('Cannot cancel a booking that is currently checked in. Process checkout instead.');
      }
      if (booking.status === 'checked_out' || booking.status === 'cancelled') {
        throw new Error(`Booking is already ${booking.status}`);
      }

      // 3. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 4. Call RPC
      const { error } = await supabase.rpc('process_cancellation', {
        p_booking_id: id,
        p_room_id: booking.room_id,
        p_reason: reason,
        p_cancelled_by: user.id,
      });

      if (error) throw new Error(`Cancellation failed: ${error.message}`);

      // 5. Update local state
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, status: "cancelled" as BookingStatus } : b
        ),
      }));

      // Warn if refund needed
      if (booking.advance_paid > 0) {
        console.warn(`Booking ${id} cancelled with advance payment of ${booking.advance_paid}. Manual refund required.`);
      }

      return { error: null };
    } catch (error: any) {
      console.error("Cancellation error:", error);
      return { error: error.message };
    }
  },

  checkInBooking: async (id) => {
    try {
      // Get booking details first
      const booking = get().bookings.find((b) => b.id === id);
      if (!booking) throw new Error("Booking not found in local state");

      const { data, error } = await supabase.rpc('process_checkin', {
        p_booking_id: booking.id,
        p_room_id: booking.room_id,
        p_guest_id: booking.guest_id,
        p_check_in_date: booking.check_in_date,
        p_check_out_date: booking.check_out_date,
      });

      if (error) throw new Error(`Check-in failed: ${error.message}`);

      // Update local state to reflect changes immediately
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, status: "checked_in" as BookingStatus } : b
        ),
      }));

      return { error: null };
    } catch (error: any) {
      console.error("Check-in error:", error);
      return { error: error.message };
    }
  },

  checkRoomAvailability: async (categoryId, checkIn, checkOut) => {
    try {
      // Get all rooms of this category
      const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .eq("category_id", categoryId)
        .eq("is_active", true);

      if (roomsError) throw roomsError;

      // Check for conflicting bookings
      const { data: conflicts, error: conflictsError } = await supabase
        .from("bookings")
        .select("room_id")
        .eq("room_category_id", categoryId)
        .in("status", ["confirmed", "checked_in"])
        .or(
          `and(check_in_date.lte.${checkOut},check_out_date.gte.${checkIn})`
        );

      if (conflictsError) throw conflictsError;

      const bookedRoomIds = new Set(
        conflicts?.map((c) => c.room_id).filter(Boolean) || []
      );
      const availableRooms = rooms?.filter((r) => !bookedRoomIds.has(r.id)) || [];

      return {
        available: availableRooms.length > 0,
        rooms: availableRooms,
      };
    } catch (error: any) {
      console.error("Error checking availability:", error);
      return { available: false, rooms: [] };
    }
  },

  // Filter Actions
  setStatusFilter: (status) => set({ statusFilter: status }),
  setSourceFilter: (source) => set({ sourceFilter: source }),
  setDateRange: (start, end) => set({ dateRange: { start, end } }),
  clearFilters: () =>
    set({
      statusFilter: "all",
      sourceFilter: "all",
      dateRange: { start: null, end: null },
    }),

  // Getters
  getFilteredBookings: () => {
    const state = get();
    let filtered = state.bookings;

    // Status filter
    if (state.statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === state.statusFilter);
    }

    // Source filter
    if (state.sourceFilter !== "all") {
      filtered = filtered.filter((b) => b.source === state.sourceFilter);
    }

    // Date range filter
    if (state.dateRange.start || state.dateRange.end) {
      filtered = filtered.filter((b) => {
        const checkIn = new Date(b.check_in_date);
        const checkOut = new Date(b.check_out_date);

        if (state.dateRange.start && checkOut < state.dateRange.start) {
          return false;
        }
        if (state.dateRange.end && checkIn > state.dateRange.end) {
          return false;
        }
        return true;
      });
    }

    return filtered;
  },
}));
