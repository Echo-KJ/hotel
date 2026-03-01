"use client";

import { useEffect, useState, use } from "react";
import { useInvoiceStore } from "@/store/useInvoiceStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function PrintInvoicePage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const { fetchInvoiceById } = useInvoiceStore();
    const { hotelSettings, fetchHotelSettings } = useSettingsStore();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            await fetchHotelSettings();
            const data = await fetchInvoiceById(params.id);
            setInvoice(data);
            setLoading(false);

            // Auto-print after a short delay to ensure rendering
            setTimeout(() => {
                window.print();
            }, 500);
        };
        init();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-muted-foreground">Preparing invoice...</span>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="flex items-center justify-center h-screen text-red-600 font-medium">
                Invoice not found
            </div>
        );
    }

    const balanceDue = invoice.grand_total - invoice.amount_paid;

    return (
        <div className="min-h-screen bg-white text-black font-sans p-8 md:p-12 print:p-0">
            {/* Print Control (Hidden on print) */}
            <div className="fixed top-4 right-4 print:hidden z-50">
                <Button onClick={() => window.print()} className="shadow-lg">
                    <Printer className="mr-2 h-4 w-4" />
                    Print / Save PDF
                </Button>
            </div>

            {/* Invoice Document Container */}
            <div className="max-w-[210mm] mx-auto bg-white print:max-w-none print:w-full">

                {/* Header Section - Compacted */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
                    {/* Hotel Info */}
                    <div className="w-1/2">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
                            {hotelSettings?.hotel_name || "Hotel Integration"}
                        </h1>
                        <div className="text-xs text-gray-600 leading-relaxed space-y-0.5">
                            <p>{hotelSettings?.address}</p>
                            <p>{hotelSettings?.city} {hotelSettings?.pincode && `- ${hotelSettings.pincode}`}</p>
                            <p>{hotelSettings?.state}</p>
                            <div className="flex gap-4 pt-1">
                                {hotelSettings?.phone && <p><strong>Ph:</strong> {hotelSettings.phone}</p>}
                                {hotelSettings?.email && <p><strong>Email:</strong> {hotelSettings.email}</p>}
                            </div>
                            {hotelSettings?.gstin && <p className="font-medium">GSTIN: {hotelSettings.gstin}</p>}
                        </div>
                    </div>

                    {/* Invoice Meta */}
                    <div className="text-right w-1/2">
                        <h2 className="text-3xl font-black text-gray-200 uppercase tracking-widest mb-2">INVOICE</h2>
                        <div className="text-sm space-y-0.5">
                            <div className="flex justify-end gap-4">
                                <span className="text-gray-500 font-medium">Invoice No:</span>
                                <span className="font-bold text-gray-900">{invoice.invoice_number}</span>
                            </div>
                            <div className="flex justify-end gap-4">
                                <span className="text-gray-500 font-medium">Date:</span>
                                <span className="font-bold text-gray-900">{formatDate(invoice.invoice_date)}</span>
                            </div>
                            <div className="flex justify-end gap-4 mt-1">
                                <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                        invoice.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                    }`}>
                                    {invoice.payment_status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bill To & Booking Info Grid - Compacted */}
                <div className="grid grid-cols-2 gap-8 mb-6">
                    {/* Bill To */}
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bill To</h3>
                        <div className="text-gray-800 font-medium text-base leading-tight mb-1">
                            {invoice.guest?.full_name}
                        </div>
                        <div className="text-xs text-gray-600 leading-snug space-y-0.5">
                            <p>{invoice.guest?.address}</p>
                            <p>{invoice.guest?.city} {invoice.guest?.state}</p>
                            <p>{invoice.guest?.phone}</p>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Booking Details</h3>
                        <div className="grid grid-cols-2 gap-y-1 text-xs">
                            <div className="text-gray-500">Booking Ref:</div>
                            <div className="font-medium text-right">{invoice.booking?.booking_number}</div>

                            <div className="text-gray-500">Room:</div>
                            <div className="font-medium text-right">
                                {invoice.booking?.room?.room_number} <span className="text-gray-400">({invoice.booking?.room_category?.name})</span>
                            </div>

                            <div className="text-gray-500">Check-in:</div>
                            <div className="font-medium text-right">{formatDate(invoice.booking?.check_in_date)}</div>

                            <div className="text-gray-500">Check-out:</div>
                            <div className="font-medium text-right">{formatDate(invoice.booking?.check_out_date)}</div>
                        </div>
                    </div>
                </div>

                {/* Items Table - Compacted */}
                <table className="w-full mb-6 text-xs">
                    <thead>
                        <tr className="border-b-2 border-gray-900">
                            <th className="text-left py-2 font-bold text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="text-right py-2 font-bold text-gray-500 uppercase tracking-wider w-16">Qty</th>
                            <th className="text-right py-2 font-bold text-gray-500 uppercase tracking-wider w-24">Rate</th>
                            <th className="text-right py-2 font-bold text-gray-500 uppercase tracking-wider w-24">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {invoice.items?.map((item: any, index: number) => (
                            <tr key={index}>
                                <td className="py-2 text-gray-900">{item.description}</td>
                                <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                                <td className="py-2 text-right text-gray-600 font-mono">{formatCurrency(item.rate)}</td>
                                <td className="py-2 text-right text-gray-900 font-mono font-medium">{formatCurrency(item.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals Section - Compacted */}
                <div className="flex justify-end mb-6">
                    <div className="w-1/2 lg:w-5/12 space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-medium">Subtotal</span>
                            <span className="font-mono text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                        </div>

                        {invoice.discount > 0 && (
                            <div className="flex justify-between text-xs text-green-600">
                                <span className="font-medium">Discount</span>
                                <span className="font-mono">- {formatCurrency(invoice.discount)}</span>
                            </div>
                        )}

                        {/* Tax Breakdown */}
                        <div className="pt-1 pb-1 border-t border-gray-100 space-y-0.5">
                            <div className="flex justify-between text-[10px] text-gray-500">
                                <span>CGST ({(invoice.cgst_rate * 100).toFixed(0)}%)</span>
                                <span className="font-mono">{formatCurrency(invoice.cgst_amount)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500">
                                <span>SGST ({(invoice.sgst_rate * 100).toFixed(0)}%)</span>
                                <span className="font-mono">{formatCurrency(invoice.sgst_amount)}</span>
                            </div>
                        </div>

                        {/* Grand Total */}
                        <div className="flex justify-between text-base font-bold border-t-2 border-gray-900 pt-2">
                            <span className="text-gray-900">Grand Total</span>
                            <span className="font-mono text-gray-900">{formatCurrency(invoice.grand_total)}</span>
                        </div>

                        {/* Amount Paid */}
                        {invoice.amount_paid > 0 && (
                            <div className="flex justify-between text-xs text-gray-600 pt-1">
                                <span>Amount Paid</span>
                                <span className="font-mono">- {formatCurrency(invoice.amount_paid)}</span>
                            </div>
                        )}

                        {/* Balance Due */}
                        <div className={`mt-2 p-2 rounded border flex justify-between items-center ${balanceDue > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
                            }`}>
                            <span className={`font-bold text-xs ${balanceDue > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                {balanceDue > 0 ? "Balance Due" : "Fully Paid"}
                            </span>
                            <span className={`font-mono font-bold text-sm ${balanceDue > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                {formatCurrency(balanceDue)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer info - Compacted */}
                <div className="border-t border-gray-200 pt-4 mt-auto">
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                            {invoice.terms_conditions && (
                                <>
                                    <h4 className="font-bold text-gray-700 uppercase text-[10px] mb-1">Terms & Conditions</h4>
                                    <p className="whitespace-pre-line text-[10px] leading-tight">{invoice.terms_conditions}</p>
                                </>
                            )}
                        </div>
                        <div className="text-right">
                            <h4 className="font-bold text-gray-700 uppercase text-[10px] mb-1">Payment Details</h4>
                            <p className="text-[10px]">Checks payable to <strong>{hotelSettings?.hotel_name}</strong></p>
                            <p className="text-[10px] mt-0.5">Thank you for your business!</p>
                        </div>
                    </div>

                    <div className="text-center mt-6 text-[8px] text-gray-400 uppercase tracking-widest">
                        System Generated Invoice • {new Date().toLocaleString()}
                    </div>
                </div>

            </div>

            <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 6mm; /* Reduced margin to fit more content */
          }
          body {
            background: white;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          /* Ensure strict hiding of non-print elements */
          .print\\:hidden { opacity: 0; pointer-events: none; display: none !important; }
        }
      `}</style>
        </div>
    );
}
