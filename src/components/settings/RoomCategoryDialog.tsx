"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSettingsStore } from "@/store/useSettingsStore";
import { roomCategorySchema, type RoomCategoryFormData } from "@/lib/validations/settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { RoomCategory } from "@/types";

interface RoomCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  category?: RoomCategory | null;
}

const DEFAULT_AMENITIES = [
  "Wi-Fi",
  "TV",
  "AC",
  "Mini Bar",
  "Room Service",
  "City View",
  "Sea View",
  "Jacuzzi",
  "Coffee Maker",
  "Safe",
];

export function RoomCategoryDialog({ open, onClose, category }: RoomCategoryDialogProps) {
  const { createRoomCategory, updateRoomCategory } = useSettingsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomCategoryFormData>({
    resolver: zodResolver(roomCategorySchema),
    defaultValues: {
      is_active: true,
      max_occupancy: 2,
    },
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || "",
        base_price: category.base_price,
        max_occupancy: category.max_occupancy,
        image_url: category.image_url || "",
        is_active: category.is_active,
      });
      setSelectedAmenities(category.amenities || []);
    } else {
      reset({
        name: "",
        description: "",
        base_price: 0,
        max_occupancy: 2,
        image_url: "",
        is_active: true,
      });
      setSelectedAmenities([]);
    }
  }, [category, reset]);

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleAddCustomAmenity = () => {
    if (customAmenity.trim() && !selectedAmenities.includes(customAmenity.trim())) {
      setSelectedAmenities([...selectedAmenities, customAmenity.trim()]);
      setCustomAmenity("");
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
  };

  const onSubmit = async (data: RoomCategoryFormData) => {
    setIsSubmitting(true);

    const categoryData = {
      ...data,
      amenities: selectedAmenities,
    };

    let error;
    if (category) {
      ({ error } = await updateRoomCategory(category.id, categoryData));
    } else {
      ({ error } = await createRoomCategory(categoryData));
    }

    if (error) {
      toast.error(category ? "Failed to update category" : "Failed to create category");
    } else {
      toast.success(category ? "Category updated successfully" : "Category created successfully");
      onClose();
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Room Category" : "Add Room Category"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Update the details of this room category"
              : "Create a new room category for your hotel"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Deluxe Room"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_price">Base Price (₹) *</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                {...register("base_price")}
                placeholder="2500"
              />
              {errors.base_price && (
                <p className="text-sm text-red-600">{errors.base_price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Spacious room with modern amenities..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max_occupancy">Max Occupancy *</Label>
              <Input
                id="max_occupancy"
                type="number"
                {...register("max_occupancy")}
                placeholder="2"
              />
              {errors.max_occupancy && (
                <p className="text-sm text-red-600">{errors.max_occupancy.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                {...register("image_url")}
                placeholder="https://..."
              />
              {errors.image_url && (
                <p className="text-sm text-red-600">{errors.image_url.message}</p>
              )}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-3">
            <Label>Amenities</Label>
            
            {/* Selected Amenities */}
            {selectedAmenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedAmenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="gap-1">
                    {amenity}
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(amenity)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Common Amenities */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {DEFAULT_AMENITIES.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={selectedAmenities.includes(amenity)}
                    onCheckedChange={() => handleAmenityToggle(amenity)}
                  />
                  <label
                    htmlFor={amenity}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {amenity}
                  </label>
                </div>
              ))}
            </div>

            {/* Custom Amenity */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom amenity..."
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomAmenity();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCustomAmenity}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              {...register("is_active")}
              defaultChecked={category?.is_active ?? true}
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Category is active
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {category ? "Updating..." : "Creating..."}
                </>
              ) : (
                category ? "Update Category" : "Create Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
