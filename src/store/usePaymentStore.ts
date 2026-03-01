import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import { normalizeError } from "@/lib/error";

// Types
type PaymentType = 'advance' | 'balance' | 'mid_stay' | 'refund' | 'adjustment';
type PaymentMethod = 'cash' | 'card' | 'upi' | 'online' | 'bank_transfer';

interface Payment {
    id: string;
    booking_id: string;
    invoice_id?: string;
    payment_type: PaymentType;
    amount: number;
    payment_method: PaymentMethod;
    reference_number?: string;
    notes?: string;
    collected_by: string;
    collected_at: string;
    created_at: string;
    collected_by_user?: { email: string };
}

interface PaymentState {
    payments: Payment[];
    loading: boolean;
    error: string | null;

    // Actions
    recordPayment: (data: {
        bookingId: string;
        invoiceId?: string;
        paymentType: PaymentType;
        amount: number;
        paymentMethod: PaymentMethod;
        referenceNumber?: string;
        notes?: string;
    }) => Promise<string>;

    getPaymentsForBooking: (bookingId: string) => Promise<Payment[]>;

    getTotalPaidForBooking: (bookingId: string) => Promise<{
        totalPaid: number;
        totalRefunded: number;
        netPaid: number;
    }>;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
    payments: [],
    loading: false,
    error: null,

    recordPayment: async (data) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: payment, error } = await supabase
                .from('payments')
                .insert({
                    booking_id: data.bookingId,
                    invoice_id: data.invoiceId ?? null,
                    payment_type: data.paymentType,
                    amount: data.amount,
                    payment_method: data.paymentMethod,
                    reference_number: data.referenceNumber ?? null,
                    notes: data.notes ?? null,
                    collected_by: user?.id,
                    // Use collected_at as per migration, assume DB defaults to NOW() if omitted or pass NOW()
                    collected_at: new Date().toISOString(),
                    created_by: user?.id // Add created_by for audit as per Bug 2.5 (proactive)
                })
                .select('id')
                .single();

            if (error) throw error;
            return payment.id;
        } catch (error: any) {
            throw new Error(`Failed to record payment: ${error.message}`);
        }
    },

    getPaymentsForBooking: async (bookingId) => {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('booking_id', bookingId)
                .order('collected_at', { ascending: true });

            if (error) throw error;
            return data ?? [];
        } catch (error: any) {
            console.error("Error fetching payments:", error);
            throw new Error(error.message);
        }
    },

    getTotalPaidForBooking: async (bookingId) => {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('amount, payment_type')
                .eq('booking_id', bookingId);

            if (error) throw error;

            const paid = (data ?? [])
                .filter(p => p.payment_type !== 'refund')
                .reduce((sum, p) => sum + (p.amount || 0), 0);

            const refunded = (data ?? [])
                .filter(p => p.payment_type === 'refund')
                .reduce((sum, p) => sum + (p.amount || 0), 0);

            return { totalPaid: paid, totalRefunded: refunded, netPaid: paid - refunded };
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}));
