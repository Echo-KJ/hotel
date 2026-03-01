"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSettingsStore } from "@/store/useSettingsStore";
import { hotelSettingsSchema, type HotelSettingsFormData } from "@/lib/validations/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import { Save, Building2 } from "lucide-react";

export default function HotelDetailsPage() {
  const { hotelSettings, loading, fetchHotelSettings, updateHotelSettings } = useSettingsStore();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<HotelSettingsFormData>({
    resolver: zodResolver(hotelSettingsSchema),
  });

  useEffect(() => {
    fetchHotelSettings();
  }, [fetchHotelSettings]);

  useEffect(() => {
    if (hotelSettings) {
      reset({
        hotel_name: hotelSettings.hotel_name,
        address: hotelSettings.address,
        city: hotelSettings.city || "",
        state: hotelSettings.state || "",
        pincode: hotelSettings.pincode || "",
        country: hotelSettings.country,
        phone: hotelSettings.phone || "",
        email: hotelSettings.email || "",
        website: hotelSettings.website || "",
        gstin: hotelSettings.gstin || "",
        gstin_registered_name: hotelSettings.gstin_registered_name || "",
        gstin_state_code: hotelSettings.gstin_state_code || "",
        pan: hotelSettings.pan || "",
        sac_code: hotelSettings.sac_code,
        sac_code_accommodation: hotelSettings.sac_code_accommodation || "998111",
        sac_code_food: hotelSettings.sac_code_food || "996311",
        sac_code_laundry: hotelSettings.sac_code_laundry || "998713",
        sac_code_other: hotelSettings.sac_code_other || "999799",
        invoice_prefix: hotelSettings.invoice_prefix,
        invoice_footer_text: hotelSettings.invoice_footer_text || "",
        terms_and_conditions: hotelSettings.terms_and_conditions || "",
      });
    }
  }, [hotelSettings, reset]);

  const onSubmit = async (data: HotelSettingsFormData) => {
    setIsSaving(true);
    const { error } = await updateHotelSettings(data);

    if (error) {
      toast.error("Failed to update hotel details");
    } else {
      toast.success("Hotel details updated successfully");
      reset(data); // Reset form to mark as not dirty
    }
    setIsSaving(false);
  };

  if (loading && !hotelSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hotel Details</h1>
        <p className="text-muted-foreground mt-1">
          Manage your hotel information and settings
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Essential details about your hotel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hotel_name">Hotel Name *</Label>
                <Input
                  id="hotel_name"
                  {...register("hotel_name")}
                  placeholder="Grand Hotel"
                />
                {errors.hotel_name && (
                  <p className="text-sm text-red-600">{errors.hotel_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+91 98765 43210"
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="info@hotel.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...register("website")}
                  placeholder="https://www.hotel.com"
                />
                {errors.website && (
                  <p className="text-sm text-red-600">{errors.website.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="123 Main Street"
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="Mumbai"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="Maharashtra"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  {...register("pincode")}
                  placeholder="400001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...register("country")}
                placeholder="India"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax & Legal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Tax & Legal Information</CardTitle>
            <CardDescription>
              GST and tax-related details required for invoicing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  {...register("gstin")}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  className={errors.gstin ? "border-red-500" : ""}
                />
                {errors.gstin && (
                  <p className="text-sm text-red-600">{errors.gstin.message}</p>
                )}
                {!errors.gstin && !isDirty && !hotelSettings?.gstin && (
                  <p className="text-sm text-amber-600 font-medium">⚠️ GSTIN required for compliant invoices</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin_registered_name">Registered Business Name</Label>
                <Input
                  id="gstin_registered_name"
                  {...register("gstin_registered_name")}
                  placeholder="Official Business Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin_state_code">State Code (e.g. 27)</Label>
                <Input
                  id="gstin_state_code"
                  {...register("gstin_state_code")}
                  placeholder="27"
                  maxLength={2}
                />
                {errors.gstin_state_code && (
                  <p className="text-sm text-red-600">{errors.gstin_state_code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan">PAN</Label>
                <Input
                  id="pan"
                  {...register("pan")}
                  placeholder="AAAAA0000A"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3">SAC Codes (Service Accounting Codes)</h4>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="sac_code_accommodation">Accommodation</Label>
                  <Input id="sac_code_accommodation" {...register("sac_code_accommodation")} placeholder="998111" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sac_code_food">Food & Beverage</Label>
                  <Input id="sac_code_food" {...register("sac_code_food")} placeholder="996311" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sac_code_laundry">Laundry</Label>
                  <Input id="sac_code_laundry" {...register("sac_code_laundry")} placeholder="998713" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sac_code_other">Other Services</Label>
                  <Input id="sac_code_other" {...register("sac_code_other")} placeholder="999799" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
            <CardDescription>
              Customize your invoice appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
              <Input
                id="invoice_prefix"
                {...register("invoice_prefix")}
                placeholder="INV"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Example: INV-20240001
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_footer_text">Invoice Footer Text</Label>
              <Textarea
                id="invoice_footer_text"
                {...register("invoice_footer_text")}
                placeholder="Thank you for your business!"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
              <Textarea
                id="terms_and_conditions"
                {...register("terms_and_conditions")}
                placeholder="Check-in: 2:00 PM | Check-out: 11:00 AM"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={!isDirty || isSaving}
          >
            Reset
          </Button>
          <Button type="submit" disabled={!isDirty || isSaving}>
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
