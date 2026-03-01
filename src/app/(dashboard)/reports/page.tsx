"use client";

import { useEffect, useState } from "react";
import { useReportsStore } from "@/store/useReportsStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  FileText,
  Download,
  RefreshCw,
  DollarSign,
  Receipt,
  Wallet,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type Tab = "daily" | "monthly" | "bookings";

export default function ReportsPage() {
  const {
    bookingRecords,
    dailyReport,
    monthlyReports,
    loading,
    selectedDate,
    selectedMonth,
    selectedYear,
    fetchBookingRecords,
    fetchDailyReport,
    fetchMonthlyReports,
    setSelectedDate,
    setSelectedMonth,
    setSelectedYear,
  } = useReportsStore();

  const [activeTab, setActiveTab] = useState<Tab>("daily");

  useEffect(() => {
    fetchDailyReport(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    fetchMonthlyReports(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    if (activeTab === "bookings") {
      fetchBookingRecords();
    }
  }, [activeTab]);

  const exportDailyCSV = () => {
    if (!dailyReport) return;
    const rows = [
      ["DAILY REPORT", dailyReport.date],
      [],
      ["OPERATIONS"],
      ["New Bookings", dailyReport.new_bookings],
      ["Check-ins", dailyReport.check_ins],
      ["Check-outs", dailyReport.check_outs],
      ["Occupied Rooms", `${dailyReport.occupied_rooms} / ${dailyReport.total_rooms}`],
      ["Occupancy Rate", `${dailyReport.occupancy_rate.toFixed(1)}%`],
      [],
      ["REVENUE"],
      ["Room Revenue", dailyReport.room_revenue],
      ["Additional Revenue", dailyReport.additional_revenue],
      ["Total Revenue", dailyReport.total_revenue],
      [],
      ["TAX COLLECTED"],
      ["CGST (6%)", dailyReport.cgst_collected],
      ["SGST (6%)", dailyReport.sgst_collected],
      ["Total Tax", dailyReport.total_tax],
      [],
      ["PAYMENT BREAKDOWN"],
      ["Cash", dailyReport.cash_received],
      ["Card", dailyReport.card_received],
      ["Online", dailyReport.online_received],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadCSV(csv, `daily-report-${dailyReport.date}.csv`);
  };

  const exportBookingsCSV = () => {
    const headers = [
      "Booking ID", "Date", "Guest", "Room", "Nights",
      "Room Price", "Additional Charges", "Subtotal",
      "CGST", "SGST", "Tax Total", "Grand Total",
      "Advance Paid", "Balance Due", "Payment Method", "Status",
    ];
    const rows = bookingRecords.map((r) => [
      r.booking_number, r.date, r.guest_name, r.room_number, r.nights,
      r.room_price, r.additional_charges, r.subtotal,
      r.cgst.toFixed(2), r.sgst.toFixed(2), r.tax_amount.toFixed(2), r.total_paid.toFixed(2),
      r.advance_paid, r.balance_due.toFixed(2), r.payment_method, r.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    downloadCSV(csv, `bookings-financial-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportMonthlyCSV = () => {
    const headers = [
      "Month", "Bookings", "Room Revenue", "Additional Revenue",
      "Total Revenue", "CGST", "SGST", "Total Tax",
      "Cash", "Card", "Online",
    ];
    const rows = monthlyReports.map((r) => [
      r.month, r.total_bookings, r.room_revenue, r.additional_revenue,
      r.total_revenue, r.cgst_collected.toFixed(2), r.sgst_collected.toFixed(2),
      r.total_tax_collected.toFixed(2), r.cash_total, r.card_total, r.online_total,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    downloadCSV(csv, `monthly-report-${selectedYear}.csv`);
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "daily" as Tab, label: "Daily Report", icon: Calendar },
    { id: "monthly" as Tab, label: "Monthly Accounts", icon: BarChart3 },
    { id: "bookings" as Tab, label: "Booking Records", icon: FileText },
  ];

  // Calculate monthly totals for the year
  const yearTotals = monthlyReports.reduce(
    (acc, m) => ({
      revenue: acc.revenue + m.total_revenue,
      tax: acc.tax + m.total_tax_collected,
      bookings: acc.bookings + m.total_bookings,
    }),
    { revenue: 0, tax: 0, bookings: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Accounting</h1>
          <p className="text-muted-foreground mt-1">
            Financial records, tax tracking, and business intelligence
          </p>
        </div>
      </div>

      {/* Legal Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">What this system tracks for you:</p>
              <p className="text-sm text-blue-800 mt-1">
                Every booking is recorded with Booking ID, date, room price, tax collected (CGST + SGST), total amount, and payment method.
                Use the <strong>Daily Report</strong> to close your books each evening.
                Use <strong>Monthly Accounts</strong> to calculate how much GST to pay the government.
                This system does not pay tax — it tells you exactly how much to pay.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────── */}
      {/* TAB 1: DAILY REPORT                           */}
      {/* ─────────────────────────────────────────────── */}
      {activeTab === "daily" && (
        <div className="space-y-6">
          {/* Date Picker */}
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <Label>Select Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => fetchDailyReport(selectedDate)}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportDailyCSV} disabled={!dailyReport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {loading && !dailyReport ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : dailyReport ? (
            <>
              {/* Operations Summary */}
              <div className="grid gap-4 md:grid-cols-5">
                {[
                  { label: "New Bookings", value: dailyReport.new_bookings, sub: "created today" },
                  { label: "Check-ins", value: dailyReport.check_ins, sub: "arrived today" },
                  { label: "Check-outs", value: dailyReport.check_outs, sub: "departed today" },
                  {
                    label: "Occupancy",
                    value: `${dailyReport.occupancy_rate.toFixed(0)}%`,
                    sub: `${dailyReport.occupied_rooms}/${dailyReport.total_rooms} rooms`,
                  },
                  {
                    label: "Total Revenue",
                    value: formatCurrency(dailyReport.total_revenue),
                    sub: "before tax",
                    highlight: true,
                  },
                ].map((s) => (
                  <Card key={s.label} className={s.highlight ? "border-green-200 bg-green-50" : ""}>
                    <CardContent className="pt-4 pb-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${s.highlight ? "text-green-700" : ""}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Revenue Breakdown */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Revenue Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Room Revenue</span>
                      <span className="font-medium">{formatCurrency(dailyReport.room_revenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Additional (food/services)</span>
                      <span className="font-medium">{formatCurrency(dailyReport.additional_revenue)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-3">
                      <span>Total Revenue</span>
                      <span className="text-green-700">{formatCurrency(dailyReport.total_revenue)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Tax Collected — THIS IS WHAT YOU PAY GOVERNMENT */}
                <Card className="border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Receipt className="h-4 w-4 text-orange-600" />
                      Tax Collected Today
                    </CardTitle>
                    <CardDescription>Amount to set aside for GST payment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CGST (6%)</span>
                      <span className="font-medium">{formatCurrency(dailyReport.cgst_collected)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SGST (6%)</span>
                      <span className="font-medium">{formatCurrency(dailyReport.sgst_collected)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-3 text-orange-700">
                      <span>Total GST Collected</span>
                      <span>{formatCurrency(dailyReport.total_tax)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 bg-orange-50 p-2 rounded">
                      ⚠️ This money belongs to the government. Keep it separate from your income.
                    </p>
                  </CardContent>
                </Card>

                {/* Payment Method Breakdown */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      Payment Methods
                    </CardTitle>
                    <CardDescription>How money was collected today</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">Cash</span>
                      </div>
                      <span className="font-medium">{formatCurrency(dailyReport.cash_received)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-muted-foreground">Card</span>
                      </div>
                      <span className="font-medium">{formatCurrency(dailyReport.card_received)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <span className="text-muted-foreground">Online / OTA</span>
                      </div>
                      <span className="font-medium">{formatCurrency(dailyReport.online_received)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-3">
                      <span>Total Collected</span>
                      <span>
                        {formatCurrency(
                          dailyReport.cash_received + dailyReport.card_received + dailyReport.online_received
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* End of Day Checklist */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      End of Day Checklist
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      `Room revenue recorded: ${formatCurrency(dailyReport.room_revenue)}`,
                      `Additional charges recorded: ${formatCurrency(dailyReport.additional_revenue)}`,
                      `GST collected set aside: ${formatCurrency(dailyReport.total_tax)}`,
                      `Cash counted: ${formatCurrency(dailyReport.cash_received)}`,
                      `Card payments verified: ${formatCurrency(dailyReport.card_received)}`,
                      `Online payments checked: ${formatCurrency(dailyReport.online_received)}`,
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-green-800">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm font-bold text-green-900">
                        Net Income (after tax): {formatCurrency(dailyReport.total_revenue)}
                      </p>
                      <p className="text-xs text-green-700">
                        GST ({formatCurrency(dailyReport.total_tax)}) is NOT your income
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No data found for this date.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────── */}
      {/* TAB 2: MONTHLY ACCOUNTING                     */}
      {/* ─────────────────────────────────────────────── */}
      {activeTab === "monthly" && (
        <div className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-32"
                min="2020"
                max="2099"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => fetchMonthlyReports(selectedYear)}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportMonthlyCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export Year CSV
            </Button>
          </div>

          {/* Year Totals */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Year Revenue</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(yearTotals.revenue)}</p>
                <p className="text-xs text-muted-foreground">{selectedYear}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total GST to Pay</p>
                <p className="text-2xl font-bold text-orange-700">{formatCurrency(yearTotals.tax)}</p>
                <p className="text-xs text-muted-foreground">Pay to government quarterly</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Bookings</p>
                <p className="text-2xl font-bold text-blue-700">{yearTotals.bookings}</p>
                <p className="text-xs text-muted-foreground">All statuses</p>
              </CardContent>
            </Card>
          </div>

          {/* Tax Notice */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-900">Monthly Tax Process (Real Hotels)</p>
                  <p className="text-sm text-orange-800 mt-1">
                    At the end of each month: total your CGST + SGST collected → that is what you file with the government.
                    Your <strong>taxable income</strong> = Total Revenue − GST Collected − Operating Expenses.
                    This system tracks what you collected — your accountant calculates your final tax liability.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Table */}
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Month-by-Month Breakdown — {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-semibold text-muted-foreground">Month</th>
                        <th className="pb-3 font-semibold text-muted-foreground text-right">Bookings</th>
                        <th className="pb-3 font-semibold text-muted-foreground text-right">Revenue</th>
                        <th className="pb-3 font-semibold text-muted-foreground text-right">CGST</th>
                        <th className="pb-3 font-semibold text-muted-foreground text-right">SGST</th>
                        <th className="pb-3 font-semibold text-muted-foreground text-right text-orange-700">GST Total</th>
                        <th className="pb-3 font-semibold text-muted-foreground text-right">Cash</th>
                        <th className="pb-3 font-semibold text-muted-foreground text-right">Card</th>
                        <th className="pb-3 font-semibold text-muted-foreground text-right">Online</th>
                        <th className="pb-3 font-semibold text-muted-foreground text-right">Top Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReports.map((m, i) => (
                        <tr key={i} className={`border-b last:border-0 ${m.total_bookings === 0 ? "opacity-40" : ""}`}>
                          <td className="py-3 font-medium">{m.month}</td>
                          <td className="py-3 text-right">{m.total_bookings || "—"}</td>
                          <td className="py-3 text-right font-medium text-green-700">
                            {m.total_revenue > 0 ? formatCurrency(m.total_revenue) : "—"}
                          </td>
                          <td className="py-3 text-right text-orange-600">
                            {m.cgst_collected > 0 ? formatCurrency(m.cgst_collected) : "—"}
                          </td>
                          <td className="py-3 text-right text-orange-600">
                            {m.sgst_collected > 0 ? formatCurrency(m.sgst_collected) : "—"}
                          </td>
                          <td className="py-3 text-right font-semibold text-orange-700">
                            {m.total_tax_collected > 0 ? formatCurrency(m.total_tax_collected) : "—"}
                          </td>
                          <td className="py-3 text-right">{m.cash_total > 0 ? formatCurrency(m.cash_total) : "—"}</td>
                          <td className="py-3 text-right">{m.card_total > 0 ? formatCurrency(m.card_total) : "—"}</td>
                          <td className="py-3 text-right">{m.online_total > 0 ? formatCurrency(m.online_total) : "—"}</td>
                          <td className="py-3 text-right text-muted-foreground">{m.top_room_category}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-muted/50">
                        <td className="py-3 font-bold">TOTAL</td>
                        <td className="py-3 text-right font-bold">{yearTotals.bookings}</td>
                        <td className="py-3 text-right font-bold text-green-700">{formatCurrency(yearTotals.revenue)}</td>
                        <td className="py-3 text-right font-bold text-orange-600">
                          {formatCurrency(monthlyReports.reduce((s, m) => s + m.cgst_collected, 0))}
                        </td>
                        <td className="py-3 text-right font-bold text-orange-600">
                          {formatCurrency(monthlyReports.reduce((s, m) => s + m.sgst_collected, 0))}
                        </td>
                        <td className="py-3 text-right font-bold text-orange-700">{formatCurrency(yearTotals.tax)}</td>
                        <td className="py-3 text-right font-bold">
                          {formatCurrency(monthlyReports.reduce((s, m) => s + m.cash_total, 0))}
                        </td>
                        <td className="py-3 text-right font-bold">
                          {formatCurrency(monthlyReports.reduce((s, m) => s + m.card_total, 0))}
                        </td>
                        <td className="py-3 text-right font-bold">
                          {formatCurrency(monthlyReports.reduce((s, m) => s + m.online_total, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────── */}
      {/* TAB 3: BOOKING FINANCIAL RECORDS              */}
      {/* ─────────────────────────────────────────────── */}
      {activeTab === "bookings" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {bookingRecords.length} records — minimum legal requirement for hotel operation
            </p>
            <Button variant="outline" onClick={exportBookingsCSV} disabled={bookingRecords.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export All (CSV)
            </Button>
          </div>

          {/* What this stores — legal requirement callout */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">✅ Minimum Legal Records Stored Per Booking:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  "Booking ID / Number",
                  "Date of stay",
                  "Room price charged",
                  "Tax amount (CGST + SGST)",
                  "Total paid by guest",
                  "Payment method",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-sm text-blue-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : bookingRecords.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No booking records found. Create and complete bookings to see records here.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        {[
                          "Booking ID", "Date", "Guest", "Room",
                          "Nights", "Room Price", "Extras", "Subtotal",
                          "CGST", "SGST", "Total (incl. tax)",
                          "Advance Paid", "Balance Due", "Method", "Status",
                        ].map((h) => (
                          <th key={h} className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookingRecords.map((r) => (
                        <tr key={r.booking_id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-3 font-mono text-xs">{r.booking_number}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{r.date}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{r.guest_name}</td>
                          <td className="px-3 py-3">{r.room_number}</td>
                          <td className="px-3 py-3 text-center">{r.nights}</td>
                          <td className="px-3 py-3 text-right">{formatCurrency(r.room_price)}</td>
                          <td className="px-3 py-3 text-right">
                            {r.additional_charges > 0 ? formatCurrency(r.additional_charges) : "—"}
                          </td>
                          <td className="px-3 py-3 text-right font-medium">{formatCurrency(r.subtotal)}</td>
                          <td className="px-3 py-3 text-right text-orange-600">{formatCurrency(r.cgst)}</td>
                          <td className="px-3 py-3 text-right text-orange-600">{formatCurrency(r.sgst)}</td>
                          <td className="px-3 py-3 text-right font-bold">{formatCurrency(r.total_paid)}</td>
                          <td className="px-3 py-3 text-right text-green-600">{formatCurrency(r.advance_paid)}</td>
                          <td className={`px-3 py-3 text-right font-medium ${r.balance_due > 0 ? "text-red-600" : "text-green-600"}`}>
                            {r.balance_due > 0 ? formatCurrency(r.balance_due) : "Paid"}
                          </td>
                          <td className="px-3 py-3 capitalize">
                            <Badge variant="outline" className="text-xs">
                              {r.payment_method}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 capitalize text-muted-foreground text-xs">{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/50 font-bold">
                      <tr>
                        <td colSpan={5} className="px-3 py-3">TOTALS ({bookingRecords.length} bookings)</td>
                        <td className="px-3 py-3 text-right">
                          {formatCurrency(bookingRecords.reduce((s, r) => s + r.room_price, 0))}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatCurrency(bookingRecords.reduce((s, r) => s + r.additional_charges, 0))}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatCurrency(bookingRecords.reduce((s, r) => s + r.subtotal, 0))}
                        </td>
                        <td className="px-3 py-3 text-right text-orange-600">
                          {formatCurrency(bookingRecords.reduce((s, r) => s + r.cgst, 0))}
                        </td>
                        <td className="px-3 py-3 text-right text-orange-600">
                          {formatCurrency(bookingRecords.reduce((s, r) => s + r.sgst, 0))}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatCurrency(bookingRecords.reduce((s, r) => s + r.total_paid, 0))}
                        </td>
                        <td className="px-3 py-3 text-right text-green-600">
                          {formatCurrency(bookingRecords.reduce((s, r) => s + r.advance_paid, 0))}
                        </td>
                        <td className="px-3 py-3 text-right text-red-600">
                          {formatCurrency(bookingRecords.reduce((s, r) => s + r.balance_due, 0))}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
