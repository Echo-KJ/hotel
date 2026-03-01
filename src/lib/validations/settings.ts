import { z } from "zod";

// Hotel Settings validation schema
export const hotelSettingsSchema = z.object({
  hotel_name: z.string().min(1, "Hotel name is required").max(255),
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default("India"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),

  // Tax fields
  gstin: z.string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format")
    .optional()
    .or(z.literal("")),
  gstin_registered_name: z.string().optional(),
  gstin_state_code: z.string().length(2, "State code must be 2 digits").optional().or(z.literal("")),
  pan: z.string().max(10).optional().or(z.literal("")),

  // SAC Codes
  sac_code: z.string().default("996311"), // Main/legacy
  sac_code_accommodation: z.string().default("998111"),
  sac_code_food: z.string().default("996311"),
  sac_code_laundry: z.string().default("998713"),
  sac_code_other: z.string().default("999799"),

  invoice_prefix: z.string().default("INV"),
  invoice_footer_text: z.string().optional(),
  terms_and_conditions: z.string().optional(),
});

export type HotelSettingsFormData = z.infer<typeof hotelSettingsSchema>;

// Room Category validation schema
export const roomCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().optional(),
  base_price: z.coerce
    .number()
    .min(0, "Price must be positive")
    .max(999999, "Price too high"),
  max_occupancy: z.coerce
    .number()
    .int()
    .min(1, "Must accommodate at least 1 person")
    .max(10, "Maximum 10 people"),
  amenities: z.array(z.string()).optional(),
  image_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type RoomCategoryFormData = z.infer<typeof roomCategorySchema>;
