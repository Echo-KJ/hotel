"use client";

import { formatCurrency } from "@/lib/utils";
import type { PriceBreakdown } from "@/lib/gst";
import { Banknote, CreditCard, Smartphone, Wifi, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentMethod = "cash" | "card" | "online" | "upi" | "bank_transfer";

interface PaymentMethodSelectorProps {
  breakdown: PriceBreakdown | null;
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  advancePaid: number;
  onAdvanceChange: (amount: number) => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: any; desc: string }[] = [
  { id: "cash",          label: "Cash",         icon: Banknote,    desc: "Collect at front desk" },
  { id: "card",          label: "Card",         icon: CreditCard,  desc: "Debit / Credit card" },
  { id: "online",        label: "Online",       icon: Wifi,        desc: "Bank transfer / NEFT" },
  { id: "upi",           label: "UPI",          icon: Smartphone,  desc: "PhonePe / GPay / Paytm" },
];

export function PriceBreakdownCard({ breakdown }: { breakdown: PriceBreakdown | null }) {
  if (!breakdown) return null;

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Price Breakdown</span>
        <span className="text-xs text-muted-foreground bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
          {breakdown.gst_slab_label}
        </span>
      </div>

      <div className="px-4 py-3 space-y-2 text-sm">
        {/* Base */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Room Charges (base)</span>
          <span className="font-medium">{formatCurrency(breakdown.base_amount)}</span>
        </div>

        {/* Discount */}
        {breakdown.discount_amount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>− {formatCurrency(breakdown.discount_amount)}</span>
          </div>
        )}

        {/* Taxable */}
        {breakdown.discount_amount > 0 && (
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground">Taxable Amount</span>
            <span className="font-medium">{formatCurrency(breakdown.taxable_amount)}</span>
          </div>
        )}

        {/* GST */}
        {breakdown.gst_amount > 0 ? (
          <>
            <div className="flex justify-between text-orange-600">
              <span>CGST ({(breakdown.cgst_rate * 100).toFixed(0)}%)</span>
              <span>{formatCurrency(breakdown.cgst_amount)}</span>
            </div>
            <div className="flex justify-between text-orange-600">
              <span>SGST ({(breakdown.sgst_rate * 100).toFixed(0)}%)</span>
              <span>{formatCurrency(breakdown.sgst_amount)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              GST Exempt
            </span>
            <span>₹0.00</span>
          </div>
        )}

        {/* Grand Total */}
        <div className="flex justify-between items-center border-t-2 border-gray-200 pt-3 mt-1">
          <span className="font-bold text-base">Grand Total</span>
          <span className="font-bold text-xl text-gray-900">
            {formatCurrency(breakdown.grand_total)}
          </span>
        </div>

        {/* Advance & Balance */}
        {breakdown.advance_paid > 0 && (
          <>
            <div className="flex justify-between text-blue-600 text-xs">
              <span>Advance Paid</span>
              <span>− {formatCurrency(breakdown.advance_paid)}</span>
            </div>
            <div className={cn(
              "flex justify-between font-semibold text-sm",
              breakdown.balance_due > 0 ? "text-red-600" : "text-green-600"
            )}>
              <span>Balance Due at Check-in</span>
              <span>
                {breakdown.balance_due > 0
                  ? formatCurrency(breakdown.balance_due)
                  : "Fully Paid"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function PaymentMethodSelector({
  breakdown,
  selectedMethod,
  onSelectMethod,
  advancePaid,
  onAdvanceChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Payment method grid */}
      <div className="grid grid-cols-2 gap-3">
        {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelectMethod(id)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border-2 px-4 py-3 text-left transition-all",
              selectedMethod === id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-gray-200 hover:border-gray-300 bg-white"
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", selectedMethod === id ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("font-semibold text-sm", selectedMethod === id ? "text-primary" : "text-gray-800")}>
                {label}
              </span>
              {selectedMethod === id && (
                <span className="ml-auto text-xs bg-primary text-white rounded-full px-1.5 py-0.5">✓</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground pl-6">{desc}</span>
          </button>
        ))}
      </div>

      {/* Advance payment input */}
      <div className="rounded-lg border px-4 py-3 space-y-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Advance Payment Now (₹)
          </label>
          {breakdown && (
            <button
              type="button"
              onClick={() => onAdvanceChange(breakdown.grand_total)}
              className="text-xs text-primary underline underline-offset-2"
            >
              Pay full amount ({formatCurrency(breakdown.grand_total)})
            </button>
          )}
        </div>
        <input
          type="number"
          min="0"
          max={breakdown?.grand_total || 999999}
          step="0.01"
          value={advancePaid || ""}
          onChange={(e) => onAdvanceChange(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {breakdown && advancePaid > 0 && (
          <div className={cn(
            "text-xs font-medium",
            advancePaid >= breakdown.grand_total ? "text-green-600" : "text-orange-600"
          )}>
            {advancePaid >= breakdown.grand_total
              ? "✅ Fully paid — no balance due at check-in"
              : `Balance due at check-in: ${formatCurrency(breakdown.grand_total - advancePaid)}`}
          </div>
        )}
      </div>
    </div>
  );
}
