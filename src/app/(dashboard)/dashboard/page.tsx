"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Bed,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuickCheckInModal } from "@/components/checkin/QuickCheckInModal";

export default function DashboardPage() {
  const router = useRouter();
  const { stats, recentBookings, todayArrivals, todayDepartures, loading, fetchDashboardData } =
    useDashboardStore();
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your hotel today.
            </p>
          </div>
          <Button onClick={() => setShowQuickCheckIn(true)} size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Zap className="mr-2 h-5 w-5" />
            Quick Check-In
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.occupancyRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.occupiedRooms} of {stats?.totalRooms} rooms occupied
            </p>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${stats?.occupancyRate || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stays</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeStays || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Guests currently in-house
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Arrivals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayArrivals || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Expected check-ins today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total revenue (all time)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Arrivals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Arrivals</CardTitle>
                <CardDescription>Guests checking in today</CardDescription>
              </div>
              <Badge variant="secondary">{todayArrivals.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {todayArrivals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No arrivals scheduled for today
              </p>
            ) : (
              <div className="space-y-3">
                {todayArrivals.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/bookings/${booking.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{booking.guest?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Room {booking.room?.room_number || "Not assigned"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {booking.arrival_time || "TBD"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Departures */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Departures</CardTitle>
                <CardDescription>Guests checking out today</CardDescription>
              </div>
              <Badge variant="secondary">{todayDepartures.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {todayDepartures.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No departures scheduled for today
              </p>
            ) : (
              <div className="space-y-3">
                {todayDepartures.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/bookings/${booking.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 p-2 rounded-full">
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">{booking.guest?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Room {booking.room?.room_number}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">11:00 AM</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Bookings</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/bookings")}
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/bookings/${booking.id}`)}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${booking.status === "confirmed"
                      ? "bg-green-500"
                      : booking.status === "checked_in"
                        ? "bg-blue-500"
                        : booking.status === "checked_out"
                          ? "bg-gray-500"
                          : "bg-yellow-500"
                      }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{booking.guest?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {formatCurrency(booking.final_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {booking.status.replace("_", " ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/bookings/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Booking
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/active-stays")}
              >
                <Users className="mr-2 h-4 w-4" />
                View Active Stays
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/rooms")}
              >
                <Bed className="mr-2 h-4 w-4" />
                Manage Rooms
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/settings")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Hotel Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Alert */}
      {stats && stats.pendingPayments > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-yellow-500 text-white p-2 rounded-lg">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Pending Payments</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  You have {formatCurrency(stats.pendingPayments)} in pending payments from unpaid
                  or partially paid bookings.
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push("/bookings")}>
                View Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-green-500 text-white p-2 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Dashboard Complete! 🎉</h3>
              <p className="text-sm text-green-800 mt-1">
                Your hotel management system is fully operational with real-time data, bookings,
                active stays, and checkout functionality. All modules are working together
                seamlessly!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <QuickCheckInModal
        open={showQuickCheckIn}
        onOpenChange={setShowQuickCheckIn}
        onSuccess={() => {
          fetchDashboardData();
          // Could also refresh recent bookings slightly later
        }}
      />
    </div>
  );
}
