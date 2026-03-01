"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/store/useBookingStore";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { BookingCard } from "@/components/bookings/BookingCard";
import { Plus, Calendar } from "lucide-react";

export default function BookingsPage() {
  const router = useRouter();
  const { bookings, loading, fetchBookings, getFilteredBookings } = useBookingStore();

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = getFilteredBookings();

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Manage all reservations ({filteredBookings.length} {filteredBookings.length === 1 ? "booking" : "bookings"})
          </p>
        </div>
        <Button onClick={() => router.push("/bookings/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Button>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={bookings.length === 0 ? "No bookings yet" : "No bookings found"}
          description={
            bookings.length === 0
              ? "Create your first booking to start managing reservations"
              : "Try adjusting your filters to see more results"
          }
          action={
            bookings.length === 0
              ? {
                  label: "New Booking",
                  onClick: () => router.push("/bookings/new"),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
