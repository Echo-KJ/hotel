import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Test API route to verify database connection
 * GET /api/test-db
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 1️⃣ Get hotel settings (safe version)
    const { data: hotelSettings, error: settingsError } = await supabase
      .from("hotel_settings")
      .select("*")
      .maybeSingle();

    if (settingsError) throw settingsError;

    // 2️⃣ Count rooms
    const { count: roomCount, error: roomError } = await supabase
      .from("rooms")
      .select("*", { count: "exact", head: true });

    if (roomError) throw roomError;

    // 3️⃣ Count room categories
    const { count: categoryCount, error: categoryError } = await supabase
      .from("room_categories")
      .select("*", { count: "exact", head: true });

    if (categoryError) throw categoryError;

    // 4️⃣ Count guests
    const { count: guestCount, error: guestError } = await supabase
      .from("guests")
      .select("*", { count: "exact", head: true });

    if (guestError) throw guestError;

    // 5️⃣ Count bookings
    const { count: bookingCount, error: bookingError } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });

    if (bookingError) throw bookingError;

    // 6️⃣ Get occupancy summary (safe version)
    const { data: occupancy, error: occupancyError } = await supabase
      .from("occupancy_summary")
      .select("*")
      .maybeSingle();

    if (occupancyError) throw occupancyError;

    return NextResponse.json({
      success: true,
      message: "Database connection successful!",
      data: {
        hotel: hotelSettings
          ? {
              name: hotelSettings.hotel_name,
              city: hotelSettings.city,
              state: hotelSettings.state,
            }
          : null,
        counts: {
          rooms: roomCount ?? 0,
          categories: categoryCount ?? 0,
          guests: guestCount ?? 0,
          bookings: bookingCount ?? 0,
        },
        occupancy: occupancy ?? null,
      },
    });
  } catch (error: any) {
    console.error("Database test error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
