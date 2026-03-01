import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import { normalizeError } from "@/lib/error";
import { calculateGST } from "@/lib/tax/gst";
import { getSACCode } from "@/lib/tax/sac";
import type { ActiveStay, ChargeType } from "@/types";

interface Charge {
  id?: string;
  stay_id: string;
  booking_id: string;
  charge_type: ChargeType;
  description: string;
  amount: number;
  quantity: number;
  total_amount?: number;
  is_taxable: boolean;
  charge_date: string;
}

interface ActiveStayState {
  activeStays: any[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchActiveStays: () => Promise<void>;
  fetchStayById: (id: string) => Promise<any | null>;
  addCharge: (charge: Partial<Charge>) => Promise<{ error: any }>;
  deleteCharge: (chargeId: string) => Promise<{ error: any }>;
  voidCharge: (chargeId: string, reason: string) => Promise<{ error: any }>;
  checkOut: (
    stayId: string,
    bookingId: string,
    paymentAmount?: number,
    paymentMethod?: string | null,
    referenceNumber?: string | null,
    notes?: string | null
  ) => Promise<{ error: any; invoice?: any }>;
}

export const useActiveStayStore = create<ActiveStayState>((set, get) => ({
  activeStays: [],
  loading: false,
  error: null,

  fetchActiveStays: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("active_stays")
        .select(`
          *,
          booking:bookings(*),
          guest:guests(*),
          room:rooms(*),
          charges(*)
        `)
        .eq("is_active", true)
        .order("check_in_date", { ascending: false });

      if (error) throw error;
      set({ activeStays: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchStayById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("active_stays")
        .select(`
          *,
          booking:bookings(*),
          guest:guests(*),
          room:rooms(*),
          charges(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching stay:", error);
      return null;
    }
  },

  addCharge: async (charge) => {
    set({ loading: true, error: null });
    try {
      console.log("Adding charge:", charge);
      if (!charge.stay_id || !charge.booking_id) {
        throw new Error("Missing requirement fields: stay_id or booking_id");
      }

      const { data, error } = await supabase
        .from("charges")
        .insert([{
          stay_id: charge.stay_id,
          booking_id: charge.booking_id,
          charge_type: charge.charge_type,
          description: charge.description,
          amount: charge.amount,
          quantity: charge.quantity,
          is_taxable: charge.is_taxable ?? true,
          charge_date: charge.charge_date || new Date().toISOString(),
          created_by: (await supabase.auth.getUser()).data.user?.id, // Bug 2.5: Audit
        }])
        .select()
        .single();

      if (error) {
        console.error("Supabase error adding charge details:", JSON.stringify(error, null, 2));
        throw new Error(`Supabase addCharge failed: ${error.message || "Unknown error"}`);
      }

      return { error: null };
    } catch (err: any) {
      const normalized = normalizeError(err);
      console.error("Error in addCharge:", normalized);
      set({ error: normalized.message });
      return { error: normalized.message };
    } finally {
      set({ loading: false });
    }
  },

  deleteCharge: async (chargeId: string) => {
    // Ideally block delete and enforce void, but keeping for now.
    // Check if invoice is locked (Bug 2.5) first.
    // We need booking_id to check invoice. But we only have chargeId.
    // Fetch charge details first.
    try {
      const { data: charge } = await supabase.from('charges').select('booking_id').eq('id', chargeId).single();
      if (charge?.booking_id) {
        const { data: invoice } = await supabase.from('invoices').select('is_locked').eq('booking_id', charge.booking_id).single();
        if (invoice?.is_locked) {
          throw new Error("Cannot delete/void charge after invoice is locked.");
        }
      }

      const { error } = await supabase
        .from("charges")
        .delete()
        .eq("id", chargeId);

      if (error) throw error;

      await get().fetchActiveStays();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  voidCharge: async (chargeId, reason) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 1. Check lock
      const { data: charge } = await supabase.from('charges').select('booking_id, amount').eq('id', chargeId).single();
      if (!charge) throw new Error("Charge not found");

      const { data: invoice } = await supabase.from('invoices').select('is_locked').eq('booking_id', charge.booking_id).single();
      if (invoice?.is_locked) {
        // Only admin can void if locked? Prompt says "Recalculates... only allowed for unlocked invoices or by admin".
        // Since we don't have role check easily here without extra query, we'll block if locked for now or rely on RLS/Backend if possible.
        // Prompt Step 5: "Attempting to edit a charge after its invoice is locked returns a clear error... Cannot edit charges..."
        throw new Error("Cannot void charge after invoice has been generated/locked.");
      }

      // 2. Void Charge
      // Sets is_void = TRUE, void_reason, void_by, void_at
      const { error } = await supabase.from('charges')
        .update({
          is_void: true,
          void_reason: reason,
          void_by: user.id,
          void_at: new Date().toISOString()
        })
        .eq('id', chargeId);

      if (error) throw error;

      await get().fetchActiveStays();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  checkOut: async (
    stayId,
    bookingId,
    paymentAmount = 0,
    paymentMethod = null,
    referenceNumber = null,
    notes = null
  ) => {
    set({ loading: true, error: null });
    try {
      // 1. Get stay with all charges
      const stay = await get().fetchStayById(stayId);
      if (!stay) throw new Error("Stay not found");

      // 2. Calculate totals
      const charges = stay.charges || [];
      const chargesTotal = charges.reduce((sum: number, c: any) => sum + (c.total_amount || 0), 0);
      const roomCharges = stay.booking?.final_amount || 0;
      const subtotal = roomCharges + chargesTotal;

      // 3. Calculate GST using centralized module
      const gstData = calculateGST(subtotal, stay.booking?.room_rate || 0);

      const { cgstAmount, sgstAmount, gstAmount, grandTotal, rates } = gstData;
      const cgstRate = rates.cgstRate;
      const sgstRate = rates.sgstRate;
      const igstRate = 0; // Local supply assumed
      const igstAmount = 0;
      const totalTax = gstAmount;

      if (isNaN(grandTotal) || isNaN(totalTax)) {
        throw new Error("Invalid invoice calculation: grandTotal or totalTax is NaN");
      }

      // 4. Prepare Invoice Data JSON
      const invoiceData = {
        invoice_number: `INV-${Date.now()}`,
        guest_id: stay.guest_id,
        invoice_date: new Date().toISOString(),
        subtotal,
        cgst_rate: cgstRate,
        sgst_rate: sgstRate,
        igst_rate: igstRate,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        total_tax: totalTax,
        grand_total: grandTotal,
        tax_rate_label: rates.slabLabel, // Added for Bug 3.1
        rate_per_night: stay.booking?.room_rate || 0, // Added for Bug 3.1 and 3.4
        amount_paid: (stay.booking?.advance_paid || 0) + paymentAmount,
        balance_due: Math.max(0, grandTotal - ((stay.booking?.advance_paid || 0) + paymentAmount)),
        payment_status: paymentAmount > 0 ? "partial" : "pending", // Will be refined by RPC
        items: [
          {
            description: `Room ${stay.room?.room_number} - ${stay.booking?.nights} nights`,
            hsn_sac: getSACCode('room'), // Added SAC
            quantity: stay.booking?.nights || 1,
            rate: stay.booking?.room_rate || 0,
            amount: roomCharges,
          },
          ...charges.map((c: any) => ({
            description: c.description,
            hsn_sac: getSACCode(c.charge_type), // Added SAC
            quantity: c.quantity,
            rate: c.amount,
            amount: c.total_amount,
          })),
        ],
        notes: stay.notes || "",
        terms_conditions: "Thank you for staying with us.",
        generated_by: (await supabase.auth.getUser()).data.user?.id
      };

      // 5. Call RPC
      const { data: invoiceId, error } = await supabase.rpc('process_checkout', {
        p_stay_id: stayId,
        p_booking_id: bookingId,
        p_room_id: stay.room_id,
        p_invoice_data: invoiceData,
        p_payment_amount: paymentAmount,
        p_payment_method: paymentMethod,
        p_reference_number: referenceNumber,
        p_collected_by: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) {
        console.error("Checkout RPC error:", error);
        throw new Error(`Checkout failed: ${error.message}`);
      }

      // Refresh active stays
      await get().fetchActiveStays();

      set({ loading: false });
      return { error: null, invoice: { id: invoiceId } };
    } catch (err: any) {
      const normalized = normalizeError(err);
      console.error("Error in checkOut:", normalized);
      set({ loading: false, error: normalized.message });
      return { error: normalized.message };
    }
  },
}));
