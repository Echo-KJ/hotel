import { z } from "zod";

// Guest validation schema
export const guestSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().max(100).optional(),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number too long"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  id_proof_type: z.enum(["aadhar", "passport", "driving_license", "voter_id", "pan"]).optional(),
  id_proof_number: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
});

export type GuestFormData = z.infer<typeof guestSchema>;

// Booking validation schema
export const bookingSchema = z.object({
  guest_id: z.string().uuid("Please select a guest"),
  check_in_date: z.string().min(1, "Check-in date is required"),
  check_out_date: z.string().min(1, "Check-out date is required"),
  room_category_id: z.string().uuid("Please select a room category"),
  room_id: z.string().uuid().optional().or(z.literal("")),
  adults: z.coerce
    .number()
    .int()
    .min(1, "At least 1 adult required")
    .max(10, "Maximum 10 adults"),
  children: z.coerce.number().int().min(0, "Cannot be negative").max(10, "Maximum 10 children"),
  room_rate: z.coerce.number().min(0, "Rate cannot be negative"),
  total_amount: z.coerce.number().min(0, "Amount cannot be negative"),
  discount_amount: z.coerce.number().min(0, "Discount cannot be negative").default(0),
  source: z.enum(["direct", "walk_in", "online", "booking_com", "airbnb", "makemytrip", "phone", "email"]),
  advance_paid: z.coerce.number().min(0, "Amount cannot be negative").default(0),
  special_requests: z.string().max(500).optional(),
  arrival_time: z.string().optional(),
}).refine(
  (data) => {
    const checkIn = new Date(data.check_in_date);
    const checkOut = new Date(data.check_out_date);
    return checkOut > checkIn;
  },
  {
    message: "Check-out date must be after check-in date",
    path: ["check_out_date"],
  }
);

export type BookingFormData = z.infer<typeof bookingSchema>;
