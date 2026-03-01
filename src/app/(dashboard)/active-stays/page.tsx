"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveStayStore } from "@/store/useActiveStayStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { Users, Bed, Calendar, DollarSign, Eye } from "lucide-react";

export default function ActiveStaysPage() {
  const router = useRouter();
  const { activeStays, loading, fetchActiveStays } = useActiveStayStore();

  useEffect(() => {
    fetchActiveStays();
  }, [fetchActiveStays]);

  if (loading && activeStays.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Active Stays</h1>
          <p className="text-muted-foreground mt-1">
            Guests currently in-house ({activeStays.length} {activeStays.length === 1 ? "guest" : "guests"})
          </p>
        </div>
      </div>

      {/* Stats */}
      {activeStays.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeStays.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rooms Occupied</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeStays.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Charges</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  activeStays.reduce((sum, stay) => {
                    const chargesTotal = stay.charges?.reduce(
                      (s: number, c: any) => s + (c.total_amount || 0),
                      0
                    ) || 0;
                    return sum + chargesTotal;
                  }, 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Stays List */}
      {activeStays.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No active stays"
          description="There are no guests currently checked in"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeStays.map((stay) => {
            const chargesTotal = stay.charges?.reduce(
              (sum: number, c: any) => sum + (c.total_amount || 0),
              0
            ) || 0;
            const roomTotal = stay.booking?.final_amount || 0;
            const totalAmount = roomTotal + chargesTotal;

            return (
              <Card key={stay.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Room {stay.room?.room_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stay.guest?.full_name}
                      </p>
                    </div>
                    <Badge className="bg-blue-500">In House</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Check-in</p>
                        <p className="font-medium">
                          {formatDate(stay.check_in_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Check-out</p>
                        <p className="font-medium">
                          {formatDate(stay.check_out_date)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Room Charges</span>
                        <span className="font-medium">{formatCurrency(roomTotal)}</span>
                      </div>
                      {chargesTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Additional ({stay.charges?.length || 0})
                          </span>
                          <span className="font-medium">{formatCurrency(chargesTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold pt-1 border-t mt-1">
                        <span>Total</span>
                        <span>{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full mt-2"
                  >
                    <a href={`/active-stays/${stay.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
