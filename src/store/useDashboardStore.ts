import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";

interface DashboardStats {
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
    todayArrivals: number;
    todayDepartures: number;
    activeStays: number;
    totalRevenue: number;
    pendingPayments: number;
}

interface DashboardState {
    stats: DashboardStats | null;
    recentBookings: any[];
    todayArrivals: any[];
    todayDepartures: any[];
    loading: boolean;
    error: string | null;

    fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    stats: null,
    recentBookings: [],
    todayArrivals: [],
    todayDepartures: [],
    loading: false,
    error: null,

    fetchDashboardData: async () => {
        set({ loading: true, error: null });
        try {
            const today = new Date().toISOString().split("T")[0];

            // Fetch all data in parallel
            const [
                roomsResult,
                activeStaysResult,
                bookingsResult,
                arrivalsResult,
                departuresResult,
                recentBookingsResult,
            ] = await Promise.all([
                // Total and occupied rooms
                supabase.from("rooms").select("id, status").eq("is_active", true),

                // Active stays
                supabase.from("active_stays").select("id").eq("is_active", true),

                // All bookings for revenue calculation
                supabase
                    .from("bookings")
                    .select("final_amount, advance_paid, payment_status, status")
                    .in("status", ["confirmed", "checked_in", "checked_out"]),

                // Today's arrivals
                supabase
                    .from("bookings")
                    .select(`
            *,
            guest:guests(*),
            room:rooms(*)
          `)
                    .eq("check_in_date", today)
                    .in("status", ["confirmed", "tentative"]),

                // Today's departures
                supabase
                    .from("bookings")
                    .select(`
            *,
            guest:guests(*),
            room:rooms(*)
          `)
                    .eq("check_out_date", today)
                    .eq("status", "checked_in"),

                // Recent bookings (last 5)
                supabase
                    .from("bookings")
                    .select(`
            *,
            guest:guests(*)
          `)
                    .order("created_at", { ascending: false })
                    .limit(5),
            ]);

            // Calculate stats
            const rooms = roomsResult.data || [];
            const totalRooms = rooms.length;
            const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
            const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

            const activeStays = activeStaysResult.data?.length || 0;
            const todayArrivals = arrivalsResult.data?.length || 0;
            const todayDepartures = departuresResult.data?.length || 0;

            // Calculate revenue and pending payments
            const bookings = bookingsResult.data || [];
            const totalRevenue = bookings.reduce(
                (sum, b) => sum + (b.final_amount || 0),
                0
            );
            const pendingPayments = bookings
                .filter((b) => b.payment_status !== "paid")
                .reduce((sum, b) => sum + (b.final_amount - (b.advance_paid || 0)), 0);

            set({
                stats: {
                    totalRooms,
                    occupiedRooms,
                    occupancyRate,
                    todayArrivals,
                    todayDepartures,
                    activeStays,
                    totalRevenue,
                    pendingPayments,
                },
                todayArrivals: arrivalsResult.data || [],
                todayDepartures: departuresResult.data || [],
                recentBookings: recentBookingsResult.data || [],
                loading: false,
            });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
}));
