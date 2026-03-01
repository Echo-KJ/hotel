"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Bed, DollarSign, Users, ChevronRight } from "lucide-react";

const settingsSections = [
  {
    title: "Hotel Details",
    description: "Manage your hotel information, contact details, and tax settings",
    icon: Building2,
    href: "/settings/hotel-details",
    color: "text-blue-600",
  },
  {
    title: "Room Categories",
    description: "Create and manage different types of rooms in your hotel",
    icon: Bed,
    href: "/settings/room-categories",
    color: "text-green-600",
  },
  {
    title: "Taxes",
    description: "Configure GST rates and other tax settings",
    icon: DollarSign,
    href: "/settings/taxes",
    color: "text-orange-600",
  },
  {
    title: "Users",
    description: "Manage staff accounts and permissions",
    icon: Users,
    href: "/settings/users",
    color: "text-purple-600",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your hotel configuration and preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-muted", section.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle>{section.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {section.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 text-white p-2 rounded-lg">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Settings Module Complete! 🎉</h3>
              <p className="text-sm text-blue-800 mt-1">
                You can now configure your hotel details and manage room categories. 
                In the next steps, we'll build out the remaining modules like room management, 
                bookings, and invoicing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
