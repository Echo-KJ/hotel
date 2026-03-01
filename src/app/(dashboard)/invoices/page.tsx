"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInvoiceStore } from "@/store/useInvoiceStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Eye } from "lucide-react";

export default function InvoicesPage() {
    const router = useRouter();
    const { invoices, loading, fetchInvoices } = useInvoiceStore();

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    if (loading && invoices.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                <p className="text-muted-foreground mt-1">
                    All generated invoices ({invoices.length})
                </p>
            </div>

            {/* Invoices List */}
            {invoices.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No invoices yet"
                    description="Invoices will be generated automatically when guests check out"
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {invoices.map((invoice) => {
                        const balanceDue = invoice.grand_total - invoice.amount_paid;

                        return (
                            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">
                                                {invoice.invoice_number}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {invoice.guest?.full_name}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                invoice.payment_status === "paid"
                                                    ? "default"
                                                    : invoice.payment_status === "partial"
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                        >
                                            {invoice.payment_status === "paid"
                                                ? "Paid"
                                                : invoice.payment_status === "partial"
                                                    ? "Partial"
                                                    : "Pending"}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Invoice Date</span>
                                            <span className="font-medium">
                                                {formatDate(invoice.invoice_date)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Grand Total</span>
                                            <span className="font-semibold">
                                                {formatCurrency(invoice.grand_total)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Amount Paid</span>
                                            <span className="text-green-600">
                                                {formatCurrency(invoice.amount_paid)}
                                            </span>
                                        </div>

                                        {balanceDue > 0 && (
                                            <div className="flex justify-between pt-2 border-t">
                                                <span className="font-medium">Balance Due</span>
                                                <span className="font-bold text-red-600">
                                                    {formatCurrency(balanceDue)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full mt-2"
                                        onClick={() => router.push(`/invoices/${invoice.id}`)}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Invoice
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
