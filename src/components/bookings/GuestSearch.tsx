"use client";

import { useState } from "react";
import { useGuestStore } from "@/store/useGuestStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, User, Phone, Mail, CreditCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guestSchema, type GuestFormData } from "@/lib/validations/booking";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import type { Guest } from "@/types";

const ID_PROOF_TYPES = [
  { value: "aadhar",          label: "Aadhaar Card" },
  { value: "passport",        label: "Passport" },
  { value: "driving_license", label: "Driving Licence" },
  { value: "voter_id",        label: "Voter ID" },
  { value: "pan",             label: "PAN Card" },
];

interface GuestSearchProps {
  onSelectGuest: (guest: Guest) => void;
  selectedGuest?: Guest | null;
}

export function GuestSearch({ onSelectGuest, selectedGuest }: GuestSearchProps) {
  const { searchGuests, createGuest } = useGuestStore();
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [showNewGuestDialog, setShowNewGuestDialog] = useState(false);
  const [isCreating, setIsCreating]       = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchGuests(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleCreateGuest = async (data: GuestFormData) => {
    setIsCreating(true);
    const { error, data: newGuest } = await createGuest(data);
    if (error) {
      toast.error("Failed to create guest");
      setIsCreating(false);
    } else if (newGuest) {
      toast.success("Guest created successfully");
      onSelectGuest(newGuest);
      setShowNewGuestDialog(false);
      reset();
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Guest Information</Label>
        <p className="text-sm text-muted-foreground">
          Search for an existing guest or create a new one
        </p>
      </div>

      {/* ── Selected guest card ─────────────────────────────────── */}
      {selectedGuest ? (
        <Card className="border-2 border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{selectedGuest.full_name}</CardTitle>
                <CardDescription className="mt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {selectedGuest.phone}
                  </div>
                  {selectedGuest.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {selectedGuest.email}
                    </div>
                  )}
                  {selectedGuest.id_proof_type && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3" />
                      {ID_PROOF_TYPES.find(t => t.value === selectedGuest.id_proof_type)?.label}
                      {selectedGuest.id_proof_number && ` — ${selectedGuest.id_proof_number}`}
                    </div>
                  )}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => onSelectGuest(null as any)}>
                Change
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <>
          {/* ── Search bar ──────────────────────────────────────── */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <LoadingSpinner size="sm" /> : "Search"}
            </Button>
            <Button variant="outline" onClick={() => setShowNewGuestDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Guest
            </Button>
          </div>

          {/* ── Search results ──────────────────────────────────── */}
          {isSearching && (
            <div className="flex items-center justify-center p-4">
              <LoadingSpinner size="sm" />
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((guest) => (
                <Card
                  key={guest.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    onSelectGuest(guest);
                    setSearchResults([]);
                    setSearchQuery("");
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{guest.full_name}</p>
                        <p className="text-sm text-muted-foreground">{guest.phone}</p>
                        {guest.email && (
                          <p className="text-sm text-muted-foreground">{guest.email}</p>
                        )}
                        {guest.id_proof_type && (
                          <p className="text-sm text-muted-foreground">
                            {ID_PROOF_TYPES.find(t => t.value === guest.id_proof_type)?.label}
                            {guest.id_proof_number && ` — ${guest.id_proof_number}`}
                          </p>
                        )}
                      </div>
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── New Guest Dialog ────────────────────────────────────── */}
      <Dialog open={showNewGuestDialog} onOpenChange={setShowNewGuestDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Guest</DialogTitle>
            <DialogDescription>Add a new guest to the system</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleCreateGuest)} className="space-y-6">

            {/* ── Personal Details ──────────────────────────────── */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Personal Details
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" {...register("first_name")} placeholder="Rajesh" />
                  {errors.first_name && (
                    <p className="text-sm text-red-600">{errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" {...register("last_name")} placeholder="Kumar" />
                </div>
              </div>
            </div>

            {/* ── Contact Details ───────────────────────────────── */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Contact Details
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" {...register("phone")} placeholder="+91 98765 43210" />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} placeholder="rajesh@email.com" />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── ID Proof ──────────────────────────────────────── */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                ID Proof
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="id_proof_type">ID Type</Label>
                  <Select onValueChange={(val) => setValue("id_proof_type", val as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ID_PROOF_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_proof_number">ID Number</Label>
                  <Input
                    id="id_proof_number"
                    {...register("id_proof_number")}
                    placeholder="e.g. 1234 5678 9012"
                  />
                  {errors.id_proof_number && (
                    <p className="text-sm text-red-600">{errors.id_proof_number.message}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Required by law for all hotel guests in India
              </p>
            </div>

            {/* ── Address ───────────────────────────────────────── */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Address
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Textarea id="address" {...register("address")} rows={2} placeholder="123, MG Road" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("city")} placeholder="Mumbai" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" {...register("state")} placeholder="Maharashtra" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input id="pincode" {...register("pincode")} placeholder="400001" />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowNewGuestDialog(false); reset(); }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating…
                  </>
                ) : (
                  "Create Guest"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
