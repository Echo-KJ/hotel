import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export interface FolioSummary {
    booking_id: string;
    booking_number: string;
    booking_status: string;
    guest_name: string;
    guest_phone: string;
    room_number: string;
    check_in_date: string;
    check_out_date: string;
    room_charges: number;
    additional_charges: number;
    subtotal: number;
    cgst: number;
    sgst: number;
    grand_total: number;
    total_paid: number;
    total_refunded: number;
    balance_due: number;
}

export function useFolio(bookingId: string) {
    const [folio, setFolio] = useState<FolioSummary | null>(null);
    const [charges, setCharges] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        try {
            if (!bookingId) {
                setLoading(false);
                return;
            }

            const [folioRes, chargesRes, paymentsRes] = await Promise.all([
                supabase.from('folio_summary').select('*').eq('booking_id', bookingId).single(),
                supabase.from('charges').select('*').eq('booking_id', bookingId).order('created_at'),
                supabase.from('payments').select('*').eq('booking_id', bookingId).order('collected_at'),
            ]);

            if (folioRes.error) {
                // If view not found or no data (e.g. before migration), try fetching booking directly or handle error
                // For now, assume view exists and booking exists
                if (folioRes.error.code !== "PGRST116") { // Not Found
                    throw folioRes.error;
                }
            }

            setFolio(folioRes.data);
            setCharges(chargesRes.data ?? []);
            setPayments(paymentsRes.data ?? []);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching folio:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (bookingId) refresh();
    }, [bookingId]);

    return { folio, charges, payments, loading, error, refresh };
}
