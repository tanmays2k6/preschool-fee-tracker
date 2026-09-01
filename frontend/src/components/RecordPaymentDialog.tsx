import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FeeReceipt } from "./FeeReceipt";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  UserCheck,
  Calculator,
  Layers,
  Sparkles,
  CreditCard,
  Calendar,
  PackageCheck,
} from "lucide-react";
import { Student, FeePayment, FeeType, ACADEMIC_SESSIONS, MONTHS } from "@/types";
import {
  DEFAULT_MONTHLY_FEES,
  DEFAULT_ANNUAL_FEE,
  DEFAULT_FORM_FEE,
  ACADEMIC_MONTH_NAMES,
  formatINR,
  normalizeClass,
} from "@/lib/academicYear";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialStudentId?: string;
  initialSession?: string;
  initialFeeType?: FeeType;
  initialMonth?: string;
  initialAmount?: number | string;
}

const UNIFORM_TYPES = [
  { value: "winter", label: "Winter Uniform" },
  { value: "summer", label: "Summer Uniform" },
  { value: "sports", label: "Sports Uniform" },
  { value: "red_white", label: "Red & White Uniform" },
];

const UNIFORM_SIZES = ["20", "22", "24", "26", "28", "30"];

export const RecordPaymentDialog = ({
  open,
  onOpenChange,
  onSuccess,
  initialStudentId,
  initialSession,
  initialFeeType,
  initialMonth,
  initialAmount,
}: RecordPaymentDialogProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Payment Mode / Tabs: "combo" (Multi-Item Checklist) vs "single" (Standard Single Payment)
  const [paymentModeType, setPaymentModeType] = useState<"combo" | "single">("combo");

  // Common Details
  const [session, setSession] = useState<string>("2026-27");
  const [paymentMode, setPaymentMode] = useState<"cash" | "online">("cash");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState<string>("");

  // --- MULTI-ITEM (COMBO) STATE ---
  // 1. Monthly Fee
  const [includeMonthly, setIncludeMonthly] = useState<boolean>(true);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([
    new Date().toLocaleString("default", { month: "long" })
  ]);
  const [monthlyFeePerMonth, setMonthlyFeePerMonth] = useState<string>("1250");

  // 2. Annual Fee
  const [includeAnnual, setIncludeAnnual] = useState<boolean>(false);
  const [annualAmount, setAnnualAmount] = useState<string>(String(DEFAULT_ANNUAL_FEE));

  // 3. Admission Form Fee
  const [includeFormFee, setIncludeFormFee] = useState<boolean>(false);
  const [formFeeAmount, setFormFeeAmount] = useState<string>(String(DEFAULT_FORM_FEE));

  // 4. Uniform Fee
  const [includeUniform, setIncludeUniform] = useState<boolean>(false);
  const [uniformType, setUniformType] = useState<string>("winter");
  const [uniformSize, setUniformSize] = useState<string>("24");
  const [uniformAmount, setUniformAmount] = useState<string>("1200");

  // 5. Books & Stationery
  const [includeBooks, setIncludeBooks] = useState<boolean>(false);
  const [booksAmount, setBooksAmount] = useState<string>("1800");
  const [booksDesc, setBooksDesc] = useState<string>("Books, Notebooks & Stationery Set");

  // 6. Custom / Misc Fee
  const [includeMisc, setIncludeMisc] = useState<boolean>(false);
  const [miscDesc, setMiscDesc] = useState<string>("");
  const [miscAmount, setMiscAmount] = useState<string>("");

  // --- SINGLE PAYMENT MODE STATE (Fall-back) ---
  const [singleFeeType, setSingleFeeType] = useState<FeeType>("monthly");
  const [selectedSingleMonth, setSelectedSingleMonth] = useState<string>(
    new Date().toLocaleString("default", { month: "long" })
  );
  const [singleAmount, setSingleAmount] = useState<string>("");
  const [singleDescription, setSingleDescription] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<FeePayment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchStudents();
      if (initialStudentId) {
        setSelectedStudentId(initialStudentId);
      }
      if (initialSession) setSession(initialSession);
      if (initialMonth) setSelectedMonths([initialMonth]);
      if (initialFeeType) {
        if (initialFeeType === "annual") {
          setIncludeMonthly(false);
          setIncludeAnnual(true);
        } else if (initialFeeType === "uniform") {
          setIncludeMonthly(false);
          setIncludeUniform(true);
        } else if (initialFeeType === "books_stationery") {
          setIncludeMonthly(false);
          setIncludeBooks(true);
        } else if (initialFeeType === "monthly") {
          setIncludeMonthly(true);
          setIncludeAnnual(false);
        }
      }
      if (initialAmount !== undefined && initialAmount !== null && initialAmount !== "") {
        setMonthlyFeePerMonth(String(initialAmount));
        setSingleAmount(String(initialAmount));
      }
    } else {
      // Reset when dialog closes if no initialStudentId
      if (!initialStudentId) {
        setSelectedStudentId("");
        setStudentSearch("");
      }
    }
  }, [open, initialStudentId, initialSession, initialFeeType, initialMonth, initialAmount]);

  const fetchStudents = async () => {
    try {
      const { data } = await api.get("/students");
      setStudents(data || []);
      // If initialStudentId was given, verify selection
      if (initialStudentId && data) {
        const found = data.find((s: any) => (s.id || s._id) === initialStudentId);
        if (found) {
          setSelectedStudentId(initialStudentId);
        }
      }
    } catch (error) {
      console.error("Failed to fetch students", error);
    }
  };

  const selectedStudent = useMemo(() => {
    return students.find((s) => (s.id || s._id) === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Adjust defaults when student changes
  useEffect(() => {
    if (selectedStudent) {
      const normClass = normalizeClass(selectedStudent.class) || "PG";
      const classMonthly =
        selectedStudent.monthlyFee && Number(selectedStudent.monthlyFee) > 0
          ? selectedStudent.monthlyFee
          : DEFAULT_MONTHLY_FEES[normClass] || 1250;

      const classAnnual =
        selectedStudent.annualCharges && Number(selectedStudent.annualCharges) > 0
          ? selectedStudent.annualCharges
          : DEFAULT_ANNUAL_FEE;

      setMonthlyFeePerMonth(String(classMonthly));
      setAnnualAmount(String(classAnnual));
      setSingleAmount(String(classMonthly));
    }
  }, [selectedStudent]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        s.fatherName.toLowerCase().includes(q) ||
        (s.contactNumber && s.contactNumber.includes(q))
    );
  }, [students, studentSearch]);

  // Total monthly fee = (amount per month) * (count of selected months)
  const totalCalculatedMonthlyAmount = useMemo(() => {
    if (!includeMonthly) return 0;
    const perMonth = parseFloat(monthlyFeePerMonth) || 0;
    return perMonth * selectedMonths.length;
  }, [includeMonthly, monthlyFeePerMonth, selectedMonths]);

  // Calculate Combo Sum automatically
  const calculatedComboTotal = useMemo(() => {
    let total = 0;
    if (includeMonthly) total += totalCalculatedMonthlyAmount;
    if (includeAnnual) total += parseFloat(annualAmount) || 0;
    if (includeFormFee) total += parseFloat(formFeeAmount) || 0;
    if (includeUniform) total += parseFloat(uniformAmount) || 0;
    if (includeBooks) total += parseFloat(booksAmount) || 0;
    if (includeMisc) total += parseFloat(miscAmount) || 0;
    return total;
  }, [
    includeMonthly,
    totalCalculatedMonthlyAmount,
    includeAnnual,
    annualAmount,
    includeFormFee,
    formFeeAmount,
    includeUniform,
    uniformAmount,
    includeBooks,
    booksAmount,
    includeMisc,
    miscAmount,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId) {
      toast({ title: "Please select a student", variant: "destructive" });
      return;
    }

    if (paymentModeType === "combo") {
      if (calculatedComboTotal <= 0) {
        toast({
          title: "Select at least one fee item",
          description: "Please check at least one fee component (Monthly, Annual, Form, etc.).",
          variant: "destructive",
        });
        return;
      }

      // Build itemized particulars list
      const itemsList: string[] = [];
      let isSingleMonthlyOnly = true;

      if (includeMonthly) {
        if (selectedMonths.length === 0) {
          toast({ title: "Please select at least one month for monthly tuition fee", variant: "destructive" });
          return;
        }
        const perMonth = parseFloat(monthlyFeePerMonth) || 0;
        const monthsText = selectedMonths.join(", ");
        itemsList.push(`Monthly Tuition (${monthsText}) [${selectedMonths.length} × ₹${perMonth}]: ₹${totalCalculatedMonthlyAmount}`);
      } else {
        isSingleMonthlyOnly = false;
      }

      if (includeAnnual) {
        itemsList.push(`Annual Charges: ₹${parseFloat(annualAmount) || 0}`);
        isSingleMonthlyOnly = false;
      }
      if (includeFormFee) {
        itemsList.push(`Admission Form Fee: ₹${parseFloat(formFeeAmount) || 0}`);
        isSingleMonthlyOnly = false;
      }
      if (includeUniform) {
        itemsList.push(`Uniform (${uniformType}, Size ${uniformSize}): ₹${parseFloat(uniformAmount) || 0}`);
        isSingleMonthlyOnly = false;
      }
      if (includeBooks) {
        itemsList.push(`Books/Stationery (${booksDesc || "Kit"}): ₹${parseFloat(booksAmount) || 0}`);
        isSingleMonthlyOnly = false;
      }
      if (includeMisc) {
        itemsList.push(`${miscDesc || "Other Charges"}: ₹${parseFloat(miscAmount) || 0}`);
        isSingleMonthlyOnly = false;
      }

      // When recording multi-item combo payments, create individual records for each checked component & each month
      // so each monthly fee reflects its exact tuition amount (e.g. ₹1250) and each month is tracked as Paid
      setLoading(true);

      const itemsToRecord: any[] = [];
      const perMonthAmt = parseFloat(monthlyFeePerMonth) || 0;

      if (includeMonthly) {
        selectedMonths.forEach((m) => {
          itemsToRecord.push({
            studentId: selectedStudentId,
            session,
            feeType: "monthly" as FeeType,
            month: m,
            paymentMode,
            amount: perMonthAmt,
            description: `Monthly Tuition Fee (${m})`,
            paymentDate,
            remarks,
          });
        });
      }

      if (includeAnnual) {
        itemsToRecord.push({
          studentId: selectedStudentId,
          session,
          feeType: "annual" as FeeType,
          month: null,
          paymentMode,
          amount: parseFloat(annualAmount) || 0,
          description: "Annual Charges & Development Fee",
          paymentDate,
          remarks,
        });
      }

      if (includeFormFee) {
        itemsToRecord.push({
          studentId: selectedStudentId,
          session,
          feeType: "misc" as FeeType,
          month: null,
          paymentMode,
          amount: parseFloat(formFeeAmount) || 0,
          description: "Admission / Application Form Fee",
          paymentDate,
          remarks,
        });
      }

      if (includeUniform) {
        itemsToRecord.push({
          studentId: selectedStudentId,
          session,
          feeType: "uniform" as FeeType,
          month: null,
          paymentMode,
          amount: parseFloat(uniformAmount) || 0,
          uniformType,
          uniformSize,
          description: `Uniform (${uniformType}, Size ${uniformSize})`,
          paymentDate,
          remarks,
        });
      }

      if (includeBooks) {
        itemsToRecord.push({
          studentId: selectedStudentId,
          session,
          feeType: "books_stationery" as FeeType,
          month: null,
          paymentMode,
          amount: parseFloat(booksAmount) || 0,
          description: booksDesc || "Books, Notebooks & Activity Kit",
          paymentDate,
          remarks,
        });
      }

      if (includeMisc) {
        itemsToRecord.push({
          studentId: selectedStudentId,
          session,
          feeType: "misc" as FeeType,
          month: null,
          paymentMode,
          amount: parseFloat(miscAmount) || 0,
          description: miscDesc || "Other Miscellaneous Fee",
          paymentDate,
          remarks,
        });
      }

      try {
        const compositeDescription = itemsList.join(" | ");

        // Determine fee type: if only monthly items selected -> monthly, else misc/combo
        const primaryFeeType: FeeType = !includeAnnual && !includeFormFee && !includeUniform && !includeBooks && !includeMisc
          ? "monthly"
          : "misc";

        // Post single unified transaction of the total combo amount (e.g. ₹8,146)
        const { data: primaryPayment } = await api.post("/fees", {
          studentId: selectedStudentId,
          session,
          feeType: primaryFeeType,
          month: includeMonthly && selectedMonths.length > 0 ? selectedMonths[0] : null,
          paymentMode,
          amount: calculatedComboTotal,
          uniformType: includeUniform ? uniformType : null,
          uniformSize: includeUniform ? uniformSize : null,
          description: compositeDescription,
          paymentDate,
          remarks,
        });

        toast({ title: "Payment recorded successfully!" });

        const receiptStudent = selectedStudent
          ? {
              id: selectedStudent.id || selectedStudent._id,
              _id: selectedStudent.id || selectedStudent._id,
              studentName: selectedStudent.studentName,
              admissionNumber: selectedStudent.admissionNumber,
              fatherName: selectedStudent.fatherName,
              class: selectedStudent.class,
              contactNumber: selectedStudent.contactNumber,
            }
          : primaryPayment.student;

        setReceiptData({
          ...primaryPayment,
          amount: calculatedComboTotal,
          paidAmount: calculatedComboTotal,
          student: receiptStudent,
          description: compositeDescription,
        });
        setShowReceipt(true);
        onSuccess();
      } catch (error: any) {
        toast({
          title: "Unable to record payment",
          description: error.response?.data?.message || error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Single fee mode
      if (!singleAmount || parseFloat(singleAmount) <= 0) {
        toast({ title: "Amount must be greater than zero", variant: "destructive" });
        return;
      }

      if (singleFeeType === "monthly" && !selectedSingleMonth) {
        toast({ title: "Please select a month", variant: "destructive" });
        return;
      }

      setLoading(true);

      const payload = {
        studentId: selectedStudentId,
        session,
        feeType: singleFeeType,
        month: singleFeeType === "monthly" ? selectedSingleMonth : null,
        paymentMode,
        amount: parseFloat(singleAmount),
        uniformType: singleFeeType === "uniform" ? uniformType : null,
        uniformSize: singleFeeType === "uniform" ? uniformSize : null,
        description: singleDescription || null,
        paymentDate,
        remarks,
      };

      try {
        const { data: createdPayment } = await api.post("/fees", payload);
        toast({ title: "Payment recorded successfully!" });

        const receiptStudent = selectedStudent
          ? {
              id: selectedStudent.id || selectedStudent._id,
              _id: selectedStudent.id || selectedStudent._id,
              studentName: selectedStudent.studentName,
              admissionNumber: selectedStudent.admissionNumber,
              fatherName: selectedStudent.fatherName,
              class: selectedStudent.class,
              contactNumber: selectedStudent.contactNumber,
            }
          : createdPayment.student;

        setReceiptData({
          ...createdPayment,
          student: receiptStudent,
        });
        setShowReceipt(true);
        onSuccess();
      } catch (error: any) {
        toast({
          title: "Unable to record payment",
          description: error.response?.data?.message || error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setSelectedStudentId("");
    setStudentSearch("");
    setShowReceipt(false);
    setReceiptData(null);
    onOpenChange(false);
  };

  if (showReceipt && receiptData) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
          <FeeReceipt payment={receiptData} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 pb-3 border-b bg-muted/20">
          <DialogHeader>
            <div className="flex justify-between items-center pr-6">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Record Fee Payment
                </DialogTitle>
                <DialogDescription>
                  Record combined multi-item or individual payments with automatic sum calculation.
                </DialogDescription>
              </div>
              <div className="flex bg-muted p-1 rounded-lg border text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentModeType("combo")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    paymentModeType === "combo"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Multi-Item Sum
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentModeType("single")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    paymentModeType === "single"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Single Item
                </button>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Modal Body: Scrollable Form */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
          <form id="record-payment-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Student Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm border-b pb-1.5 flex items-center gap-2 text-foreground">
                <UserCheck className="h-4 w-4 text-primary" />
                1. Select Student
              </h3>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="studentSearch"
                    placeholder="Search student by name, admission no, father, phone..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>

                <Select
                  value={selectedStudentId}
                  onValueChange={(val) => {
                    setSelectedStudentId(val);
                  }}
                  required
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Choose a student from the list" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filteredStudents.map((s) => {
                      const sid = s.id || s._id;
                      return (
                        <SelectItem key={sid} value={sid}>
                          {s.studentName} ({s.admissionNumber}) — {s.class} | Father: {s.fatherName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Student Summary Card */}
              {selectedStudent && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Student Name</span>
                      <span className="font-bold text-slate-900">{selectedStudent.studentName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Admission No / Class</span>
                      <span className="font-semibold text-slate-800">
                        {selectedStudent.admissionNumber} ({selectedStudent.class})
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Monthly Fee Standard</span>
                      <span className="font-bold text-primary">
                        {formatINR(selectedStudent.monthlyFee || DEFAULT_MONTHLY_FEES[normalizeClass(selectedStudent.class)] || 1250)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Parent / Contact</span>
                      <span className="font-semibold text-slate-800">
                        {selectedStudent.fatherName} ({selectedStudent.contactNumber || "N/A"})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Step 2: Payment Items Specification */}
            {paymentModeType === "combo" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                    <Layers className="h-4 w-4 text-primary" />
                    2. Select Fee Components (Check to Include in Total)
                  </h3>
                  <span className="text-xs text-muted-foreground">Select multiple items to sum automatically</span>
                </div>

                <div className="space-y-3">
                  {/* 1. Monthly Tuition */}
                  <div
                    className={`p-3 rounded-lg border transition-all ${
                      includeMonthly ? "bg-primary/5 border-primary/40 shadow-xs" : "bg-card border-border opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="check-monthly"
                          checked={includeMonthly}
                          onCheckedChange={(c) => setIncludeMonthly(!!c)}
                        />
                        <Label htmlFor="check-monthly" className="font-semibold cursor-pointer text-sm">
                          Monthly Tuition Fee
                        </Label>
                      </div>
                      <span className="font-bold text-sm text-primary">
                        {includeMonthly ? formatINR(totalCalculatedMonthlyAmount) : "₹0"}
                      </span>
                    </div>

                    {includeMonthly && (
                      <div className="space-y-3 mt-3 pt-2 border-t border-primary/10">
                        {/* Month Selection Grid with Checkboxes */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-foreground">
                              Select Applicable Months ({selectedMonths.length} selected) *
                            </Label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedMonths([...ACADEMIC_MONTH_NAMES])}
                                className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                              >
                                Select All (12)
                              </button>
                              <span className="text-muted-foreground text-[11px]">|</span>
                              <button
                                type="button"
                                onClick={() => setSelectedMonths([])}
                                className="text-[11px] text-muted-foreground hover:underline cursor-pointer"
                              >
                                Clear
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 bg-background/80 p-2 rounded-md border">
                            {ACADEMIC_MONTH_NAMES.map((m) => {
                              const isChecked = selectedMonths.includes(m);
                              return (
                                <label
                                  key={m}
                                  className={`flex items-center gap-1.5 p-1.5 rounded text-xs cursor-pointer select-none transition-colors border ${
                                    isChecked
                                      ? "bg-primary/10 border-primary/50 text-primary font-bold shadow-2xs"
                                      : "hover:bg-muted/60 border-transparent text-slate-700 font-medium"
                                  }`}
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedMonths((prev) => [...prev, m]);
                                      } else {
                                        setSelectedMonths((prev) => prev.filter((item) => item !== m));
                                      }
                                    }}
                                    className="h-3.5 w-3.5"
                                  />
                                  <span className="truncate">{m}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Per-Month Fee Amount Input & Dynamic Total Display */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <Label className="text-xs">Fee Amount Per Month (₹)</Label>
                            <Input
                              type="number"
                              value={monthlyFeePerMonth}
                              onChange={(e) => setMonthlyFeePerMonth(e.target.value)}
                              className="h-8 text-xs font-semibold"
                            />
                          </div>
                          <div className="space-y-1 flex flex-col justify-end">
                            <div className="text-xs bg-primary/5 p-2 rounded border border-primary/20 flex items-center justify-between">
                              <span className="text-muted-foreground text-[11px]">
                                {selectedMonths.length} month(s) × ₹{parseFloat(monthlyFeePerMonth) || 0}:
                              </span>
                              <span className="font-bold text-primary text-xs">
                                {formatINR(totalCalculatedMonthlyAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Annual Charges */}
                  <div
                    className={`p-3 rounded-lg border transition-all ${
                      includeAnnual ? "bg-amber-500/5 border-amber-500/40 shadow-xs" : "bg-card border-border opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="check-annual"
                          checked={includeAnnual}
                          onCheckedChange={(c) => setIncludeAnnual(!!c)}
                        />
                        <Label htmlFor="check-annual" className="font-semibold cursor-pointer text-sm">
                          Annual Charges & Development Fee
                        </Label>
                      </div>
                      <span className="font-bold text-sm text-amber-700">
                        {includeAnnual ? formatINR(annualAmount) : "₹0"}
                      </span>
                    </div>

                    {includeAnnual && (
                      <div className="mt-3 pt-2 border-t border-amber-500/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Annual Amount (₹) [Standard: ₹3000]</Label>
                          <Input
                            type="number"
                            value={annualAmount}
                            onChange={(e) => setAnnualAmount(e.target.value)}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Admission Form Fee */}
                  <div
                    className={`p-3 rounded-lg border transition-all ${
                      includeFormFee ? "bg-purple-500/5 border-purple-500/40 shadow-xs" : "bg-card border-border opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="check-form"
                          checked={includeFormFee}
                          onCheckedChange={(c) => setIncludeFormFee(!!c)}
                        />
                        <Label htmlFor="check-form" className="font-semibold cursor-pointer text-sm">
                          Admission / Application Form Fee
                        </Label>
                      </div>
                      <span className="font-bold text-sm text-purple-700">
                        {includeFormFee ? formatINR(formFeeAmount) : "₹0"}
                      </span>
                    </div>

                    {includeFormFee && (
                      <div className="mt-3 pt-2 border-t border-purple-500/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Form Fee Amount (₹) [Standard: ₹300]</Label>
                          <Input
                            type="number"
                            value={formFeeAmount}
                            onChange={(e) => setFormFeeAmount(e.target.value)}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Uniform Charges */}
                  <div
                    className={`p-3 rounded-lg border transition-all ${
                      includeUniform ? "bg-blue-500/5 border-blue-500/40 shadow-xs" : "bg-card border-border opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="check-uniform"
                          checked={includeUniform}
                          onCheckedChange={(c) => setIncludeUniform(!!c)}
                        />
                        <Label htmlFor="check-uniform" className="font-semibold cursor-pointer text-sm">
                          Uniform & Attire
                        </Label>
                      </div>
                      <span className="font-bold text-sm text-blue-700">
                        {includeUniform ? formatINR(uniformAmount) : "₹0"}
                      </span>
                    </div>

                    {includeUniform && (
                      <div className="mt-3 pt-2 border-t border-blue-500/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Uniform Type</Label>
                          <Select value={uniformType} onValueChange={setUniformType}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIFORM_TYPES.map((u) => (
                                <SelectItem key={u.value} value={u.value} className="text-xs">
                                  {u.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Uniform Size</Label>
                          <Select value={uniformSize} onValueChange={setUniformSize}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Size" />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIFORM_SIZES.map((sz) => (
                                <SelectItem key={sz} value={sz} className="text-xs">
                                  Size {sz}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Uniform Amount (₹)</Label>
                          <Input
                            type="number"
                            value={uniformAmount}
                            onChange={(e) => setUniformAmount(e.target.value)}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5. Books & Stationery */}
                  <div
                    className={`p-3 rounded-lg border transition-all ${
                      includeBooks ? "bg-emerald-500/5 border-emerald-500/40 shadow-xs" : "bg-card border-border opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="check-books"
                          checked={includeBooks}
                          onCheckedChange={(c) => setIncludeBooks(!!c)}
                        />
                        <Label htmlFor="check-books" className="font-semibold cursor-pointer text-sm">
                          Books, Notebooks & Stationery Kit
                        </Label>
                      </div>
                      <span className="font-bold text-sm text-emerald-700">
                        {includeBooks ? formatINR(booksAmount) : "₹0"}
                      </span>
                    </div>

                    {includeBooks && (
                      <div className="mt-3 pt-2 border-t border-emerald-500/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Books Description</Label>
                          <Input
                            placeholder="e.g. Set of 6 Books + Stationery Kit"
                            value={booksDesc}
                            onChange={(e) => setBooksDesc(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Books Amount (₹)</Label>
                          <Input
                            type="number"
                            value={booksAmount}
                            onChange={(e) => setBooksAmount(e.target.value)}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 6. Other / Miscellaneous Fee */}
                  <div
                    className={`p-3 rounded-lg border transition-all ${
                      includeMisc ? "bg-slate-500/5 border-slate-500/40 shadow-xs" : "bg-card border-border opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="check-misc"
                          checked={includeMisc}
                          onCheckedChange={(c) => setIncludeMisc(!!c)}
                        />
                        <Label htmlFor="check-misc" className="font-semibold cursor-pointer text-sm">
                          Other / Miscellaneous Fee
                        </Label>
                      </div>
                      <span className="font-bold text-sm text-slate-700">
                        {includeMisc ? formatINR(miscAmount) : "₹0"}
                      </span>
                    </div>

                    {includeMisc && (
                      <div className="mt-3 pt-2 border-t border-slate-500/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Particulars / Reason *</Label>
                          <Input
                            placeholder="e.g. Activity Fee, Picnic, ID Card"
                            value={miscDesc}
                            onChange={(e) => setMiscDesc(e.target.value)}
                            className="h-8 text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Amount (₹) *</Label>
                          <Input
                            type="number"
                            placeholder="500"
                            value={miscAmount}
                            onChange={(e) => setMiscAmount(e.target.value)}
                            className="h-8 text-xs font-semibold"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Multi-Item Summary Banner */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/30 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="h-5 w-5 text-primary" />
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium">
                        Total Summed Amount to Collect:
                      </span>
                      <span className="text-xs text-slate-600">
                        {(includeMonthly ? 1 : 0) +
                          (includeAnnual ? 1 : 0) +
                          (includeFormFee ? 1 : 0) +
                          (includeUniform ? 1 : 0) +
                          (includeBooks ? 1 : 0) +
                          (includeMisc ? 1 : 0)}{" "}
                        fee item(s) selected
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary tracking-tight">
                      {formatINR(calculatedComboTotal)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Single Item Form */
              <div className="space-y-4">
                <h3 className="font-semibold text-sm border-b pb-1.5">2. Payment Specification</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Fee Category *</Label>
                    <Select
                      value={singleFeeType}
                      onValueChange={(val: FeeType) => {
                        setSingleFeeType(val);
                        if (val === "monthly" && selectedStudent?.monthlyFee) {
                          setSingleAmount(String(selectedStudent.monthlyFee));
                        } else if (val === "annual") {
                          setSingleAmount(String(DEFAULT_ANNUAL_FEE));
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Fee Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly Tuition Fee</SelectItem>
                        <SelectItem value="annual">Annual Fee</SelectItem>
                        <SelectItem value="uniform">Uniform</SelectItem>
                        <SelectItem value="books_stationery">Books / Stationery</SelectItem>
                        <SelectItem value="misc">Miscellaneous / Form</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Amount (₹) *</Label>
                    <Input
                      type="number"
                      value={singleAmount}
                      onChange={(e) => setSingleAmount(e.target.value)}
                      placeholder="1250"
                      className="h-9 font-bold text-primary"
                      required
                    />
                  </div>
                </div>

                {singleFeeType === "monthly" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Month *</Label>
                    <Select value={selectedSingleMonth} onValueChange={setSelectedSingleMonth}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACADEMIC_MONTH_NAMES.map((m) => (
                          <SelectItem key={m} value={m} className="text-xs">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(singleFeeType === "misc" || singleFeeType === "books_stationery") && (
                  <div className="space-y-1">
                    <Label className="text-xs">Description / Particulars</Label>
                    <Input
                      value={singleDescription}
                      onChange={(e) => setSingleDescription(e.target.value)}
                      placeholder="e.g. Admission Form Fee, Activity Kit"
                      className="h-9 text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Session, Mode, Date & Remarks */}
            <div className="space-y-3 pt-2 border-t">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <CreditCard className="h-4 w-4 text-primary" />
                3. Receipt & Payment Transaction Info
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Academic Session *</Label>
                  <Select value={session} onValueChange={setSession}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Session" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_SESSIONS.map((sess) => (
                        <SelectItem key={sess} value={sess} className="text-xs">
                          {sess}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Payment Mode *</Label>
                  <Select
                    value={paymentMode}
                    onValueChange={(val: "cash" | "online") => setPaymentMode(val)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash" className="text-xs">
                        Cash
                      </SelectItem>
                      <SelectItem value="online" className="text-xs">
                        Online / UPI
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Payment Date *</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Remarks / Transaction Note (Optional)</Label>
                <Input
                  id="remarks"
                  placeholder="Optional notes, UPI reference, or receipt comments"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 border-t bg-background flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {paymentModeType === "combo" ? (
              <span>
                Total to Pay: <strong className="text-primary text-sm font-bold">{formatINR(calculatedComboTotal)}</strong>
              </span>
            ) : (
              <span>
                Single Item: <strong className="text-primary text-sm font-bold">{formatINR(singleAmount || 0)}</strong>
              </span>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button
              type="submit"
              form="record-payment-form"
              disabled={loading || !selectedStudentId || (paymentModeType === "combo" ? calculatedComboTotal <= 0 : !singleAmount)}
              className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 font-bold"
            >
              {loading ? "Recording..." : "Record & Generate Receipt"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPaymentDialog;
