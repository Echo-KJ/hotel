"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveStayStore } from "@/store/useActiveStayStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { calculateGST } from "@/lib/tax/gst";
import { ArrowLeft, Plus, Trash2, LogOut, User, Calendar, Bed, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FolioView } from "@/components/folio/FolioView";
import { PaymentCollectionDialog } from "@/components/checkout/PaymentCollectionDialog";

const CHARGE_TYPES = [
  { value: "food", label: "Food & Beverage" },
  { value: "laundry", label: "Laundry" },
  { value: "minibar", label: "Mini Bar" },
  { value: "room_service", label: "Room Service" },
  { value: "spa", label: "Spa" },
  { value: "other", label: "Other" },
];

export default function ActiveStayDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { fetchStayById, addCharge, deleteCharge, voidCharge, checkOut } = useActiveStayStore();
  const [stay, setStay] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddChargeDialog, setShowAddChargeDialog] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [chargeToVoid, setChargeToVoid] = useState<any>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Charge form state
  const [chargeType, setChargeType] = useState("food");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");

  // Payment Collection State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    loadStay();
  }, [id]);

  const loadStay = async () => {
    setLoading(true);
    const data = await fetchStayById(id);
    setStay(data);
    setLoading(false);
  };

  // Update payment amount when stay loads
  useEffect(() => {
    if (stay) {
      const chargesTotal = stay.charges?.reduce((sum: number, c: any) => sum + (c.total_amount || 0), 0) || 0;
      const roomTotal = stay.booking?.final_amount || 0;
      const sub = roomTotal + chargesTotal;
      const gstData = calculateGST(sub, stay.booking?.room_rate || 0);
      const total = gstData.grandTotal;
      const due = total - (stay.booking?.advance_paid || 0);
      setPaymentAmount(due > 0 ? due.toFixed(2) : "0");
    }
  }, [stay]);

  const handleAddCharge = async () => {
    if (!description || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);
    const { error } = await addCharge({
      stay_id: stay.id,
      booking_id: stay.booking_id,
      charge_type: chargeType as any,
      description,
      amount: parseFloat(amount),
      quantity: parseInt(quantity),
      is_taxable: true,
      charge_date: new Date().toISOString(),
    });

    if (error) {
      toast.error("Failed to add charge");
    } else {
      toast.success("Charge added successfully");
      setShowAddChargeDialog(false);
      setDescription("");
      setAmount("");
      setQuantity("1");
      loadStay();
      setRefreshKey(prev => prev + 1);
    }
    setIsProcessing(false);
  };

  const handleDeleteCharge = async (chargeId: string) => {
    if (!confirm("Delete this charge?")) return;

    const { error } = await deleteCharge(chargeId);
    if (error) {
      toast.error(error.message || "Failed to delete charge");
    } else {
      toast.success("Charge deleted successfully");
      loadStay();
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleVoidClick = (charge: any) => {
    setChargeToVoid(charge);
    setVoidReason("");
    setShowVoidDialog(true);
  };

  const handleConfirmVoid = async () => {
    if (!chargeToVoid || !voidReason) {
      toast.error("Please provide a reason for voiding.");
      return;
    }
    setIsProcessing(true);
    const { error } = await voidCharge(chargeToVoid.id, voidReason);
    if (error) {
      toast.error(error.message || "Failed to void charge");
    } else {
      toast.success("Charge voided successfully");
      setShowVoidDialog(false);
      setChargeToVoid(null);
      loadStay();
      setRefreshKey(prev => prev + 1);
    }
    setIsProcessing(false);
  };

  const handleCheckOut = async (data: { amount: number; method: string | null; reference: string | null; notes: string | null }) => {
    setIsProcessing(true);

    const { error, invoice } = await checkOut(
      stay.id,
      stay.booking_id,
      data.amount,
      data.method,
      data.reference,
      data.notes
    );

    if (error) {
      toast.error("Failed to check out guest");
      setIsProcessing(false);
    } else {
      toast.success("Guest checked out successfully");
      setShowCheckoutDialog(false);
      // Navigate to invoice
      if (invoice) {
        router.push(`/invoices/${invoice.id}`);
      } else {
        router.push("/active-stays");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stay) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/active-stays">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stay Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  const chargesTotal = stay.charges?.reduce((sum: number, c: any) => sum + (c.total_amount || 0), 0) || 0;
  const roomTotal = stay.booking?.final_amount || 0;
  const subtotal = roomTotal + chargesTotal;
  const gstData = calculateGST(subtotal, stay.booking?.room_rate || 0);
  const gstAmount = gstData.gstAmount;
  const grandTotal = gstData.grandTotal;
  const advancePaid = stay.booking?.advance_paid || 0;
  const balanceDue = grandTotal - advancePaid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/active-stays">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Room {stay.room?.room_number}
            </h1>
            <p className="text-muted-foreground mt-1">{stay.guest?.full_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddChargeDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Charge
          </Button>
          <Button onClick={() => setShowCheckoutDialog(true)} variant="default">
            <LogOut className="mr-2 h-4 w-4" />
            Check Out
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Guest Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Guest Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium text-lg">{stay.guest?.full_name}</p>
            </div>
            {stay.guest?.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{stay.guest.phone}</p>
              </div>
            )}
            {stay.guest?.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{stay.guest.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stay Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Stay Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Check-in</p>
              <p className="font-medium">{formatDateTime(stay.actual_check_in_time || stay.check_in_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected Check-out</p>
              <p className="font-medium">{formatDate(stay.check_out_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{stay.booking?.nights || 0} nights</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charges */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Charges</CardTitle>
          <CardDescription>Food, beverages, and other services</CardDescription>
        </CardHeader>
        <CardContent>
          {!stay.charges || stay.charges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No additional charges yet
            </p>
          ) : (
            <div className="space-y-2">
              {stay.charges.map((charge: any) => (
                <div
                  key={charge.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{charge.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {charge.quantity} × {formatCurrency(charge.amount)} • {formatDate(charge.charge_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${charge.is_void ? "line-through text-muted-foreground" : ""}`}>
                      {formatCurrency(charge.total_amount)}
                    </span>
                    {!charge.is_void && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-orange-600 h-8 px-2"
                          onClick={() => handleVoidClick(charge)}
                        >
                          Void
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => handleDeleteCharge(charge.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {charge.is_void && <span className="text-xs text-red-500 font-medium px-2">VOIDED</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Void Dialog */}
      <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Charge</DialogTitle>
            <DialogDescription>
              Are you sure you want to void this charge? This action cannot be undone and will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="voidReason">Reason for Voiding *</Label>
            <Textarea
              id="voidReason"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Added by mistake, guest complaint..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoidDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmVoid} disabled={isProcessing}>
              {isProcessing ? "Voiding..." : "Confirm Void"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folio View (Replaces Bill Summary) */}
      <FolioView key={refreshKey} bookingId={stay.booking_id} />

      {/* Add Charge Dialog */}
      <Dialog open={showAddChargeDialog} onOpenChange={setShowAddChargeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Charge</DialogTitle>
            <DialogDescription>Add a new charge to this stay</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="charge_type">Type</Label>
              <Select value={chargeType} onValueChange={setChargeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHARGE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Breakfast, Laundry service"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            {amount && quantity && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(parseFloat(amount) * parseInt(quantity))}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddChargeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCharge} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Adding...
                </>
              ) : (
                "Add Charge"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      {showCheckoutDialog && (
        <PaymentCollectionDialog
          open={showCheckoutDialog}
          onOpenChange={setShowCheckoutDialog}
          grandTotal={grandTotal}
          advancePaid={advancePaid}
          roomCharges={roomTotal}
          additionalCharges={chargesTotal}
          taxAmount={gstAmount}
          onConfirm={handleCheckOut}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
