"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus, Pencil, Trash2, Bed, Users, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { RoomCategoryDialog } from "@/components/settings/RoomCategoryDialog";
import type { RoomCategory } from "@/types";
import { toast } from "sonner";

export default function RoomCategoriesPage() {
  const { roomCategories, loading, fetchRoomCategories, deleteRoomCategory } = useSettingsStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RoomCategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRoomCategories();
  }, [fetchRoomCategories]);

  const handleEdit = (category: RoomCategory) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    const { error } = await deleteRoomCategory(id);

    if (error) {
      toast.error("Failed to delete category");
    } else {
      toast.success("Category deleted successfully");
    }
    setDeletingId(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  if (loading && roomCategories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Room Categories</h1>
          <p className="text-muted-foreground mt-1">
            Manage different types of rooms in your hotel
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {roomCategories.length === 0 ? (
        <EmptyState
          icon={Bed}
          title="No room categories yet"
          description="Create your first room category to start organizing your rooms"
          action={{
            label: "Add Category",
            onClick: () => setIsDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roomCategories.map((category) => (
            <Card key={category.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Bed className="h-5 w-5" />
                      {category.name}
                    </CardTitle>
                    {category.description && (
                      <CardDescription className="mt-1">
                        {category.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={category.is_active ? "default" : "secondary"}>
                    {category.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Base Price
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(category.base_price)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Max Occupancy
                    </span>
                    <span className="font-semibold">
                      {category.max_occupancy} {category.max_occupancy === 1 ? "person" : "people"}
                    </span>
                  </div>
                </div>

                {category.amenities && category.amenities.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Amenities</p>
                    <div className="flex flex-wrap gap-1">
                      {category.amenities.slice(0, 4).map((amenity, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {category.amenities.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.amenities.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(category.id, category.name)}
                    disabled={deletingId === category.id}
                  >
                    {deletingId === category.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RoomCategoryDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        category={editingCategory}
      />
    </div>
  );
}
