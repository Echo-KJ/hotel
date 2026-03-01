import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import type { BookingStatus } from "@/types";

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

const statusColors: Record<BookingStatus, string> = {
  tentative: "bg-yellow-500 hover:bg-yellow-600",
  confirmed: "bg-green-500 hover:bg-green-600",
  checked_in: "bg-blue-500 hover:bg-blue-600",
  checked_out: "bg-gray-500 hover:bg-gray-600",
  cancelled: "bg-red-500 hover:bg-red-600",
  no_show: "bg-orange-500 hover:bg-orange-600",
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  return (
    <Badge className={`${statusColors[status]} text-white border-0`}>
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}
