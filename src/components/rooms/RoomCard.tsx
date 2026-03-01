import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoomStatusBadge } from "./RoomStatusBadge";
import { formatCurrency } from "@/lib/utils";
import { MoreVertical, Edit, Trash2, DoorOpen } from "lucide-react";
import type { Room } from "@/types";

interface RoomCardProps {
  room: Room;
  onDelete?: (room: Room) => void;
  onStatusChange?: (room: Room) => void;
  onMarkClean?: (room: Room) => void;
}

export function RoomCard({ room, onDelete, onStatusChange, onMarkClean }: RoomCardProps) {
  const price = room.custom_price || room.category?.base_price || 0;
  const isDirty = room.status === "vacant_dirty";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Room {room.room_number}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Floor {room.floor}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/rooms/${room.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Room
                </Link>
              </DropdownMenuItem>
              {onStatusChange && (
                <DropdownMenuItem onClick={() => onStatusChange(room)}>
                  <DoorOpen className="mr-2 h-4 w-4" />
                  Change Status
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(room)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Room
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <RoomStatusBadge status={room.status} />
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Category</p>
          <p className="font-medium">{room.category?.name || "N/A"}</p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Price per night</p>
          <p className="text-lg font-semibold">{formatCurrency(price)}</p>
        </div>

        {room.notes && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-sm">{room.notes}</p>
          </div>
        )}

        {isDirty && onMarkClean && (
          <Button
            onClick={() => onMarkClean(room)}
            className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Mark Clean
          </Button>
        )}

        <Button asChild variant="outline" className="w-full mt-2">
          <Link href={`/rooms/${room.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
