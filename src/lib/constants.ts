// Application constants

export const APP_NAME = "HotelFlow";
export const APP_DESCRIPTION = "Complete Hotel Management System";

// Room Status
export const ROOM_STATUS = {
  VACANT_CLEAN: "vacant_clean",
  VACANT_DIRTY: "vacant_dirty",
  OCCUPIED: "occupied",
  RESERVED: "reserved",
  OUT_OF_SERVICE: "out_of_service",
  BLOCKED: "blocked",
} as const;

export const ROOM_STATUS_LABELS = {
  [ROOM_STATUS.VACANT_CLEAN]: "Vacant Clean",
  [ROOM_STATUS.VACANT_DIRTY]: "Vacant Dirty",
  [ROOM_STATUS.OCCUPIED]: "Occupied",
  [ROOM_STATUS.RESERVED]: "Reserved",
  [ROOM_STATUS.OUT_OF_SERVICE]: "Out of Service",
  [ROOM_STATUS.BLOCKED]: "Blocked",
} as const;

export const ROOM_STATUS_COLORS = {
  [ROOM_STATUS.VACANT_CLEAN]: "bg-green-500",
  [ROOM_STATUS.VACANT_DIRTY]: "bg-orange-500",
  [ROOM_STATUS.OCCUPIED]: "bg-blue-500",
  [ROOM_STATUS.RESERVED]: "bg-purple-500",
  [ROOM_STATUS.OUT_OF_SERVICE]: "bg-red-500",
  [ROOM_STATUS.BLOCKED]: "bg-gray-500",
} as const;

// Booking Status
export const BOOKING_STATUS = {
  TENTATIVE: "tentative",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
} as const;

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.TENTATIVE]: "Tentative",
  [BOOKING_STATUS.CONFIRMED]: "Confirmed",
  [BOOKING_STATUS.CHECKED_IN]: "Checked In",
  [BOOKING_STATUS.CHECKED_OUT]: "Checked Out",
  [BOOKING_STATUS.CANCELLED]: "Cancelled",
  [BOOKING_STATUS.NO_SHOW]: "No Show",
} as const;

// Booking Sources
export const BOOKING_SOURCES = {
  DIRECT: "direct",
  WALK_IN: "walk_in",
  ONLINE: "online",
  BOOKING_COM: "booking_com",
  AIRBNB: "airbnb",
  MAKEMYTRIP: "makemytrip",
  PHONE: "phone",
  EMAIL: "email",
} as const;

export const BOOKING_SOURCE_LABELS = {
  [BOOKING_SOURCES.DIRECT]: "Direct Booking",
  [BOOKING_SOURCES.WALK_IN]: "Walk-in",
  [BOOKING_SOURCES.ONLINE]: "Online",
  [BOOKING_SOURCES.BOOKING_COM]: "Booking.com",
  [BOOKING_SOURCES.AIRBNB]: "Airbnb",
  [BOOKING_SOURCES.MAKEMYTRIP]: "MakeMyTrip",
  [BOOKING_SOURCES.PHONE]: "Phone",
  [BOOKING_SOURCES.EMAIL]: "Email",
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PARTIAL: "partial",
  PAID: "paid",
  REFUNDED: "refunded",
} as const;

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: "Pending",
  [PAYMENT_STATUS.PARTIAL]: "Partial",
  [PAYMENT_STATUS.PAID]: "Paid",
  [PAYMENT_STATUS.REFUNDED]: "Refunded",
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
  UPI: "upi",
  NET_BANKING: "net_banking",
  CHEQUE: "cheque",
  WALLET: "wallet",
} as const;

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: "Cash",
  [PAYMENT_METHODS.CARD]: "Card",
  [PAYMENT_METHODS.UPI]: "UPI",
  [PAYMENT_METHODS.NET_BANKING]: "Net Banking",
  [PAYMENT_METHODS.CHEQUE]: "Cheque",
  [PAYMENT_METHODS.WALLET]: "Wallet",
} as const;

// Charge Types
export const CHARGE_TYPES = {
  FOOD: "food",
  LAUNDRY: "laundry",
  MINIBAR: "minibar",
  ROOM_SERVICE: "room_service",
  EXTRA_BED: "extra_bed",
  LATE_CHECKOUT: "late_checkout",
  OTHER: "other",
} as const;

export const CHARGE_TYPE_LABELS = {
  [CHARGE_TYPES.FOOD]: "Food & Beverage",
  [CHARGE_TYPES.LAUNDRY]: "Laundry",
  [CHARGE_TYPES.MINIBAR]: "Minibar",
  [CHARGE_TYPES.ROOM_SERVICE]: "Room Service",
  [CHARGE_TYPES.EXTRA_BED]: "Extra Bed",
  [CHARGE_TYPES.LATE_CHECKOUT]: "Late Checkout",
  [CHARGE_TYPES.OTHER]: "Other",
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  RECEPTION: "reception",
  HOUSEKEEPING: "housekeeping",
  ACCOUNTANT: "accountant",
} as const;

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: "Admin",
  [USER_ROLES.MANAGER]: "Manager",
  [USER_ROLES.RECEPTION]: "Reception",
  [USER_ROLES.HOUSEKEEPING]: "Housekeeping",
  [USER_ROLES.ACCOUNTANT]: "Accountant",
} as const;

// ID Proof Types
export const ID_PROOF_TYPES = {
  AADHAR: "aadhar",
  PASSPORT: "passport",
  DRIVING_LICENSE: "driving_license",
  VOTER_ID: "voter_id",
  PAN: "pan",
} as const;

export const ID_PROOF_LABELS = {
  [ID_PROOF_TYPES.AADHAR]: "Aadhar Card",
  [ID_PROOF_TYPES.PASSPORT]: "Passport",
  [ID_PROOF_TYPES.DRIVING_LICENSE]: "Driving License",
  [ID_PROOF_TYPES.VOTER_ID]: "Voter ID",
  [ID_PROOF_TYPES.PAN]: "PAN Card",
} as const;

// GST & Tax
export const GST_RATES = {
  CGST: 6.0,
  SGST: 6.0,
  IGST: 12.0,
} as const;

export const HSN_SAC_CODES = {
  ACCOMMODATION: "996311",
  FOOD_BEVERAGE: "996331",
  LAUNDRY: "998519",
} as const;

// Date & Time
export const CHECK_IN_TIME = "14:00";
export const CHECK_OUT_TIME = "11:00";

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Navigation
export const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    title: "Rooms",
    href: "/rooms",
    icon: "Bed",
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: "Calendar",
  },
  {
    title: "Active Stays",
    href: "/active-stays",
    icon: "Users",
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: "FileText",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: "BarChart",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
  },
] as const;
