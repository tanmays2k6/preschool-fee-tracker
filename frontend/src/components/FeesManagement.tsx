import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Receipt,
  Search,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { FeePayment, ACADEMIC_SESSIONS } from "@/types";
import {
  PREK_CLASSES,
  ACADEMIC_MONTH_NAMES,
  formatINR,
  normalizeClass,
  CLASS_ORDER,
  formatDateDDMMYYYY,
} from "@/lib/academicYear";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FeeReceipt } from "./FeeReceipt";
import { RecordPaymentDialog } from "./RecordPaymentDialog";

interface FeesManagementProps {
  onRefreshParent?: () => void;
  defaultTab?: "payments" | "class-status" | "overview";
}

export const FeesManagement = ({ onRefreshParent, defaultTab }: FeesManagementProps) => {
  const [activeTab, setActiveTab] = useState<"payments" | "class-status" | "overview">(
    defaultTab || "payments"
  );

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<FeePayment[]>([]);

  // Filters for Payments tab
  const [session, setSession] = useState("2026-27");
  const [classFilter, setClassFilter] = useState("all");
  const [feeTypeFilter, setFeeTypeFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Filters for Class-wise Monthly Fee Status tab
  const [statusClass, setStatusClass] = useState("LKG");
  const [statusMonth, setStatusMonth] = useState("August");
  const [statusSession, setStatusSession] = useState("2026-27");
  const [statusFilterMode, setStatusFilterMode] = useState<"all" | "paid" | "pending">("all");
  const [classStatusData, setClassStatusData] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Class overview state
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Dialogs
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<FeePayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);
  const [recordDialog, setRecordDialog] = useState<{
    open: boolean;
    studentId?: string;
    session?: string;
    feeType?: string;
    month?: string;
    amount?: number;
  }>({ open: false });

  const { toast } = useToast();

  const handleDeletePayment = async (p: FeePayment) => {
    const pid = p.id || p._id;
    if (!pid) return;
    setDeletingPayment(true);
    try {
      await api.delete(`/fees/${pid}`);
      toast({ title: "Payment record deleted successfully" });
      setSelectedReceipt(null);
      setPaymentToDelete(null);
      fetchPayments();
      if (activeTab === "class-status") fetchClassMonthlyStatus();
      if (activeTab === "overview") fetchClassOverview();
      if (onRefreshParent) onRefreshParent();
    } catch (error: any) {
      toast({
        title: "Error deleting payment",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingPayment(false);
    }
  };

  // Fetch all payment transactions matching combined filters
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (session && session !== "all") params.append("session", session);
      if (classFilter && classFilter !== "all") params.append("class", classFilter);
      if (feeTypeFilter && feeTypeFilter !== "all") params.append("feeType", feeTypeFilter);
      if (monthFilter && monthFilter !== "all") params.append("month", monthFilter);
      if (modeFilter && modeFilter !== "all") params.append("paymentMode", modeFilter);

      const { data } = await api.get(`/fees?${params.toString()}`);
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Failed to fetch payments",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [session, classFilter, feeTypeFilter, monthFilter, modeFilter, toast]);

  // Fetch class-wise monthly status (Paid vs Pending)
  const fetchClassMonthlyStatus = useCallback(async () => {
    if (!statusClass) return;
    setLoadingStatus(true);
    try {
      const params = new URLSearchParams();
      if (statusMonth && statusMonth !== "all") params.append("month", statusMonth);
      if (statusSession) params.append("session", statusSession);

      const { data } = await api.get(
        `/students/class/${statusClass}/monthly-status?${params.toString()}`
      );
      setClassStatusData(data);
    } catch (error: any) {
      toast({
        title: "Failed to fetch class fee status",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingStatus(false);
    }
  }, [statusClass, statusMonth, statusSession, toast]);

  // Fetch class overview (PG, NUR, LKG, UKG collection totals)
  const fetchClassOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const params = new URLSearchParams();
      if (session) params.append("session", session);
      const { data } = await api.get(`/students/class-fee-overview?${params.toString()}`);
      setOverviewData(data);
    } catch (error: any) {
      toast({
        title: "Failed to load class overview",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingOverview(false);
    }
  }, [session, toast]);

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPayments();
    } else if (activeTab === "class-status") {
      fetchClassMonthlyStatus();
    } else if (activeTab === "overview") {
      fetchClassOverview();
    }
  }, [activeTab, fetchPayments, fetchClassMonthlyStatus, fetchClassOverview]);

  // Filter payments by search
  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      const sName = p.student?.studentName?.toLowerCase() || "";
      const adm = p.student?.admissionNumber?.toLowerCase() || "";
      const rec = p.receiptNumber?.toLowerCase() || "";
      return sName.includes(q) || adm.includes(q) || rec.includes(q);
    });
  }, [payments, search]);

  const totalCollectedInView = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [filteredPayments]);

  const handleResetFilters = () => {
    setSession("2026-27");
    setClassFilter("all");
    setFeeTypeFilter("all");
    setMonthFilter("all");
    setModeFilter("all");
    setSearch("");
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const headers = [
      "Receipt No",
      "Payment Date",
      "Student Name",
      "Admission No",
      "Class",
      "Parent Name",
      "Session",
      "Month",
      "Fee Type",
      "Payment Mode",
      "Amount (INR)",
    ];

    const rows = filteredPayments.map((p) => [
      `"${p.receiptNumber || ""}"`,
      `"${formatDateDDMMYYYY(p.paymentDate)}"`,
      `"${p.student?.studentName || ""}"`,
      `"${p.student?.admissionNumber || ""}"`,
      `"${normalizeClass(p.student?.class) || ""}"`,
      `"${p.student?.fatherName || ""}"`,
      `"${p.session || ""}"`,
      `"${p.month || "-"}"`,
      `"${p.feeType}"`,
      `"${p.paymentMode}"`,
      p.amount || 0,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Fee_Payments_${classFilter}_${session}_${monthFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-school-navy">
                <Receipt className="h-5 w-5 text-school-orange" />
                Fee Management & Class Analysis
              </CardTitle>
              <CardDescription className="text-xs">
                FUN N LEARN SMART SCHOOL &bull; Class-wise collection, payment records, and monthly paid vs pending roster
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeTab === "payments") fetchPayments();
                  else if (activeTab === "class-status") fetchClassMonthlyStatus();
                  else fetchClassOverview();
                  if (onRefreshParent) onRefreshParent();
                }}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val: any) => setActiveTab(val)}
            className="w-full mt-4"
          >
            <TabsList className="grid grid-cols-3 w-full max-w-md h-auto p-1 bg-muted/70">
              <TabsTrigger value="payments" className="text-[11px] sm:text-xs font-semibold py-2 px-1">
                Payment History
              </TabsTrigger>
              <TabsTrigger value="class-status" className="text-[11px] sm:text-xs font-semibold py-2 px-1">
                Class Monthly
              </TabsTrigger>
              <TabsTrigger value="overview" className="text-[11px] sm:text-xs font-semibold py-2 px-1">
                Class Overview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          {/* TAB 1: PAYMENTS HISTORY WITH COMBINED FILTERS */}
          {activeTab === "payments" && (
            <div className="space-y-5">
              {/* Filter Toolbar */}
              <div className="p-4 rounded-xl bg-muted/40 border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5" /> Filters
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear Filters
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      disabled={filteredPayments.length === 0}
                      className="h-8 text-xs gap-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {/* Session */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Academic Session</Label>
                    <Select value={session} onValueChange={setSession}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACADEMIC_SESSIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Class */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Class</Label>
                    <Select value={classFilter} onValueChange={setClassFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {PREK_CLASSES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Month */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Month</Label>
                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {ACADEMIC_MONTH_NAMES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fee Type */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Fee Type</Label>
                    <Select value={feeTypeFilter} onValueChange={setFeeTypeFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fee Types</SelectItem>
                        <SelectItem value="monthly">Monthly Fee</SelectItem>
                        <SelectItem value="annual">Annual Charges</SelectItem>
                        <SelectItem value="uniform">Uniform</SelectItem>
                        <SelectItem value="books_stationery">Books & Kit</SelectItem>
                        <SelectItem value="misc">Miscellaneous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mode */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Payment Mode</Label>
                    <Select value={modeFilter} onValueChange={setModeFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modes</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online">Online / UPI</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Student / Adm / Rec"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 pl-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Collection in View</p>
                    <p className="text-lg font-bold text-primary flex items-center">
                      {formatINR(totalCollectedInView)}
                    </p>
                  </div>
                  <div className="border-l pl-4">
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <p className="text-lg font-semibold">{filteredPayments.length}</p>
                  </div>
                  <div className="border-l pl-4 hidden sm:block">
                    <p className="text-xs text-muted-foreground">Selected Class</p>
                    <p className="text-sm font-semibold">{classFilter === "all" ? "All Classes" : classFilter}</p>
                  </div>
                </div>
              </div>

              {/* Payments Table */}
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading fee records...</div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No payment records found matching the selected filters.
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Admn No.</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Session</TableHead>
                          <TableHead>Fee Type</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.map((p) => {
                          const pid = p.id || p._id;
                          const studentClass = normalizeClass(p.student?.class);
                          return (
                            <TableRow key={pid}>
                              <TableCell className="font-semibold text-xs text-primary">
                                {p.receiptNumber}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground font-mono">
                                {formatDateDDMMYYYY(p.paymentDate)}
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {p.student?.studentName || "-"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {p.student?.admissionNumber || "-"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-bold text-xs">
                                  {studentClass || p.student?.class || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{p.session}</TableCell>
                              <TableCell className="capitalize text-xs">
                                {p.feeType === "monthly" ? `${p.month || ""} Fee` : p.feeType}
                              </TableCell>
                              <TableCell className="capitalize text-xs">
                                <Badge variant="secondary" className="font-normal text-[11px]">
                                  {p.paymentMode}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold text-green-600">
                                {formatINR(p.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => setSelectedReceipt(p)}
                                    title="View / Print Receipt"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-primary" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setPaymentToDelete(p)}
                                    title="Delete Payment Record"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card List View */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {filteredPayments.map((p) => {
                      const pid = p.id || p._id;
                      const studentClass = normalizeClass(p.student?.class);
                      return (
                        <div key={pid} className="py-3.5 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-sm text-slate-900">
                                {p.student?.studentName || "Student"}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span className="font-mono">{p.student?.admissionNumber || "—"}</span>
                                <span>&bull;</span>
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-bold">
                                  {studentClass || p.student?.class || "PG"}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-base text-green-700">
                                {formatINR(p.amount)}
                              </div>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
                                {p.paymentMode}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-md">
                            <div>
                              <span>Receipt: </span>
                              <span className="font-mono font-semibold text-primary">{p.receiptNumber}</span>
                            </div>
                            <div>
                              <span>{formatDateDDMMYYYY(p.paymentDate)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-xs text-slate-600 capitalize">
                              {p.feeType === "monthly" ? `${p.month || ""} Tuition Fee` : p.feeType}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedReceipt(p)}
                                className="h-8 text-xs font-semibold gap-1 text-primary border-primary/30"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Receipt
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPaymentToDelete(p)}
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: CLASS-WISE MONTHLY STATUS (PAID VS PENDING) */}
          {activeTab === "class-status" && (
            <div className="space-y-6">
              {/* Class & Month Selector */}
              <div className="p-4 rounded-xl bg-muted/40 border grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Academic Session</Label>
                  <Select value={statusSession} onValueChange={setStatusSession}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_SESSIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Class</Label>
                  <Select value={statusClass} onValueChange={setStatusClass}>
                    <SelectTrigger className="h-9 font-bold text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PREK_CLASSES.map((c) => (
                        <SelectItem key={c} value={c} className="font-medium">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Month</Label>
                  <Select value={statusMonth} onValueChange={setStatusMonth}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_MONTH_NAMES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Filter Status</Label>
                  <Select
                    value={statusFilterMode}
                    onValueChange={(v: any) => setStatusFilterMode(v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="paid">Paid Only</SelectItem>
                      <SelectItem value="pending">Pending Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Header Banner */}
              {classStatusData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground font-medium">Total {statusClass} Students</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {classStatusData.totalStudents}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-4">
                      <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Paid for {statusMonth}
                      </p>
                      <p className="text-2xl font-bold text-green-700 mt-1">
                        {classStatusData.paidCount}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-4">
                      <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Pending Fee
                      </p>
                      <p className="text-2xl font-bold text-amber-700 mt-1">
                        {classStatusData.pendingCount}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="p-4">
                      <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5" /> Month Collection
                      </p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">
                        {formatINR(classStatusData.totalCollected)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Class Monthly Students Table */}
              {loadingStatus ? (
                <div className="text-center py-12 text-muted-foreground">
                  Analyzing {statusClass} fee status for {statusMonth}...
                </div>
              ) : !classStatusData || classStatusData.students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No students found in class {statusClass}.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {statusClass} — {statusMonth} {statusSession} Fee Status (
                      {classStatusData.students.length} Students)
                    </h3>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Admission No.</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Parent / Mobile</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Receipt / Date</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classStatusData.students
                          .filter((st: any) => {
                            if (statusFilterMode === "paid") return st.status === "paid";
                            if (statusFilterMode === "pending") return st.status === "pending";
                            return true;
                          })
                          .map((st: any) => {
                            const isPaid = st.status === "paid";
                            return (
                              <TableRow key={st.student.id}>
                                <TableCell className="font-semibold">
                                  {st.student.studentName}
                                </TableCell>
                                <TableCell className="text-xs font-mono">
                                  {st.student.admissionNumber}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-bold">
                                    {st.student.class}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {st.student.fatherName} ({st.student.contactNumber})
                                </TableCell>
                                <TableCell>
                                  {isPaid ? (
                                    <Badge className="bg-green-600 hover:bg-green-700 gap-1">
                                      <CheckCircle2 className="h-3 w-3" /> Paid
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 gap-1">
                                      <Clock className="h-3 w-3" /> Pending
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium text-sm">
                                  {isPaid ? formatINR(st.amount) : "—"}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground font-mono">
                                  {isPaid ? (
                                    <div>
                                      <span className="font-mono text-primary font-semibold">{st.receiptNumber}</span>
                                      <div className="text-[11px] text-muted-foreground">
                                        {formatDateDDMMYYYY(st.paymentDate)}
                                      </div>
                                    </div>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {isPaid ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setSelectedReceipt({
                                          id: st.paymentId,
                                          _id: st.paymentId,
                                          receiptNumber: st.receiptNumber,
                                          paymentDate: st.paymentDate,
                                          amount: st.amount,
                                          feeType: "monthly",
                                          month: statusMonth,
                                          session: statusSession,
                                          paymentMode: st.paymentMode,
                                          studentId: st.student.id,
                                          student: st.student,
                                        } as any)
                                      }
                                      className="h-8 text-xs gap-1 text-primary"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      Receipt
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        setRecordDialog({
                                          open: true,
                                          studentId: st.student.id,
                                          session: statusSession,
                                          feeType: "monthly",
                                          month: statusMonth,
                                          amount: st.student.monthlyFee || 1500,
                                        })
                                      }
                                      className="h-8 text-xs gap-1 bg-primary hover:bg-primary/90"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                      Collect Fee
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card List View for Class Status */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {classStatusData.students
                      .filter((st: any) => {
                        if (statusFilterMode === "paid") return st.status === "paid";
                        if (statusFilterMode === "pending") return st.status === "pending";
                        return true;
                      })
                      .map((st: any) => {
                        const isPaid = st.status === "paid";
                        return (
                          <div key={st.student.id} className="py-3.5 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-sm text-slate-900">
                                  {st.student.studentName}
                                </div>
                                <div className="text-xs font-mono text-muted-foreground mt-0.5">
                                  {st.student.admissionNumber} &bull; Parent: {st.student.fatherName || "—"}
                                </div>
                              </div>
                              <div>
                                {isPaid ? (
                                  <Badge className="bg-green-600 text-white text-[11px] gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Paid
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[11px] gap-1">
                                    <Clock className="h-3 w-3" /> Pending
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <div>
                                <span className="text-muted-foreground">Fee: </span>
                                <span className="font-bold text-slate-900">
                                  {isPaid ? formatINR(st.amount) : formatINR(st.student.monthlyFee || 1250)}
                                </span>
                                {isPaid && st.receiptNumber && (
                                  <span className="font-mono text-primary ml-2 font-semibold">
                                    #{st.receiptNumber}
                                  </span>
                                )}
                              </div>

                              <div>
                                {isPaid ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setSelectedReceipt({
                                        id: st.paymentId,
                                        _id: st.paymentId,
                                        receiptNumber: st.receiptNumber,
                                        paymentDate: st.paymentDate,
                                        amount: st.amount,
                                        feeType: "monthly",
                                        month: statusMonth,
                                        session: statusSession,
                                        paymentMode: st.paymentMode,
                                        studentId: st.student.id,
                                        student: st.student,
                                      } as any)
                                    }
                                    className="h-8 text-xs font-semibold gap-1 text-primary border-primary/30"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    Receipt
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      setRecordDialog({
                                        open: true,
                                        studentId: st.student.id,
                                        session: statusSession,
                                        feeType: "monthly",
                                        month: statusMonth,
                                        amount: st.student.monthlyFee || 1250,
                                      })
                                    }
                                    className="h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Collect Fee
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLASS-WISE FEE OVERVIEW (PG, NUR, LKG, UKG SUMMARY) */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border">
                <div>
                  <h3 className="font-semibold text-base">Class-wise Collection Summary</h3>
                  <p className="text-xs text-muted-foreground">
                    Aggregated preschool fee totals for academic session {session}
                  </p>
                </div>
                <div className="w-40">
                  <Select value={session} onValueChange={setSession}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_SESSIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loadingOverview ? (
                <div className="text-center py-12 text-muted-foreground">Calculating class fee breakdown...</div>
              ) : !overviewData ? (
                <div className="text-center py-12 text-muted-foreground">No data available</div>
              ) : (
                <div className="space-y-6">
                  {/* 4 Cards in preschool order (PG -> NUR -> LKG -> UKG) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {overviewData.classes.map((clsItem: any) => (
                      <Card key={clsItem.class} className="shadow-md hover:shadow-lg transition-all border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold">{clsItem.class}</CardTitle>
                            <Badge variant="outline">{clsItem.studentsCount} Students</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm pt-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Monthly Fees:</span>
                            <span className="font-medium text-foreground">{formatINR(clsItem.monthlyFees)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Annual Fees:</span>
                            <span className="font-medium text-foreground">{formatINR(clsItem.annualFees)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Other Fees:</span>
                            <span className="font-medium text-foreground">{formatINR(clsItem.otherFees)}</span>
                          </div>
                          <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base text-primary">
                            <span>Total:</span>
                            <span>{formatINR(clsItem.totalCollection)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Summary Comparison Table */}
                  <div className="p-4 rounded-xl border bg-card space-y-3">
                    <h4 className="text-sm font-semibold">Class Comparison Breakdown</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Class</TableHead>
                          <TableHead className="text-center">Enrolled Students</TableHead>
                          <TableHead className="text-right">Monthly Paid</TableHead>
                          <TableHead className="text-right">Annual Paid</TableHead>
                          <TableHead className="text-right">Other Fees</TableHead>
                          <TableHead className="text-right font-bold">Total Collection</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overviewData.classes.map((clsItem: any) => (
                          <TableRow key={clsItem.class}>
                            <TableCell className="font-bold text-primary">{clsItem.class}</TableCell>
                            <TableCell className="text-center">{clsItem.studentsCount}</TableCell>
                            <TableCell className="text-right">{formatINR(clsItem.monthlyFees)}</TableCell>
                            <TableCell className="text-right">{formatINR(clsItem.annualFees)}</TableCell>
                            <TableCell className="text-right">{formatINR(clsItem.otherFees)}</TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              {formatINR(clsItem.totalCollection)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell>Total (All Classes)</TableCell>
                          <TableCell className="text-center">{overviewData.totalStudents}</TableCell>
                          <TableCell className="text-right">
                            {formatINR(overviewData.classes.reduce((s: number, c: any) => s + c.monthlyFees, 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatINR(overviewData.classes.reduce((s: number, c: any) => s + c.annualFees, 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatINR(overviewData.classes.reduce((s: number, c: any) => s + c.otherFees, 0))}
                          </TableCell>
                          <TableCell className="text-right text-primary text-base">
                            {formatINR(overviewData.grandTotalCollection)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <FeeReceipt
          payment={selectedReceipt}
          open={!!selectedReceipt}
          onOpenChange={(open) => !open && setSelectedReceipt(null)}
          onDeletePayment={(p) => handleDeletePayment(p)}
        />
      )}

      {/* Double Check Delete Fee Payment Confirmation Dialog */}
      {paymentToDelete && (
        <AlertDialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Fee Payment Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete receipt{" "}
                <strong>{paymentToDelete.receiptNumber}</strong> (Amount: {formatINR(paymentToDelete.amount)}) for{" "}
                <strong>{paymentToDelete.student?.studentName || "the student"}</strong>?
                <br />
                <br />
                <span className="text-destructive font-medium">
                  This action cannot be undone and will update all balances and class summaries immediately.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingPayment}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={deletingPayment}
                onClick={() => handleDeletePayment(paymentToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingPayment ? "Deleting..." : "Confirm Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Record Payment Dialog */}
      {recordDialog.open && (
        <RecordPaymentDialog
          open={recordDialog.open}
          onOpenChange={(open) => setRecordDialog((prev) => ({ ...prev, open }))}
          initialStudentId={recordDialog.studentId}
          initialSession={recordDialog.session}
          initialFeeType={recordDialog.feeType}
          initialMonth={recordDialog.month}
          initialAmount={recordDialog.amount}
          onSuccess={() => {
            if (activeTab === "class-status") fetchClassMonthlyStatus();
            else if (activeTab === "payments") fetchPayments();
            else fetchClassOverview();
            if (onRefreshParent) onRefreshParent();
          }}
        />
      )}
    </div>
  );
};

export default FeesManagement;
