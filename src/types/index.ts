// Main TypeScript type definitions for the application

// ============================================
// ROOM TYPES
// ============================================

export type RoomStatus =
  | "vacant_clean"
  | "vacant_dirty"
  | "occupied"
  | "reserved"
  | "out_of_service"
  | "blocked";

export interface RoomCategory {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  max_occupancy: number;
  amenities?: string[];
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  category_id: string;
  category?: RoomCategory;
  floor: number;
  status: RoomStatus;
  custom_price?: number;
  last_cleaned_at?: string;
  assigned_housekeeper?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// GUEST TYPES
// ============================================

export type IdProofType = "aadhar" | "passport" | "driving_license" | "voter_id" | "pan";

export interface Guest {
  id: string;
  first_name: string;
  last_name?: string;
  full_name: string;
  email?: string;
  phone: string;
  id_proof_type?: IdProofType;
  id_proof_number?: string;
  id_proof_image_url?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  is_corporate: boolean;
  company_name?: string;
  gstin?: string;
  billing_address?: string; // Added for corporate billing
  total_stays: number;
  total_spent: number;
  last_stay_date?: string;
  preferences?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// BOOKING TYPES
// ============================================

export type BookingStatus =
  | "tentative"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show";

export type BookingSource =
  | "direct"
  | "walk_in"
  | "online"
  | "booking_com"
  | "airbnb"
  | "makemytrip"
  | "phone"
  | "email";

export type PaymentStatus = "pending" | "partial" | "paid" | "refunded";

export interface Booking {
  id: string;
  booking_number: string;
  guest_id: string;
  guest?: Guest;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  room_id?: string;
  room?: Room;
  room_category_id: string;
  room_category?: RoomCategory;
  adults: number;
  children: number;
  room_rate: number;
  base_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  gst_amount: number;
  grand_total: number;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  source: BookingSource;
  status: BookingStatus;
  advance_paid: number;
  payment_status: PaymentStatus;
  special_requests?: string;
  arrival_time?: string;
  booked_by?: string;
  booked_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// ACTIVE STAY TYPES
// ============================================

export interface AdditionalGuest {
  name: string;
  age: number;
  id_proof?: string;
}

export interface ActiveStay {
  id: string;
  booking_id: string;
  booking?: Booking;
  guest_id: string;
  guest?: Guest;
  room_id: string;
  room?: Room;
  check_in_date: string;
  check_out_date: string;
  actual_check_in_time: string;
  actual_check_out_time?: string;
  additional_guests?: AdditionalGuest[];
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// CHARGE TYPES
// ============================================

export type ChargeType =
  | "food"
  | "laundry"
  | "minibar"
  | "room_service"
  | "extra_bed"
  | "late_checkout"
  | "other";

export interface Charge {
  id: string;
  stay_id: string;
  booking_id?: string;
  charge_type: ChargeType;
  description: string;
  amount: number;
  quantity: number;
  total_amount: number;
  is_taxable: boolean;
  charge_date: string;
  added_by?: string;
  created_at: string;
}

// ============================================
// INVOICE TYPES
// ============================================

export interface InvoiceItem {
  description: string;
  hsn_sac: string;
  quantity: number;
  rate: number;
  amount: number;
  is_taxable?: boolean;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  booking_id?: string;
  booking?: Booking;
  guest_id: string;
  guest?: Guest;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  discount: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  payment_status: PaymentStatus;
  items: InvoiceItem[];
  notes?: string;
  terms_conditions?: string;
  generated_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentMethod = "cash" | "card" | "upi" | "net_banking" | "cheque" | "wallet";

export type PaymentStatusType = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: string;
  invoice_id?: string;
  booking_id?: string;
  guest_id?: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  status: PaymentStatusType;
  notes?: string;
  received_by?: string;
  created_at: string;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface HotelSettings {
  id: string;
  hotel_name: string;
  hotel_logo_url?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  gstin?: string;
  gstin_registered_name?: string;
  gstin_state_code?: string;
  pan?: string;
  sac_code: string; // Deprecated but kept for compatibility
  sac_code_accommodation?: string;
  sac_code_food?: string;
  sac_code_laundry?: string;
  sac_code_other?: string;
  invoice_prefix: string;
  invoice_footer_text?: string;
  terms_and_conditions?: string;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  is_active: boolean;
  applicable_from?: string;
  applicable_to?: string;
  created_at: string;
}

// ============================================
// USER TYPES
// ============================================

export type UserRole = "admin" | "manager" | "reception" | "housekeeping" | "accountant";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardKPIs {
  occupancy_rate: number;
  available_rooms: number;
  arrivals_today: number;
  departures_today: number;
  in_house_guests: number;
  revenue_today: number;
  revenue_mtd: number;
  pending_payments: number;
  upcoming_bookings: number;
}

export interface ArrivalItem {
  id: string;
  guest_name: string;
  room_type: string;
  eta: string;
  payment_status: PaymentStatus;
  booking_source: BookingSource;
}

export interface DepartureItem {
  room_number: string;
  guest_name: string;
  checkout_time: string;
  pending_charges: number;
  is_late_checkout: boolean;
}

export type AlertType = "critical" | "urgent" | "info";

export interface Alert {
  type: AlertType;
  message: string;
  action_url?: string;
}

// ============================================
// REPORT TYPES
// ============================================

export interface OccupancyReport {
  date: string;
  total_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
  revenue: number;
}

export interface RevenueReport {
  period: string;
  room_revenue: number;
  food_beverage_revenue: number;
  other_revenue: number;
  total_revenue: number;
  adr: number; // Average Daily Rate
  rev_par: number; // Revenue Per Available Room
}

// ============================================
// FORM INPUT TYPES
// ============================================

export interface CreateRoomInput {
  room_number: string;
  category_id: string;
  floor: number;
  custom_price?: number;
}

export interface CreateBookingInput {
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  room_category_id: string;
  room_id?: string;
  adults: number;
  children: number;
  room_rate: number;
  total_amount: number;
  discount_amount?: number;
  source: BookingSource;
  advance_paid?: number;
  special_requests?: string;
  arrival_time?: string;
}

export interface CreateGuestInput {
  first_name: string;
  last_name?: string;
  email?: string;
  phone: string;
  id_proof_type?: IdProofType;
  id_proof_number?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  is_corporate?: boolean;
  company_name?: string;
  gstin?: string;
}
