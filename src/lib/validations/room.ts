import { z } from "zod";

export const roomSchema = z.object({
  room_number: z
    .string()
    .min(1, "Room number is required")
    .max(10, "Room number too long")
    .regex(/^[a-zA-Z0-9]+$/, "Only letters and numbers allowed"),
  category_id: z.string().uuid("Please select a category"),
  floor: z.coerce
    .number()
    .int("Floor must be a whole number")
    .min(0, "Floor cannot be negative")
    .max(100, "Floor number too high"),
  status: z.enum([
    "vacant_clean",
    "vacant_dirty",
    "occupied",
    "reserved",
    "out_of_service",
    "blocked",
  ]),
  custom_price: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .max(999999, "Price too high")
    .optional()
    .or(z.literal("")),
  notes: z.string().max(500, "Notes too long").optional(),
  is_active: z.boolean().default(true),
});

export type RoomFormData = z.infer<typeof roomSchema>;
