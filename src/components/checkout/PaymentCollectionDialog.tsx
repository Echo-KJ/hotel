import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface PaymentCollectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    grandTotal: number;
    advancePaid: number;
    roomCharges: number;
    additionalCharges: number;
    taxAmount: number;
    onConfirm: (data: {
        amount: number;
        method: string | null;
        reference: string | null;
        notes: string | null;
    }) => Promise<void>;
    isProcessing: boolean;
}

export function PaymentCollectionDialog({
    open,
    onOpenChange,
    grandTotal,
    advancePaid,
    roomCharges,
    additionalCharges,
    taxAmount,
    onConfirm,
    isProcessing
}: PaymentCollectionDialogProps) {
    const balanceDue = Math.max(0, grandTotal - advancePaid);

    const [amount, setAmount] = useState(balanceDue.toFixed(2));
    const [method, setMethod] = useState("cash");
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");

    const handleConfirm = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 0) return;

        onConfirm({
            amount: numAmount,
            method: numAmount > 0 ? method : null,
            reference: reference || null,
            notes: notes || null
        });
    };

    const handleCollectLater = () => {
        onConfirm({
            amount: 0,
            method: null,
            reference: null,
            notes: "Payment collected later/marked pending"
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Confirm Checkout & Payment</DialogTitle>
                    <DialogDescription>
                        Review charges and record final payment.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Summary Section */}
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Room Charges</span>
                            <span>{formatCurrency(roomCharges)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Additional Charges</span>
                            <span>{formatCurrency(additionalCharges)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Tax (GST)</span>
                            <span>{formatCurrency(taxAmount)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Grand Total</span>
                            <span>{formatCurrency(grandTotal)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                            <span>Advance Paid</span>
                            <span>- {formatCurrency(advancePaid)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-lg font-bold border-b pb-4">
                        <span>Balance Due</span>
                        <span className={balanceDue > 0 ? "text-red-600" : "text-green-600"}>
                            {formatCurrency(balanceDue)}
                        </span>
                    </div>

                    {/* Payment Input Section */}
                    <div className="space-y-3 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount Collecting Now</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="method">Payment Method</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reference">Reference / Transaction ID <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
                            <Input
                                id="reference"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="e.g. UPI Ref, Auth Code"
                            />
                            {['card', 'upi', 'online'].includes(method) && (
                                <p className="text-xs text-muted-foreground">Recommended for digital payments</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
                            <Input
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Paid by corporate card"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:gap-0">
                    <div className="flex justify-between w-full items-center">
                        <Button variant="link" className="text-xs text-muted-foreground p-0 h-auto" onClick={handleCollectLater}>
                            Guest Will Pay Later (Mark Pending)
                        </Button>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirm} disabled={isProcessing}>
                                {isProcessing ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    "Confirm & Record"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
