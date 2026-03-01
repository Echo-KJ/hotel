"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/useUIStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const { sidebarCollapsed } = useUIStore();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // This shouldn't happen due to middleware, but just in case
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 print:ml-0",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Header */}
        <div className="print:hidden">
          <Header />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-muted/10 mt-16 print:mt-0 print:bg-white print:overflow-visible">
          <div className="container mx-auto p-6 print:p-0 print:w-full print:max-w-none">
            <div className="print:hidden">
              <Breadcrumbs />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
