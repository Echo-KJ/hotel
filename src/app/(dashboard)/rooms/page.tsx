"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoomStore } from "@/store/useRoomStore";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoomCard } from "@/components/rooms/RoomCard";
import { RoomFilters } from "@/components/rooms/RoomFilters";
import { Plus, Bed, LayoutGrid, List, Zap } from "lucide-react";
import { toast } from "sonner";
import type { Room, RoomStatus } from "@/types";
import { QuickCheckInModal } from "@/components/checkin/QuickCheckInModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROOM_STATUS_LABELS } from "@/lib/constants";

export default function RoomsPage() {
  const router = useRouter();
  const { rooms, loading, fetchRooms, deleteRoom, updateRoomStatus, getFilteredRooms, setStatusFilter, markRoomClean } = useRoomStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newStatus, setNewStatus] = useState<RoomStatus>("vacant_clean");

  // Housekeeping Mode State
  const [isHousekeepingMode, setIsHousekeepingMode] = useState(false);
  const [cleanDialogOpen, setCleanDialogOpen] = useState(false);
  const [roomToClean, setRoomToClean] = useState<Room | null>(null);
  const [cleaningNotes, setCleaningNotes] = useState("");

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Sync mode with filter
  useEffect(() => {
    if (isHousekeepingMode) {
      setStatusFilter("vacant_dirty");
    } else {
      setStatusFilter("all");
    }
  }, [isHousekeepingMode, setStatusFilter]);

  const filteredRooms = getFilteredRooms();
  // Count dirty rooms for badge
  const dirtyCount = rooms.filter(r => r.status === 'vacant_dirty').length;

  const handleDelete = async (room: Room) => {
    if (!confirm(`Are you sure you want to delete Room ${room.room_number}?`)) {
      return;
    }

    const { error } = await deleteRoom(room.id);
    if (error) {
      toast.error("Failed to delete room");
    } else {
      toast.success(`Room ${room.room_number} deleted successfully`);
    }
  };

  const handleStatusChange = (room: Room) => {
    setSelectedRoom(room);
    setNewStatus(room.status);
    setStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedRoom) return;

    const { error } = await updateRoomStatus(selectedRoom.id, newStatus);
    if (error) {
      toast.error("Failed to update room status");
    } else {
      toast.success(`Room ${selectedRoom.room_number} status updated`);
      setStatusDialogOpen(false);
      setSelectedRoom(null);
    }
  };

  const handleMarkCleanInit = (room: Room) => {
    setRoomToClean(room);
    setCleaningNotes("");
    setCleanDialogOpen(true);
  };

  const handleConfirmClean = async () => {
    if (!roomToClean) return;

    const { error } = await markRoomClean(roomToClean.id, cleaningNotes);
    if (error) {
      toast.error(error.message || "Failed to mark room clean");
    } else {
      toast.success(`Room ${roomToClean.room_number} marked as clean`);
      setCleanDialogOpen(false);
      setRoomToClean(null);
    }
  };

  if (loading && rooms.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
          <p className="text-muted-foreground mt-1">
            Manage all rooms in your hotel ({rooms.length} Total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isHousekeepingMode ? "secondary" : "outline"}
            onClick={() => setIsHousekeepingMode(!isHousekeepingMode)}
            className={isHousekeepingMode ? "bg-amber-100 text-amber-900 border-amber-200" : ""}
          >
            {isHousekeepingMode ? "Exit Housekeeping" : `Needs Cleaning (${dirtyCount})`}
          </Button>

          {/* View Toggle */}
          <div className="flex border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => router.push("/rooms/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </Button>

          <Button onClick={() => setShowQuickCheckIn(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Zap className="mr-2 h-4 w-4" />
            Quick Check-In
          </Button>
        </div>
      </div>

      {/* Filters (Hide in Housekeeping mode to avoid confusion) */}
      {!isHousekeepingMode && <RoomFilters />}

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={Bed}
          title={isHousekeepingMode ? "No dirty rooms" : (rooms.length === 0 ? "No rooms yet" : "No rooms found")}
          description={
            isHousekeepingMode
              ? "All rooms are clean!"
              : (rooms.length === 0
                ? "Create your first room to start managing your hotel inventory"
                : "Try adjusting your filters to see more results")
          }
          action={
            rooms.length === 0
              ? {
                label: "Add Room",
                onClick: () => router.push("/rooms/new"),
              }
              : undefined
          }
        />
      ) : (
        <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onMarkClean={isHousekeepingMode || room.status === 'vacant_dirty' ? handleMarkCleanInit : undefined}
            />
          ))}
        </div>
      )}

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Room Status</DialogTitle>
            <DialogDescription>
              Update the status of Room {selectedRoom?.room_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={(value: RoomStatus) => setNewStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Clean Dialog */}
      <Dialog open={cleanDialogOpen} onOpenChange={setCleanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Room {roomToClean?.room_number} Clean?</DialogTitle>
            <DialogDescription>
              Confirm that housekeeping is complete for this room. It will be marked as Available.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="notes">Housekeeping Notes (Optional)</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g. Broken lamp fixed, extra towels added..."
              value={cleaningNotes}
              onChange={(e) => setCleaningNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCleanDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmClean} className="bg-green-600 hover:bg-green-700 text-white">
              Confirm - Room is Clean
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <QuickCheckInModal
        open={showQuickCheckIn}
        onOpenChange={setShowQuickCheckIn}
        onSuccess={() => {
          fetchRooms();
          toast.success("Room status updated after check-in");
        }}
      />
    </div>
  );
}
