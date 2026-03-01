"use client";

import { useEffect } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ROOM_STATUS_LABELS } from "@/lib/constants";
import { X, Search } from "lucide-react";

export function RoomFilters() {
  const {
    statusFilter,
    categoryFilter,
    floorFilter,
    searchQuery,
    setStatusFilter,
    setCategoryFilter,
    setFloorFilter,
    setSearchQuery,
    clearFilters,
    rooms,
  } = useRoomStore();

  const { roomCategories, fetchRoomCategories } = useSettingsStore();

  useEffect(() => {
    if (roomCategories.length === 0) {
      fetchRoomCategories();
    }
  }, [roomCategories.length, fetchRoomCategories]);

  // Get unique floors from rooms
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  const hasActiveFilters =
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    floorFilter !== "all" ||
    searchQuery !== "";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Room number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(value: any) => setStatusFilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {roomCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Floor Filter */}
        <div className="space-y-2">
          <Label>Floor</Label>
          <Select
            value={floorFilter.toString()}
            onValueChange={(value) =>
              setFloorFilter(value === "all" ? "all" : parseInt(value))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All floors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floors.map((floor) => (
                <SelectItem key={floor} value={floor.toString()}>
                  Floor {floor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Filters active
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8"
          >
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
