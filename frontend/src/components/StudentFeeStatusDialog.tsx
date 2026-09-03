import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatINR, formatDateDDMMYYYY } from "@/lib/academicYear";
import { ACADEMIC_SESSIONS, StudentFeeStatusResponse, FeePayment } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { FeeReceipt } from "./FeeReceipt";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import {
  User,
  Phone,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  Receipt,
  PlusCircle,
  RotateCw,
  Sparkles,
} from "lucide-react";

interface StudentFeeStatusDialogProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const StudentFeeStatusDialog = ({
  studentId,
  open,
  onOpenChange,
  onSuccess,
}: StudentFeeStatusDialogProps) => {
  const [selectedSession, setSelectedSession] = useState<string>("2026-27");
  const [activeReceipt, setActiveReceipt] = useState<FeePayment | null>(null);

  // State for triggering Record Payment modal with prefilled options
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<{
    feeType: "monthly" | "annual";
    month?: string;
    amount?: number | string;
  }>({ feeType: "monthly" });

  const queryClient = useQueryClient();

  const {
    data: feeStatus,
    isLoading,
    isError,
    refetch,
  } = useQuery<StudentFeeStatusResponse>({
    queryKey: ["student-fee-status", studentId, selectedSession],
    queryFn: async () => {
      if (!studentId) throw new Error("No student ID provided");
      const { data } = await api.get(
        `/students/${studentId}/fee-status?session=${selectedSession}`
      );
      return data;
    },
    enabled: !!studentId && open,
  });

  const handleRecordMonthly = (month: string, amount?: number) => {
    setPrefillData({
      feeType: "monthly",
      month,
      amount: amount || feeStatus?.student.monthlyFee || "",
    });
    setRecordPaymentOpen(true);
  };

  const { toast } = useToast();

  const handleDeletePayment = async (p: FeePayment) => {
    const pid = p.id || p._id;
    if (!pid) return;
    try {
      await api.delete(`/fees/${pid}`);
      toast({ title: "Payment record deleted successfully" });
      setActiveReceipt(null);
      handlePaymentSuccess();
    } catch (error: any) {
      toast({
        title: "Error deleting payment",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    }
  };

  const handleRecordAnnual = () => {
    setPrefillData({
      feeType: "annual",
      amount: feeStatus?.student.annualCharges || "",
    });
    setRecordPaymentOpen(true);
  };

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["student-fee-status"] });
    queryClient.invalidateQueries({ queryKey: ["student-fees"] });
    queryClient.invalidateQueries({ queryKey: ["students"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    refetch();
    if (onSuccess) onSuccess();
  };

  const student = feeStatus?.student;
  const monthlySummary = feeStatus?.monthlySummary;
  const annualFee = feeStatus?.annualFee;
  const progressPercent = monthlySummary
    ? Math.round((monthlySummary.paidMonths / 12) * 100)
    : 0;

  const totalPaidInSession = useMemo(() => {
    if (!feeStatus) return 0;
    let total = 0;
    if (feeStatus.monthlyFees) {
      feeStatus.monthlyFees.forEach((m: any) => {
        if (m.status === "paid" && m.payment?.amount) {
          total += Number(m.payment.amount);
        }
      });
    }
    if (feeStatus.annualFee?.status === "paid" && feeStatus.annualFee.totalPaid) {
      total += Number(feeStatus.annualFee.totalPaid);
    }
    if (feeStatus.otherPayments) {
      feeStatus.otherPayments.forEach((o: any) => {
        total += Number(o.amount || 0);
      });
    }
    return total;
  }, [feeStatus]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[92vh] flex flex-col p-0 overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b bg-gradient-to-r from-primary/5 via-background to-secondary/5">
            <DialogHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2 text-school-navy">
                    <img
                      src="/assets/school-logo.png"
                      alt="FUN N LEARN SMART SCHOOL"
                      className="h-6 w-6 object-contain rounded-full border border-school-orange/30"
                    />
                    Student Fee Status & Academic Record
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs">
                    FUN N LEARN SMART SCHOOL &bull; 12-month academic fee ledger & annual charges
                  </DialogDescription>
                </div>

                {/* Session Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Session:
                  </span>
                  <Select
                    value={selectedSession}
                    onValueChange={(val) => setSelectedSession(val)}
                  >
                    <SelectTrigger className="w-[140px] font-semibold bg-background">
                      <SelectValue placeholder="Select Session" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_SESSIONS.map((sess) => (
                        <SelectItem key={sess} value={sess}>
                          {sess}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogHeader>

            {/* Student Details Top Banner */}
            {student && (
              <div className="mt-4 p-3 rounded-lg bg-card border shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Student Name</div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {student.studentName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Admission No.</div>
                  <div className="font-semibold text-primary mt-0.5">
                    {student.admissionNumber || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Parent / Guardian</div>
                  <div className="font-medium text-foreground mt-0.5">
                    {student.fatherName || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone Number</div>
                  <div className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {student.contactNumber || "—"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="py-16 text-center space-y-3">
                <RotateCw className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground font-medium">Loading fee status...</p>
              </div>
            ) : isError || !feeStatus ? (
              <div className="py-12 text-center space-y-4">
                <p className="text-destructive font-semibold">Unable to load fee status.</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RotateCw className="h-4 w-4 mr-2" /> Retry
                </Button>
              </div>
            ) : (
              <>
                {/* 1. Monthly Fee Status Section */}
                <Card className="shadow-sm border">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          Monthly Fee Status ({selectedSession})
                        </CardTitle>
                        <CardDescription>
                          April {selectedSession.split("-")[0]} through March{" "}
                          {parseInt(selectedSession.split("-")[0], 10) + 1}
                        </CardDescription>
                      </div>

                      {/* Summary Metrics */}
                      <div className="flex items-center gap-4 text-sm bg-muted/50 px-3 py-1.5 rounded-md border">
                        <div>
                          <span className="text-muted-foreground">Paid: </span>
                          <span className="font-bold text-green-600">
                            {monthlySummary?.paidMonths} / 12
                          </span>
                        </div>
                        <div className="border-r h-4" />
                        <div>
                          <span className="text-muted-foreground">Pending: </span>
                          <span className="font-bold text-amber-600">
                            {monthlySummary?.pendingMonths}
                          </span>
                        </div>
                        <div className="border-r h-4" />
                        <div>
                          <span className="text-muted-foreground">Total Paid: </span>
                          <span className="font-bold text-primary">
                            {formatINR(monthlySummary?.totalPaid || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>Academic Year Progress</span>
                        <span>{progressPercent}% Complete ({monthlySummary?.paidMonths}/12 months)</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40">
                            <TableHead className="font-semibold">Academic Month</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Amount</TableHead>
                            <TableHead className="font-semibold">Paid On</TableHead>
                            <TableHead className="font-semibold">Mode</TableHead>
                            <TableHead className="font-semibold text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {feeStatus.monthlyFees.map((item) => {
                            const isPaid = item.status === "paid";
                            return (
                              <TableRow key={item.label} className={isPaid ? "bg-green-50/20" : ""}>
                                <TableCell className="font-medium text-foreground">
                                  {item.label}
                                </TableCell>
                                <TableCell>
                                  {isPaid ? (
                                    <Badge className="bg-green-600 hover:bg-green-700 text-white gap-1 font-semibold">
                                      <CheckCircle2 className="h-3 w-3" /> Paid
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 gap-1 font-medium">
                                      <Clock className="h-3 w-3" /> Pending
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isPaid ? (
                                    <span className="font-semibold text-foreground">
                                      {formatINR(item.payment?.amount || 0)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isPaid && item.payment?.paymentDate ? (
                                    <span className="text-xs text-foreground font-mono">
                                      {formatDateDDMMYYYY(item.payment.paymentDate)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isPaid && item.payment?.paymentMode ? (
                                    <span className="capitalize text-xs bg-muted px-2 py-0.5 rounded text-foreground font-medium">
                                      {item.payment.paymentMode}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {isPaid && item.payment ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                      onClick={() =>
                                        setActiveReceipt({
                                          ...item.payment!,
                                          student: {
                                            id: student.id,
                                            _id: student.id,
                                            studentName: student.studentName,
                                            admissionNumber: student.admissionNumber,
                                            fatherName: student.fatherName,
                                            class: student.class,
                                            contactNumber: student.contactNumber,
                                          },
                                        })
                                      }
                                    >
                                      <Receipt className="h-3.5 w-3.5" />
                                      {item.payment.receiptNumber || "Receipt"}
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-8 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                      onClick={() => handleRecordMonthly(item.month)}
                                    >
                                      <PlusCircle className="h-3.5 w-3.5" />
                                      Record Payment
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card List for 12 Academic Months */}
                    <div className="sm:hidden divide-y divide-slate-100 p-2.5">
                      {feeStatus.monthlyFees.map((item) => {
                        const isPaid = item.status === "paid";
                        return (
                          <div
                            key={item.label}
                            className={`p-3 rounded-xl my-1.5 transition-colors ${
                              isPaid ? "bg-green-50/50 border border-green-200/70" : "bg-slate-50/80 border border-slate-200/70"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-sm text-slate-900">{item.label}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Fee: <span className="font-bold text-slate-800">{formatINR(student.monthlyFee || 1250)}</span>
                                </div>
                              </div>

                              <div>
                                {isPaid ? (
                                  <Badge className="bg-green-600 text-white text-[11px] gap-1 font-semibold px-2 py-0.5">
                                    <CheckCircle2 className="h-3 w-3" /> Paid
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[11px] gap-1 font-semibold px-2 py-0.5">
                                    <Clock className="h-3 w-3" /> Pending
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {isPaid && item.payment && (
                              <div className="flex items-center justify-between text-xs text-slate-600 bg-white/90 p-2 rounded-lg mt-2 border border-green-100">
                                <div>
                                  <span className="text-muted-foreground">Receipt: </span>
                                  <span className="font-mono font-bold text-primary">{item.payment.receiptNumber || "—"}</span>
                                </div>
                                <div className="text-muted-foreground font-mono">
                                  {formatDateDDMMYYYY(item.payment.paymentDate)}
                                </div>
                              </div>
                            )}

                            <div className="pt-2">
                              {isPaid && item.payment ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full h-10 text-xs font-semibold gap-1.5 text-primary border-primary/30"
                                  onClick={() =>
                                    setActiveReceipt({
                                      ...item.payment!,
                                      student: {
                                        id: student.id,
                                        _id: student.id,
                                        studentName: student.studentName,
                                        admissionNumber: student.admissionNumber,
                                        fatherName: student.fatherName,
                                        class: student.class,
                                        contactNumber: student.contactNumber,
                                      },
                                    })
                                  }
                                >
                                  <Receipt className="h-3.5 w-3.5" /> View Fee Receipt
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="w-full h-10 text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                                  onClick={() => handleRecordMonthly(item.month)}
                                >
                                  <PlusCircle className="h-4 w-4" /> Pay Fee for {item.label}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Annual Fee Section */}
                <Card className="shadow-sm border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-amber-500" />
                          Annual Fee ({selectedSession})
                        </CardTitle>
                        <CardDescription>
                          Session-wide charges & composite annual fee
                        </CardDescription>
                      </div>

                      <div>
                        {annualFee?.status === "paid" ? (
                          <Badge className="bg-green-600 text-white gap-1 px-3 py-1 font-semibold text-sm">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Paid:{" "}
                            {formatINR(annualFee.totalPaid)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 gap-1 px-3 py-1 font-semibold text-sm">
                            <Clock className="h-3.5 w-3.5" /> Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-muted/40 border">
                        <div className="text-xs text-muted-foreground">Standard Charges</div>
                        <div className="text-lg font-bold mt-0.5">
                          {formatINR(student.annualCharges || 0)}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/40 border">
                        <div className="text-xs text-muted-foreground">Amount Paid</div>
                        <div className="text-lg font-bold text-green-600 mt-0.5">
                          {formatINR(annualFee?.totalPaid || 0)}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/40 border col-span-2 sm:col-span-1">
                        <div className="text-xs text-muted-foreground">Balance Due</div>
                        <div
                          className={`text-lg font-bold mt-0.5 ${
                            annualFee?.status === "pending"
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatINR(
                            Math.max(0, (student.annualCharges || 0) - (annualFee?.totalPaid || 0))
                          )}
                        </div>
                      </div>
                    </div>

                    {annualFee?.payments && annualFee.payments.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground">
                          Payment Transactions:
                        </div>
                        <div className="space-y-2">
                          {annualFee.payments.map((p) => (
                            <div
                              key={p.id}
                              className="p-3 rounded-lg bg-card border flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="font-semibold text-foreground">
                                  {formatINR(p.amount)} via {p.paymentMode}
                                </div>
                                <div className="text-muted-foreground">
                                  {formatDateDDMMYYYY(p.paymentDate)} &bull; Receipt:{" "}
                                  <span className="font-mono text-primary font-semibold">{p.receiptNumber}</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1 text-primary"
                                onClick={() =>
                                  setActiveReceipt({
                                    ...p,
                                    student: {
                                      id: student.id,
                                      _id: student.id,
                                      studentName: student.studentName,
                                      admissionNumber: student.admissionNumber,
                                      fatherName: student.fatherName,
                                      class: student.class,
                                      contactNumber: student.contactNumber,
                                    },
                                  })
                                }
                              >
                                <Receipt className="h-3.5 w-3.5" /> View Receipt
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-muted/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-3">
                          No annual fee payment recorded for session {selectedSession}.
                        </p>
                        <Button
                          size="sm"
                          className="h-10 text-xs font-bold gap-1.5 bg-primary text-primary-foreground"
                          onClick={handleRecordAnnual}
                        >
                          <PlusCircle className="h-4 w-4" /> Record Annual Fee
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 3. Other Payments Section */}
                {feeStatus.otherPayments && feeStatus.otherPayments.length > 0 && (
                  <Card className="shadow-sm border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">
                        Other Payments ({selectedSession})
                      </CardTitle>
                      <CardDescription>
                        Uniforms, Books & Stationery, Activity Kits, and Miscellaneous fees
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Desktop Table View */}
                      <div className="hidden sm:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40">
                              <TableHead className="font-semibold">Date</TableHead>
                              <TableHead className="font-semibold">Fee Type</TableHead>
                              <TableHead className="font-semibold">Details</TableHead>
                              <TableHead className="font-semibold">Amount</TableHead>
                              <TableHead className="font-semibold text-right">Receipt</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {feeStatus.otherPayments.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="text-xs font-mono">
                                  {formatDateDDMMYYYY(p.paymentDate)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {p.feeType.replace("_", " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-foreground">
                                  {p.feeType === "uniform"
                                    ? `${p.uniformType || "Uniform"} (Size ${p.uniformSize || "N/A"})`
                                    : p.description || p.remarks || "—"}
                                </TableCell>
                                <TableCell className="font-semibold text-foreground">
                                  {formatINR(p.amount)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs text-primary gap-1"
                                    onClick={() =>
                                      setActiveReceipt({
                                        ...p,
                                        student: {
                                          id: student.id,
                                          _id: student.id,
                                          studentName: student.studentName,
                                          admissionNumber: student.admissionNumber,
                                          fatherName: student.fatherName,
                                          class: student.class,
                                          contactNumber: student.contactNumber,
                                        },
                                      })
                                    }
                                  >
                                    <Receipt className="h-3.5 w-3.5" />
                                    {p.receiptNumber}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Card List for Other Payments */}
                      <div className="sm:hidden divide-y divide-slate-100 p-2.5">
                        {feeStatus.otherPayments.map((p) => (
                          <div key={p.id} className="p-3 rounded-lg border bg-card my-1.5 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Badge variant="outline" className="capitalize text-[10px] font-bold">
                                  {p.feeType.replace("_", " ")}
                                </Badge>
                                <div className="text-xs font-medium text-slate-800 mt-1">
                                  {p.feeType === "uniform"
                                    ? `${p.uniformType || "Uniform"} (Size ${p.uniformSize || "N/A"})`
                                    : p.description || p.remarks || "—"}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-extrabold text-sm text-slate-900">
                                  {formatINR(p.amount)}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  {formatDateDDMMYYYY(p.paymentDate)}
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-9 text-xs font-semibold gap-1 text-primary border-primary/30"
                              onClick={() =>
                                setActiveReceipt({
                                  ...p,
                                  student: {
                                    id: student.id,
                                    _id: student.id,
                                    studentName: student.studentName,
                                    admissionNumber: student.admissionNumber,
                                    fatherName: student.fatherName,
                                    class: student.class,
                                    contactNumber: student.contactNumber,
                                  },
                                })
                              }
                            >
                              <Receipt className="h-3.5 w-3.5" />
                              View Receipt #{p.receiptNumber}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Sticky Bottom Action Bar with Safe Area */}
          <div className="border-t bg-card px-4 py-3 flex items-center justify-between gap-3 sticky bottom-0 z-20 shadow-md pb-safe">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Session Total Paid
              </span>
              <span className="font-black text-base text-green-700">
                {formatINR(totalPaidInSession)}
              </span>
            </div>

            <Button
              onClick={() => {
                setPrefillData({ feeType: "monthly", month: "", amount: student?.monthlyFee || 1250 });
                setRecordPaymentOpen(true);
              }}
              className="h-10 px-4 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              Collect Fee
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embedded View Receipt Dialog */}
      {activeReceipt && (
        <Dialog open={!!activeReceipt} onOpenChange={(o) => !o && setActiveReceipt(null)}>
          <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
            <FeeReceipt
              payment={activeReceipt}
              onClose={() => setActiveReceipt(null)}
              onDeletePayment={(p) => handleDeletePayment(p)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Record Payment Dialog with Prefilled values */}
      {recordPaymentOpen && student && (
        <RecordPaymentDialog
          open={recordPaymentOpen}
          onOpenChange={setRecordPaymentOpen}
          onSuccess={handlePaymentSuccess}
          initialStudentId={student.id || student._id}
          initialSession={selectedSession}
          initialFeeType={prefillData.feeType}
          initialMonth={prefillData.month}
          initialAmount={prefillData.amount}
        />
      )}
    </>
  );
};

export default StudentFeeStatusDialog;
