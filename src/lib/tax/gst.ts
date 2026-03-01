// src/lib/tax/gst.ts
// Indian Hotel GST Slabs — per Notification No. 11/2017-CT(R) as amended
// Last reviewed: 2024
// DO NOT hardcode GST rates anywhere else in the codebase. Import from here.

export const GST_SLABS = [
    { maxRatePerNight: 1000, cgstRate: 0, sgstRate: 0 },  // 0%
    { maxRatePerNight: 7500, cgstRate: 0.06, sgstRate: 0.06 },  // 12%
    { maxRatePerNight: Infinity, cgstRate: 0.09, sgstRate: 0.09 }, // 18%
] as const;

export interface GSTRates {
    cgstRate: number;
    sgstRate: number;
    totalRate: number;
    slabLabel: string;
}

export interface GSTAmounts {
    baseAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    gstAmount: number;
    grandTotal: number;
    rates: GSTRates;
}

export interface PriceBreakdown {
    base_amount: number;
    discount_amount: number;
    taxable_amount: number;
    cgst_rate: number;
    sgst_rate: number;
    cgst_amount: number;
    sgst_amount: number;
    gst_amount: number;
    grand_total: number;
    advance_paid: number;
    balance_due: number;
}

/**
 * Returns the applicable GST rates for a given room rate per night.
 * Uses the room tariff (rate per night) to determine slab, NOT the total stay amount.
 */
export function getGSTRates(ratePerNight: number): GSTRates {
    if (ratePerNight < 0) throw new Error('Rate per night cannot be negative');

    for (const slab of GST_SLABS) {
        if (ratePerNight <= slab.maxRatePerNight) {
            const total = slab.cgstRate + slab.sgstRate;
            const pct = Math.round(total * 100);
            return {
                cgstRate: slab.cgstRate,
                sgstRate: slab.sgstRate,
                totalRate: total,
                slabLabel: pct === 0 ? '0%' : `${pct}% (CGST ${pct / 2}% + SGST ${pct / 2}%)`,
            };
        }
    }

    // Fallback — should never reach here due to Infinity slab
    throw new Error('Could not determine GST slab for rate: ' + ratePerNight);
}

/**
 * Calculates GST amounts for a given base amount and room rate per night.
 * baseAmount: pre-tax subtotal (room charges + additional charges)
 * ratePerNight: used ONLY to determine which slab applies
 */
export function calculateGST(baseAmount: number, ratePerNight: number): GSTAmounts {
    if (baseAmount < 0) throw new Error('Base amount cannot be negative');

    const rates = getGSTRates(ratePerNight);
    const cgstAmount = parseFloat((baseAmount * rates.cgstRate).toFixed(2));
    const sgstAmount = parseFloat((baseAmount * rates.sgstRate).toFixed(2));
    const gstAmount = parseFloat((cgstAmount + sgstAmount).toFixed(2));
    const grandTotal = parseFloat((baseAmount + gstAmount).toFixed(2));

    return { baseAmount, cgstAmount, sgstAmount, gstAmount, grandTotal, rates };
}

/**
 * Recalculates GST for display purposes when only the grand total is known.
 * Used for backfill and legacy data display.
 * Assumes grand total is tax-INCLUSIVE.
 */
export function extractGSTFromGrandTotal(grandTotal: number, ratePerNight: number): GSTAmounts {
    const rates = getGSTRates(ratePerNight);
    const divisor = 1 + rates.totalRate;
    const baseAmount = parseFloat((grandTotal / divisor).toFixed(2));
    return calculateGST(baseAmount, ratePerNight);
}

/**
 * Calculates full price breakdown including GST, discounts, and advance payments.
 */
export function calculatePriceBreakdown(
    roomRate: number,
    nights: number,
    discount: number = 0,
    advance: number = 0
): PriceBreakdown {
    const baseTotal = roomRate * nights;
    const taxableAmount = Math.max(0, baseTotal - discount);

    const gstData = calculateGST(taxableAmount, roomRate);

    return {
        base_amount: baseTotal,
        discount_amount: discount,
        taxable_amount: taxableAmount,
        cgst_rate: gstData.rates.cgstRate,
        sgst_rate: gstData.rates.sgstRate,
        cgst_amount: gstData.cgstAmount,
        sgst_amount: gstData.sgstAmount,
        gst_amount: gstData.gstAmount,
        grand_total: gstData.grandTotal,
        advance_paid: advance,
        balance_due: Math.max(0, gstData.grandTotal - advance)
    };
}
