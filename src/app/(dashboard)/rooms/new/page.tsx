"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRoomStore } from "@/store/useRoomStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { roomSchema, type RoomFormData } from "@/lib/validations/room";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { ROOM_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

export default function NewRoomPage() {
  const router = useRouter();
  const { createRoom } = useRoomStore();
  const { roomCategories, fetchRoomCategories } = useSettingsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      status: "vacant_clean",
      floor: 1,
      is_active: true,
    },
  });

  useEffect(() => {
    if (roomCategories.length === 0) {
      fetchRoomCategories();
    }
  }, [roomCategories.length, fetchRoomCategories]);

  const onSubmit = async (data: RoomFormData) => {
    setIsSubmitting(true);

    const { error } = await createRoom({
      ...data,
      custom_price: data.custom_price || null,
    });

    if (error) {
      toast.error("Failed to create room");
      setIsSubmitting(false);
    } else {
      toast.success("Room created successfully");
      router.push("/rooms");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/rooms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Room</h1>
          <p className="text-muted-foreground mt-1">
            Create a new room in your hotel
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about the room</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="room_number">Room Number *</Label>
                <Input
                  id="room_number"
                  {...register("room_number")}
                  placeholder="101"
                />
                {errors.room_number && (
                  <p className="text-sm text-red-600">{errors.room_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Floor *</Label>
                <Input
                  id="floor"
                  type="number"
                  {...register("floor")}
                  placeholder="1"
                />
                {errors.floor && (
                  <p className="text-sm text-red-600">{errors.floor.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category_id">Room Category *</Label>
                <Select
                  onValueChange={(value) => setValue("category_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name} - ₹{category.base_price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="text-sm text-red-600">{errors.category_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  defaultValue="vacant_clean"
                  onValueChange={(value: any) => setValue("status", value)}
                >
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

            <div className="space-y-2">
              <Label htmlFor="custom_price">Custom Price (optional)</Label>
              <Input
                id="custom_price"
                type="number"
                step="0.01"
                {...register("custom_price")}
                placeholder="Leave empty to use category price"
              />
              <p className="text-xs text-muted-foreground">
                Override the base category price for this specific room
              </p>
              {errors.custom_price && (
                <p className="text-sm text-red-600">{errors.custom_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Any special notes about this room..."
                rows={3}
              />
              {errors.notes && (
                <p className="text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                defaultChecked={true}
                onCheckedChange={(checked) => setValue("is_active", !!checked)}
              />
              <label
                htmlFor="is_active"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Room is active
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Room
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
