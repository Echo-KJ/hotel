"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useInvoiceStore } from "@/store/useInvoiceStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Printer, Download } from "lucide-react";
import Link from "next/link";
import { usePaymentStore } from "@/store/usePaymentStore";
import { PaymentCollectionDialog } from "@/components/checkout/PaymentCollectionDialog";
import { formatDateTime } from "@/lib/utils";

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { fetchInvoiceById } = useInvoiceStore();
  const { getPaymentsForBooking, recordPayment } = usePaymentStore();
  const { hotelSettings, fetchHotelSettings } = useSettingsStore();
  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    await fetchHotelSettings();
    const data = await fetchInvoiceById(id);
    setInvoice(data);
    if (data && data.booking_id) {
      const paymentData = await getPaymentsForBooking(data.booking_id);
      setPayments(paymentData);
    }
    setLoading(false);
  };

  const handleCollectPayment = async (data: { amount: number; method: string | null; reference: string | null; notes: string | null }) => {
    if (!invoice) return;
    setIsProcessingPayment(true);
    try {
      await recordPayment({
        bookingId: invoice.booking_id,
        invoiceId: invoice.id,
        paymentType: 'balance',
        amount: data.amount,
        paymentMethod: data.method as any,
        referenceNumber: data.reference ?? undefined,
        notes: data.notes ?? undefined
      });
      // Reload data to reflect changes
      await loadData();
      setShowPaymentDialog(false);
    } catch (error) {
      console.error("Payment recording failed", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  const balanceDue = invoice.grand_total - invoice.amount_paid;

  return (
    <>
      {/* Action Bar - Hidden when printing */}
      <div className="mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex gap-2">
            {balanceDue > 0 && (
              <Button onClick={() => setShowPaymentDialog(true)} className="bg-green-600 hover:bg-green-700 text-white">
                Collect Payment
              </Button>
            )}
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg print:shadow-none print:p-0">
        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {hotelSettings?.hotel_name || "Hotel"}
              </h1>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>{hotelSettings?.address}</p>
                <p>
                  {hotelSettings?.city && `${hotelSettings.city}, `}
                  {hotelSettings?.state} {hotelSettings?.pincode}
                </p>
                {hotelSettings?.phone && <p>Phone: {hotelSettings.phone}</p>}
                {hotelSettings?.email && <p>Email: {hotelSettings.email}</p>}
                {(invoice.hotel_gstin || hotelSettings?.gstin) ? (
                  <p className="font-semibold mt-1">GSTIN: {invoice.hotel_gstin || hotelSettings.gstin}</p>
                ) : (
                  <p className="text-red-600 font-bold mt-1">GSTIN NOT CONFIGURED — Invoice not GST compliant</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
              <p className="text-sm text-gray-600 mt-2">
                {invoice.invoice_number}
              </p>
              <p className="text-sm text-gray-600">
                Date: {formatDate(invoice.invoice_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">BILL TO:</h3>
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-base">{invoice.guest?.full_name}</p>
            {invoice.guest?.phone && <p>Phone: {invoice.guest.phone}</p>}
            {invoice.guest?.email && <p>Email: {invoice.guest.email}</p>}
            {invoice.guest?.address && <p className="mt-1">{invoice.guest.address}</p>}
            {invoice.guest?.city && (
              <p>
                {invoice.guest.city}
                {invoice.guest?.state && `, ${invoice.guest.state}`}
                {invoice.guest.pincode && ` - ${invoice.guest.pincode}`}
              </p>
            )}
            {invoice.guest?.gstin && <p className="mt-1 font-medium">GSTIN: {invoice.guest.gstin}</p>}
          </div>
        </div>

        {/* Booking Details */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Booking Number</p>
            <p className="font-semibold">{invoice.booking?.booking_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Room</p>
            <p className="font-semibold">
              {invoice.booking?.room?.room_number} - {invoice.booking?.room_category?.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Check-in Date</p>
            <p className="font-semibold">{formatDate(invoice.booking?.check_in_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Check-out Date</p>
            <p className="font-semibold">{formatDate(invoice.booking?.check_out_date)}</p>
          </div>
        </div>

        {/* Invoice Items */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="text-left py-3 text-sm font-semibold text-gray-900">
                Description
              </th>
              <th className="text-center py-3 text-sm font-semibold text-gray-900">
                SAC Code
              </th>
              <th className="text-right py-3 text-sm font-semibold text-gray-900">
                Qty
              </th>
              <th className="text-right py-3 text-sm font-semibold text-gray-900">
                Rate
              </th>
              <th className="text-right py-3 text-sm font-semibold text-gray-900">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any, index: number) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 text-sm text-gray-700">{item.description}</td>
                <td className="py-3 text-sm text-center text-gray-600 font-mono">{item.hsn_sac || "—"}</td>
                <td className="py-3 text-sm text-right text-gray-700">{item.quantity}</td>
                <td className="py-3 text-sm text-right text-gray-700">
                  {formatCurrency(item.rate)}
                </td>
                <td className="py-3 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>

            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-green-600">
                  - {formatCurrency(invoice.discount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                CGST ({(invoice.tax_cgst_rate ? invoice.tax_cgst_rate * 100 : invoice.cgst_rate * 100).toFixed(0)}%):
              </span>
              <span className="font-medium text-gray-900">
                {formatCurrency(invoice.cgst_amount)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                SGST ({(invoice.tax_sgst_rate ? invoice.tax_sgst_rate * 100 : invoice.sgst_rate * 100).toFixed(0)}%):
              </span>
              <span className="font-medium text-gray-900">
                {formatCurrency(invoice.sgst_amount)}
              </span>
            </div>

            {invoice.igst_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  IGST ({(invoice.igst_rate * 100).toFixed(0)}%):
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoice.igst_amount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-600">Total Tax:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(invoice.total_tax)}
              </span>
            </div>

            <div className="flex justify-between text-lg font-bold border-t-2 border-gray-900 pt-2">
              <span>Grand Total:</span>
              <span>{formatCurrency(invoice.grand_total)}</span>
            </div>

            {invoice.amount_paid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium text-green-600">
                  - {formatCurrency(invoice.amount_paid)}
                </span>
              </div>
            )}

            {balanceDue > 0 && (
              <div className="flex justify-between text-lg font-bold text-red-600 border-t pt-2">
                <span>Balance Due:</span>
                <span>{formatCurrency(balanceDue)}</span>
              </div>
            )}

            {balanceDue === 0 && (
              <div className="flex justify-between text-lg font-bold text-green-600 border-t pt-2">
                <span>PAID IN FULL</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 space-y-4">
          {invoice.notes && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Notes:</p>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {invoice.terms_conditions && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Terms & Conditions:</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {invoice.terms_conditions}
              </p>
            </div>
          )}

          <div className="text-center pt-8 border-t border-dashed mt-4">
            <p className="text-xs text-gray-500 mb-2">
              This is a computer-generated invoice. Tax Invoice under GST.
            </p>
            <p className="text-sm text-gray-500">
              Thank you for your business!
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </>
  );
}

