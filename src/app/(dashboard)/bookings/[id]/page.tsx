"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/store/useBookingStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Bed,
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { fetchBookingById, checkInBooking, cancelBooking } = useBookingStore();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    setLoading(true);
    const data = await fetchBookingById(id);
    setBooking(data);
    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (!booking) return;

    setIsProcessing(true);
    const { error } = await checkInBooking(booking.id);

    if (error) {
      toast.error("Failed to check in guest");
    } else {
      toast.success("Guest checked in successfully");
      loadBooking();
    }
    setIsProcessing(false);
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    if (cancellationReason.length < 10) return;

    setIsProcessing(true);
    const { error } = await cancelBooking(booking.id, cancellationReason);

    if (error) {
      toast.error(error.message || "Failed to cancel booking");
    } else {
      toast.success("Booking cancelled successfully");
      setShowCancelDialog(false);
      setCancellationReason("");
      loadBooking();
    }
    setIsProcessing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/bookings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Booking Not Found</h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">This booking does not exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balanceDue = booking.final_amount - booking.advance_paid;

  // Compare YYYY-MM-DD strings so time-zone shifts cannot affect the result
  const today = new Date().toISOString().split("T")[0];
  const checkInDate = (booking.check_in_date ?? "").split("T")[0];
  const isCheckInDay = today >= checkInDate;   // on or after the booked check-in date
  const isTooEarly = (booking.status === "confirmed" || booking.status === "tentative") && today < checkInDate;

  const canCheckIn = (booking.status === "confirmed" || booking.status === "tentative") && isCheckInDay;
  const canCancel = booking.status !== "cancelled" && booking.status !== "checked_out";

  const daysUntilCheckIn = Math.ceil(
    (new Date(checkInDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/bookings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{booking.booking_number}</h1>
            <p className="text-muted-foreground mt-1">Booking Details</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Show Check In button for confirmed/tentative bookings */}
          {(booking.status === "confirmed" || booking.status === "tentative") && (
            canCheckIn ? (
              <Button onClick={handleCheckIn} disabled={isProcessing}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isProcessing ? "Checking In…" : "Check In"}
              </Button>
            ) : (
              <Button disabled variant="outline" className="cursor-not-allowed opacity-60">
                <Clock className="mr-2 h-4 w-4" />
                Check-in on {formatDate(checkInDate)}
              </Button>
            )
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
              disabled={isProcessing}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status & Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Booking Status</span>
              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Status</span>
              <Badge
                variant={
                  booking.payment_status === "paid"
                    ? "default"
                    : booking.payment_status === "partial"
                      ? "secondary"
                      : "outline"
                }
              >
                {booking.payment_status === "paid"
                  ? "Paid"
                  : booking.payment_status === "partial"
                    ? "Partial"
                    : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Source</span>
              <span className="font-medium capitalize">
                {booking.source.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Booked On</span>
              <span className="font-medium">{formatDate(booking.booked_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Guest Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Guest Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium text-lg">{booking.guest?.full_name}</p>
            </div>

            {booking.guest?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{booking.guest.phone}</span>
              </div>
            )}

            {booking.guest?.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{booking.guest.email}</span>
              </div>
            )}

            {booking.guest?.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {booking.guest.city}
                  {booking.guest.state && `, ${booking.guest.state}`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Reservation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Check-in</p>
                <p className="font-medium">{formatDate(booking.check_in_date)}</p>
                {booking.arrival_time && (
                  <p className="text-sm text-muted-foreground">{booking.arrival_time}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Check-out</p>
                <p className="font-medium">{formatDate(booking.check_out_date)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Duration</span>
              <span className="font-semibold">
                {booking.nights} {booking.nights === 1 ? "Night" : "Nights"}
              </span>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Guests</p>
              <p className="font-medium">
                {booking.adults} {booking.adults === 1 ? "Adult" : "Adults"}
                {booking.children > 0 &&
                  `, ${booking.children} ${booking.children === 1 ? "Child" : "Children"}`}
              </p>
            </div>

            {booking.special_requests && (
              <div>
                <p className="text-sm text-muted-foreground">Special Requests</p>
                <p className="text-sm mt-1">{booking.special_requests}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Room Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              Room Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Room Number</p>
              <p className="font-medium text-lg">
                {booking.room?.room_number || "Not assigned"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium">{booking.room_category?.name}</p>
            </div>

            {booking.room?.floor && (
              <div>
                <p className="text-sm text-muted-foreground">Floor</p>
                <p className="font-medium">Floor {booking.room.floor}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Rate per Night</p>
              <p className="font-medium">{formatCurrency(booking.room_rate)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Room Charges ({booking.nights} nights × {formatCurrency(booking.room_rate)})
              </span>
              <span className="font-medium">{formatCurrency(booking.total_amount)}</span>
            </div>

            {booking.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>- {formatCurrency(booking.discount_amount)}</span>
              </div>
            )}

            <div className="flex justify-between text-lg font-semibold pt-3 border-t">
              <span>Total Amount</span>
              <span>{formatCurrency(booking.final_amount)}</span>
            </div>

            <div className="flex justify-between text-blue-600">
              <span>Advance Paid</span>
              <span>{formatCurrency(booking.advance_paid)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold pt-3 border-t">
              <span>Balance Due</span>
              <span className={balanceDue > 0 ? "text-red-600" : "text-green-600"}>
                {formatCurrency(balanceDue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Early arrival warning */}
      {isTooEarly && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-amber-500 text-white p-2 rounded-lg shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Early Arrival</h3>
                <p className="text-sm text-amber-800 mt-1">
                  This guest's check-in date is <strong>{formatDate(checkInDate)}</strong> —{" "}
                  {daysUntilCheckIn === 1
                    ? "tomorrow"
                    : `in ${daysUntilCheckIn} days`}.
                  Check-in will be enabled on that date.
                  If the guest needs the room today, please update the booking's check-in date first.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {booking.status === "checked_in" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500 text-white p-2 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Guest Currently Checked In</h3>
                <p className="text-sm text-blue-800 mt-1">
                  The guest is currently staying at the hotel. They are scheduled to check out on{" "}
                  {formatDate(booking.check_out_date)}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel booking {booking.booking_number}? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="reason">Cancellation Reason (Required)</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for cancellation..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="min-h-[100px]"
            />
            {cancellationReason.length > 0 && cancellationReason.length < 10 && (
              <p className="text-xs text-red-500">Reason must be at least 10 characters.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Booking
            </Button>
            <Button
              disabled={isProcessing || cancellationReason.length < 10}
              variant="destructive"
              onClick={handleCancelBooking}
            >
              {isProcessing ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
