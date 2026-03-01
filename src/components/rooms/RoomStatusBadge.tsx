import { Badge } from "@/components/ui/badge";
import { ROOM_STATUS_LABELS } from "@/lib/constants";
import type { RoomStatus } from "@/types";

interface RoomStatusBadgeProps {
  status: RoomStatus;
}

const statusColors: Record<RoomStatus, string> = {
  vacant_clean: "bg-green-500 hover:bg-green-600",
  vacant_dirty: "bg-orange-500 hover:bg-orange-600",
  occupied: "bg-blue-500 hover:bg-blue-600",
  reserved: "bg-purple-500 hover:bg-purple-600",
  out_of_service: "bg-red-500 hover:bg-red-600",
  blocked: "bg-gray-500 hover:bg-gray-600",
};

export function RoomStatusBadge({ status }: RoomStatusBadgeProps) {
  return (
    <Badge className={`${statusColors[status]} text-white border-0`}>
      {ROOM_STATUS_LABELS[status]}
    </Badge>
  );
}
