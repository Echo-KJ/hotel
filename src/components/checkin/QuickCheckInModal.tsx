"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, differenceInDays, addDays } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import { calculateGST } from "@/lib/tax/gst";
import { toast } from "sonner";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Search, Calculator, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const quickCheckInSchema = z.object({
    phone: z.string().min(10, "Phone number required").max(15),
    firstName: z.string().min(1, "First name required"),
    lastName: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    roomId: z.string().min(1, "Room is required"),
    checkInDate: z.string(),
    checkOutDate: z.string(),
    ratePerNight: z.coerce.number().min(0, "Rate must be positive"),
    adults: z.coerce.number().min(1, "At least 1 adult"),
    children: z.coerce.number().min(0).default(0),
    advanceAmount: z.coerce.number().min(0).default(0),
    paymentMethod: z.string().default("cash"),
});

type FormData = z.infer<typeof quickCheckInSchema>;

interface QuickCheckInModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function QuickCheckInModal({ open, onOpenChange, onSuccess }: QuickCheckInModalProps) {
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState<any[]>([]);
    const [guestFound, setGuestFound] = useState<any>(null);
    const [searchingGuest, setSearchingGuest] = useState(false);
    const [gstSummary, setGstSummary] = useState<any>(null);

    const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(quickCheckInSchema),
        defaultValues: {
            checkInDate: format(new Date(), "yyyy-MM-dd"),
            checkOutDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
            adults: 1,
            children: 0,
            advanceAmount: 0,
            paymentMethod: "cash",
        }
    });

    const checkInDate = watch("checkInDate");
    const checkOutDate = watch("checkOutDate");
    const ratePerNight = watch("ratePerNight");
    const phoneNumber = watch("phone");

    // Fetch available rooms
    useEffect(() => {
        if (open) {
            fetchAvailableRooms();
        }
    }, [open]);

    // Search Guest by Phone
    useEffect(() => {
        const searchGuest = async () => {
            if (phoneNumber && phoneNumber.length >= 10) {
                setSearchingGuest(true);
                const { data } = await supabase
                    .from("guests")
                    .select("*")
                    .eq("phone", phoneNumber)
                    .single();

                if (data) {
                    setGuestFound(data);
                    setValue("firstName", data.first_name);
                    setValue("lastName", data.last_name || "");
                    setValue("email", data.email || "");
                    toast.success("Returning guest found!");
                } else {
                    setGuestFound(null);
                }
                setSearchingGuest(false);
            }
        };

        const timeout = setTimeout(searchGuest, 1000); // Debounce
        return () => clearTimeout(timeout);
    }, [phoneNumber, setValue]);

    // Calculate GST Summary
    useEffect(() => {
        if (checkInDate && checkOutDate && ratePerNight >= 0) {
            const start = new Date(checkInDate);
            const end = new Date(checkOutDate);
            const nights = differenceInDays(end, start);

            if (nights > 0) {
                const baseTotal = ratePerNight * nights;
                const gstData = calculateGST(baseTotal, ratePerNight);
                setGstSummary({ ...gstData, nights });
            } else {
                setGstSummary(null);
            }
        }
    }, [checkInDate, checkOutDate, ratePerNight]);

    async function fetchAvailableRooms() {
        const { data } = await supabase
            .from("rooms")
            .select("id, room_number, category:room_categories(name, base_price)")
            .eq("status", "vacant_clean") // Or use available logic with dates
            .order("room_number");
        setRooms(data || []);
    }

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const { data: user } = await supabase.auth.getUser();

            const { error } = await supabase.rpc("process_quick_checkin", {
                p_guest_first_name: data.firstName,
                p_guest_last_name: data.lastName,
                p_guest_phone: data.phone,
                p_guest_email: data.email || null,
                p_room_id: data.roomId,
                p_check_in_date: data.checkInDate,
                p_check_out_date: data.checkOutDate,
                p_rate_per_night: data.ratePerNight,
                p_adults: data.adults,
                p_children: data.children,
                p_advance_amount: data.advanceAmount,
                p_payment_method: data.paymentMethod,
                p_performed_by: user.user?.id
            });

            if (error) throw error;

            toast.success("Check-in successful!");
            onSuccess?.();
            onOpenChange(false);
            reset();
            setGuestFound(null);
            setGstSummary(null);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Quick Check-In</DialogTitle>
                    <DialogDescription>
                        Process a new walk-in or reservation quickly.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Guest Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 border-b pb-1">Guest Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number *</Label>
                                <div className="relative">
                                    <Input id="phone" {...register("phone")} placeholder="9876543210" />
                                    {searchingGuest && <LoadingSpinner size="sm" className="absolute right-2 top-2.5" />}
                                </div>
                                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" {...register("email")} placeholder="guest@example.com" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input id="firstName" {...register("firstName")} disabled={!!guestFound} />
                                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" {...register("lastName")} disabled={!!guestFound} />
                            </div>
                        </div>
                        {guestFound && (
                            <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Returning Guest • {guestFound.total_stays} Stays • Spent ₹{guestFound.total_spent}
                            </div>
                        )}
                    </div>

                    {/* Stay Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 border-b pb-1">Stay Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="checkInDate">Check-in</Label>
                                <Input id="checkInDate" type="date" {...register("checkInDate")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="checkOutDate">Check-out</Label>
                                <Input id="checkOutDate" type="date" {...register("checkOutDate")} />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="roomId">Select Room *</Label>
                                <Controller
                                    name="roomId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={(val) => {
                                            field.onChange(val);
                                            const room = rooms.find(r => r.id === val);
                                            if (room && room.category?.base_price) {
                                                setValue("ratePerNight", room.category.base_price);
                                            }
                                        }} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a room" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {rooms.map((room) => (
                                                    <SelectItem key={room.id} value={room.id}>
                                                        Room {room.room_number} - {room.category?.name} (₹{room.category?.base_price})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.roomId && <p className="text-xs text-red-500">{errors.roomId.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ratePerNight">Rate per Night (₹) *</Label>
                                <Input id="ratePerNight" type="number" {...register("ratePerNight")} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adults">Adults</Label>
                                <Input id="adults" type="number" min={1} {...register("adults")} />
                            </div>
                        </div>

                        {/* Live GST Calculation */}
                        {gstSummary && (
                            <div className="bg-slate-50 p-3 rounded-md text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span>Rate ({gstSummary.nights} nights):</span>
                                    <span>₹{gstSummary.baseAmount}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>GST ({gstSummary.rates.slabLabel}):</span>
                                    <span>₹{gstSummary.gstAmount}</span>
                                </div>
                                <div className="flex justify-between font-bold border-t pt-1 mt-1">
                                    <span>Grand Total:</span>
                                    <span>₹{gstSummary.grandTotal}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 border-b pb-1">Payment</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="advanceAmount">Advance Amount</Label>
                                <Input id="advanceAmount" type="number" min="0" {...register("advanceAmount")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentMethod">Payment Method</Label>
                                <Controller
                                    name="paymentMethod"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="upi">UPI</SelectItem>
                                                <SelectItem value="card">Card</SelectItem>
                                                <SelectItem value="online">Online</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Complete Check-In
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
