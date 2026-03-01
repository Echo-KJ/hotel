import { formatCurrency, formatDate } from "@/lib/utils";
import { useFolio } from "@/hooks/useFolio";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FolioViewProps {
    bookingId: string;
}

export function FolioView({ bookingId }: FolioViewProps) {
    const { folio, charges, payments, loading, error } = useFolio(bookingId);

    if (loading) {
        return <LoadingSpinner size="lg" className="mx-auto" />;
    }

    if (error || !folio) {
        return <div className="text-red-500">Failed to load folio details.</div>;
    }

    // Calculate taxes on the fly if not in folio (folio view has COALESCE(cgst_amount,0))
    // But let's assume folio view is correct.
    // We need to show line items.
    // Room Charge Line Item
    const roomChargeItem = {
        date: folio.check_in_date,
        description: `Room ${folio.room_number || 'N/A'} - Charges`,
        type: "Room",
        quantity: 1, // Or nights
        amount: folio.room_charges,
        is_taxable: true
    };

    return (
        <div className="space-y-6">
            {/* Balance Summary Banner */}
            <div className={`p-4 rounded-lg flex justify-between items-center text-lg font-bold ${folio.balance_due > 0 ? "bg-red-50 text-red-900 border border-red-200" :
                    folio.balance_due < 0 ? "bg-orange-50 text-orange-900 border border-orange-200" :
                        "bg-green-50 text-green-900 border border-green-200"
                }`}>
                <span>Balance Due</span>
                <span>
                    {folio.balance_due < 0 ? `Credit (Refund Due): ${formatCurrency(Math.abs(folio.balance_due))}` : formatCurrency(folio.balance_due)}
                </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Section A: Charges (Owed) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Charges (Guest Owes)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Date</th>
                                    <th className="text-left py-2">Desc</th>
                                    <th className="text-right py-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Room Charges */}
                                <tr className="border-b border-gray-100">
                                    <td className="py-2">{formatDate(roomChargeItem.date)}</td>
                                    <td className="py-2 font-medium">{roomChargeItem.description}</td>
                                    <td className="py-2 text-right">{formatCurrency(roomChargeItem.amount)}</td>
                                </tr>
                                {/* Additional Charges */}
                                {charges.map((charge) => (
                                    <tr key={charge.id} className="border-b border-gray-100">
                                        <td className="py-2">{formatDate(charge.created_at || charge.charge_date)}</td>
                                        <td className="py-2">
                                            {charge.description}
                                            {charge.is_void && <span className="ml-2 text-xs text-red-500 font-bold">[VOID]</span>}
                                        </td>
                                        <td className={`py-2 text-right ${charge.is_void ? "line-through text-muted-foreground" : ""}`}>
                                            {formatCurrency(charge.total_amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="font-bold border-t-2">
                                <tr>
                                    <td colSpan={2} className="py-2 text-right">Subtotal</td>
                                    <td className="py-2 text-right">{formatCurrency(folio.subtotal)}</td>
                                </tr>
                                {(folio.cgst > 0 || folio.sgst > 0) && (
                                    <>
                                        <tr>
                                            <td colSpan={2} className="py-1 text-right text-muted-foreground text-xs">CGST</td>
                                            <td className="py-1 text-right text-muted-foreground text-xs">{formatCurrency(folio.cgst)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={2} className="py-1 text-right text-muted-foreground text-xs">SGST</td>
                                            <td className="py-1 text-right text-muted-foreground text-xs">{formatCurrency(folio.sgst)}</td>
                                        </tr>
                                    </>
                                )}
                                <tr>
                                    <td colSpan={2} className="py-2 text-right text-lg">Grand Total</td>
                                    <td className="py-2 text-right text-lg">{formatCurrency(folio.grand_total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </CardContent>
                </Card>

                {/* Section B: Payments (Paid) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payments (Collected)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Date</th>
                                    <th className="text-left py-2">Access</th>
                                    <th className="text-right py-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">No payments recorded</td></tr>
                                ) : (
                                    payments.map((payment) => (
                                        <tr key={payment.id} className="border-b border-gray-100">
                                            <td className="py-2">{formatDate(payment.collected_at)}</td>
                                            <td className="py-2">
                                                <span className="capitalize block">{payment.payment_type}</span>
                                                <span className="text-xs text-muted-foreground capitalize">{payment.payment_method}</span>
                                                {payment.reference_number && <span className="text-xs text-muted-foreground block">Ref: {payment.reference_number}</span>}
                                            </td>
                                            <td className={`py-2 text-right font-medium ${payment.payment_type === 'refund' ? 'text-red-500' : 'text-green-600'}`}>
                                                {payment.payment_type === 'refund' ? '-' : '+'} {formatCurrency(Math.abs(payment.amount))}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="font-bold border-t-2">
                                <tr>
                                    <td colSpan={2} className="py-2 text-right">Total Paid</td>
                                    <td className="py-2 text-right text-green-700">{formatCurrency(folio.total_paid)}</td>
                                </tr>
                                {folio.total_refunded > 0 && (
                                    <tr>
                                        <td colSpan={2} className="py-1 text-right text-red-600">Total Refunded</td>
                                        <td className="py-1 text-right text-red-600">-{formatCurrency(folio.total_refunded)}</td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
