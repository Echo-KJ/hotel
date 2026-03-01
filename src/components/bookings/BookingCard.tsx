import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Calendar, User, Bed, DollarSign, MapPin } from "lucide-react";
import type { Booking } from "@/types";

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">
                {booking.booking_number}
              </h3>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {booking.guest?.full_name || "Guest"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <div>
              <p className="text-xs">Check-in</p>
              <p className="font-medium text-foreground">
                {formatDate(booking.check_in_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <div>
              <p className="text-xs">Check-out</p>
              <p className="font-medium text-foreground">
                {formatDate(booking.check_out_date)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Room:</span>
            <span className="font-medium">
              {booking.room?.room_number || "Not assigned"} - {booking.room_category?.name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Guests:</span>
            <span className="font-medium">
              {booking.adults} {booking.adults === 1 ? "Adult" : "Adults"}
              {booking.children > 0 && `, ${booking.children} ${booking.children === 1 ? "Child" : "Children"}`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold text-lg">
              {formatCurrency(booking.final_amount)}
            </span>
          </div>

          {booking.guest?.phone && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{booking.guest.phone}</span>
            </div>
          )}
        </div>

        <Button asChild variant="outline" className="w-full mt-2">
          <Link href={`/bookings/${booking.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
