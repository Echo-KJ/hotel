"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBookingStore } from "@/store/useBookingStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { bookingSchema, type BookingFormData } from "@/lib/validations/booking";
import { calculatePriceBreakdown, type PriceBreakdown } from "@/lib/tax/gst";
import { calculateNights, formatCurrency } from "@/lib/utils";
import { BOOKING_SOURCES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GuestSearch } from "@/components/bookings/GuestSearch";
import { PriceBreakdownCard, PaymentMethodSelector } from "@/components/bookings/PaymentMethodSelector";
import type { PaymentMethod } from "@/components/bookings/PaymentMethodSelector";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import { ArrowLeft, Save, Calendar, Bed, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { Guest } from "@/types";

type Step = 1 | 2 | 3;
const STEPS = [
  { n: 1, label: "Guest & Dates" },
  { n: 2, label: "Price & Payment" },
  { n: 3, label: "Confirm" },
];

export default function NewBookingPage() {
  const router = useRouter();
  const { createBooking, checkRoomAvailability } = useBookingStore();
  const { roomCategories, fetchRoomCategories } = useSettingsStore();

  const [step, setStep] = useState<Step>(1);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [advancePaid, setAdvancePaid] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, setValue, watch, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { adults: 1, children: 0, discount_amount: 0, advance_paid: 0, source: "direct" },
  });

  const checkInDate = watch("check_in_date");
  const checkOutDate = watch("check_out_date");
  const categoryId = watch("room_category_id");
  const roomRate = watch("room_rate");
  const discountAmount = watch("discount_amount") || 0;
  const nights = checkInDate && checkOutDate ? calculateNights(checkInDate, checkOutDate) : 0;

  useEffect(() => { if (!roomCategories.length) fetchRoomCategories(); }, []);

  // Recalculate breakdown whenever pricing values change
  useEffect(() => {
    if (nights > 0 && Number(roomRate) > 0) {
      const bd = calculatePriceBreakdown(Number(roomRate), nights, Number(discountAmount), advancePaid);
      setBreakdown(bd);
      setValue("total_amount", bd.taxable_amount);
    } else {
      setBreakdown(null);
    }
  }, [nights, roomRate, discountAmount, advancePaid]);

  useEffect(() => { setValue("advance_paid", advancePaid); }, [advancePaid]);

  const checkAvailability = useCallback(async () => {
    if (!checkInDate || !checkOutDate || !categoryId || nights <= 0) return;
    setCheckingAvailability(true);
    const { available, rooms } = await checkRoomAvailability(categoryId, checkInDate, checkOutDate);
    setAvailableRooms(rooms);
    setCheckingAvailability(false);
    if (!available) toast.error("No rooms available for selected dates");
  }, [checkInDate, checkOutDate, categoryId, nights]);

  useEffect(() => { checkAvailability(); }, [checkInDate, checkOutDate, categoryId]);

  const canProceedToStep2 =
    !!selectedGuest && !!checkInDate && !!checkOutDate &&
    nights > 0 && !!categoryId &&
    availableRooms.length > 0 && !checkingAvailability;

  const canProceedToStep3 = canProceedToStep2 && breakdown !== null;

  const onConfirm = async () => {
    if (!selectedGuest || !breakdown || availableRooms.length === 0) return;
    setIsSubmitting(true);

    const assignedRoom = availableRooms[0];
    const paymentStatus =
      advancePaid >= breakdown.grand_total ? "paid" :
        advancePaid > 0 ? "partial" : "pending";

    const { error } = await createBooking({
      guest_id: selectedGuest.id,
      room_id: assignedRoom.id,
      room_category_id: categoryId,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      nights,
      adults: watch("adults"),
      children: watch("children"),
      room_rate: Number(roomRate),
      base_amount: breakdown.base_amount,
      discount_amount: breakdown.discount_amount,
      total_amount: breakdown.taxable_amount,
      cgst_rate: breakdown.cgst_rate,
      sgst_rate: breakdown.sgst_rate,
      cgst_amount: breakdown.cgst_amount,
      sgst_amount: breakdown.sgst_amount,
      gst_amount: breakdown.gst_amount,
      grand_total: breakdown.grand_total,
      final_amount: breakdown.grand_total,
      payment_method: paymentMethod,
      advance_paid: advancePaid,
      payment_status: paymentStatus,
      source: watch("source"),
      special_requests: watch("special_requests"),
      status: "confirmed",
    } as any);

    if (error) {
      console.error("Booking creation error:", error);
      toast.error(`Failed to create booking: ${error.message || 'Unknown error'}`);
      setIsSubmitting(false);
    } else {
      toast.success("Booking confirmed!");
      router.push("/bookings");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bookings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Booking</h1>
          <p className="text-muted-foreground mt-1">GST calculated automatically • Payment method recorded</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${step === s.n ? "bg-primary text-white shadow-md" :
              step > s.n ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-400"
              }`}>
              {step > s.n
                ? <CheckCircle2 className="h-4 w-4" />
                : <span className="font-bold">{s.n}</span>
              }
              <span>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 mx-1 transition-colors ${step > s.n ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ─────────── STEP 1 ─────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Guest</CardTitle></CardHeader>
            <CardContent>
              <GuestSearch onSelectGuest={setSelectedGuest} selectedGuest={selectedGuest} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dates & Room Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Check-in *</Label>
                  <Input type="date" {...register("check_in_date")} min={new Date().toISOString().split("T")[0]} />
                  {errors.check_in_date && <p className="text-sm text-red-600">{errors.check_in_date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Check-out *</Label>
                  <Input type="date" {...register("check_out_date")} min={checkInDate || new Date().toISOString().split("T")[0]} />
                  {errors.check_out_date && <p className="text-sm text-red-600">{errors.check_out_date.message}</p>}
                </div>
              </div>

              {nights > 0 && (
                <div className="px-3 py-2 bg-blue-50 text-blue-800 text-sm rounded-lg font-medium">
                  {nights} {nights === 1 ? "night" : "nights"}
                </div>
              )}

              <div className="space-y-2">
                <Label>Room Category *</Label>
                <Select onValueChange={(v) => {
                  setValue("room_category_id", v);
                  const cat = roomCategories.find((c) => c.id === v);
                  if (cat) setValue("room_rate", cat.base_price);
                }}>
                  <SelectTrigger><SelectValue placeholder="Select room type" /></SelectTrigger>
                  <SelectContent>
                    {roomCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — {formatCurrency(c.base_price)}/night
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {checkingAvailability && (
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                  <LoadingSpinner size="sm" /> Checking availability…
                </div>
              )}
              {!checkingAvailability && availableRooms.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg font-medium">
                  <Bed className="h-4 w-4" />
                  {availableRooms.length} room(s) available — Room {availableRooms[0].room_number} will be assigned
                </div>
              )}
              {!checkingAvailability && categoryId && nights > 0 && availableRooms.length === 0 && (
                <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                  ❌ No rooms available for these dates
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Adults *</Label>
                  <Input type="number" min="1" {...register("adults")} />
                </div>
                <div className="space-y-2">
                  <Label>Children</Label>
                  <Input type="number" min="0" {...register("children")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Special Requests</Label>
                <Textarea {...register("special_requests")} rows={2} placeholder="Early check-in, high floor…" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!canProceedToStep2} className="min-w-40">
              Next: Price & Payment →
            </Button>
          </div>
        </div>
      )}

      {/* ─────────── STEP 2 ─────────── */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rate & GST</CardTitle>
              <CardDescription>
                GST is automatically calculated based on room rate per night (India slab rates).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rate per Night (₹) *</Label>
                  <Input type="number" step="0.01" {...register("room_rate")} />
                </div>
                <div className="space-y-2">
                  <Label>Discount (₹)</Label>
                  <Input type="number" step="0.01" {...register("discount_amount")} defaultValue="0" />
                </div>
              </div>

              <PriceBreakdownCard breakdown={breakdown} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method & Advance</CardTitle>
              <CardDescription>
                The payment method is recorded on the invoice and daily report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentMethodSelector
                breakdown={breakdown}
                selectedMethod={paymentMethod}
                onSelectMethod={setPaymentMethod}
                advancePaid={advancePaid}
                onAdvanceChange={setAdvancePaid}
              />
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label>Booking Source</Label>
            <Select defaultValue="direct" onValueChange={(v: any) => setValue("source", v)}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(BOOKING_SOURCES).map(([k, v]) => (
                  <SelectItem key={v} value={v}>
                    {v.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
            <Button onClick={() => setStep(3)} disabled={!canProceedToStep3}>
              Review & Confirm →
            </Button>
          </div>
        </div>
      )}

      {/* ─────────── STEP 3 ─────────── */}
      {step === 3 && breakdown && selectedGuest && (
        <div className="space-y-6">
          <Card className="border-green-200">
            <CardHeader className="bg-green-50 rounded-t-lg">
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Confirm Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guest</span>
                <span className="font-semibold">{selectedGuest.full_name} · {selectedGuest.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room</span>
                <span className="font-semibold">
                  Room {availableRooms[0]?.room_number} ·{" "}
                  {roomCategories.find((c) => c.id === categoryId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dates</span>
                <span className="font-semibold">
                  {checkInDate} → {checkOutDate} ({nights} {nights === 1 ? "night" : "nights"})
                </span>
              </div>

              <div className="border-t pt-4">
                <PriceBreakdownCard breakdown={breakdown} />
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-semibold capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Advance Collected Now</span>
                  <span className="font-semibold text-green-700">{formatCurrency(advancePaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Balance Due at Check-in</span>
                  <span className={breakdown.balance_due > 0 ? "text-red-600" : "text-green-600"}>
                    {breakdown.balance_due > 0 ? formatCurrency(breakdown.balance_due) : "Fully Paid ✅"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>← Edit Payment</Button>
            <Button onClick={onConfirm} disabled={isSubmitting} size="lg" className="min-w-44">
              {isSubmitting
                ? <><LoadingSpinner size="sm" className="mr-2" />Confirming…</>
                : <><Save className="mr-2 h-4 w-4" />Confirm Booking</>
              }
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
