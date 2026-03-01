import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";

interface InvoiceState {
    invoices: any[];
    loading: boolean;
    error: string | null;

    fetchInvoices: () => Promise<void>;
    fetchInvoiceById: (id: string) => Promise<any | null>;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
    invoices: [],
    loading: false,
    error: null,

    fetchInvoices: async () => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from("invoices")
                .select(`
          *,
          booking:bookings(*),
          guest:guests(*)
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            set({ invoices: data || [], loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchInvoiceById: async (id: string) => {
        try {
            const { data, error } = await supabase
                .from("invoices")
                .select(`
          *,
          booking:bookings(
            *,
            room:rooms(*),
            room_category:room_categories(*)
          ),
          guest:guests(*)
        `)
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error("Error fetching invoice:", error);
            return null;
        }
    },
}));
