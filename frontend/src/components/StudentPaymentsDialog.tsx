import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import { FeeReceipt } from "./FeeReceipt";
import { Student, FeePayment } from "@/types";
import { useToast } from "@/hooks/use-toast";
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
import { formatINR, formatDateDDMMYYYY } from "@/lib/academicYear";

interface StudentPaymentsDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const StudentPaymentsDialog = ({
  student,
  open,
  onOpenChange,
  onSuccess,
}: StudentPaymentsDialogProps) => {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<FeePayment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeletePayment = async (p: FeePayment) => {
    const pid = p.id || p._id;
    if (!pid) return;
    setDeleting(true);
    try {
      await api.delete(`/fees/${pid}`);
      toast({ title: "Payment record deleted successfully" });
      setSelectedPayment(null);
      setPaymentToDelete(null);
      fetchPayments();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error deleting payment",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (student && open) {
      fetchPayments();
    }
  }, [student, open]);

  const fetchPayments = async () => {
    if (!student) return;

    setLoading(true);
    try {
      const studentId = student.id || student._id;
      const { data } = await api.get(`/fees/student/${studentId}`);
      setPayments(data || []);
    } catch (error) {
      console.error("Failed to fetch payments", error);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || payment.paidAmount || 0),
    0
  );

  const formatDetails = (p: FeePayment) => {
    if (p.feeType === "monthly") return p.month || "-";
    if (p.feeType === "uniform") return `${p.uniformType || "Uniform"} (Size ${p.uniformSize || "N/A"})`;
    if (p.feeType === "books_stationery" || p.feeType === "misc") return p.description || "-";
    if (p.feeType === "annual") return "Annual Fee";
    return "-";
  };

  const formatFeeType = (type: string) => {
    switch (type) {
      case "monthly":
        return "Monthly";
      case "annual":
        return "Annual";
      case "uniform":
        return "Uniform";
      case "books_stationery":
        return "Books";
      case "misc":
        return "Misc";
      default:
        return type;
    }
  };

  if (selectedPayment) {
    return (
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedPayment(null);
          onOpenChange(isOpen);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
          <FeeReceipt
            payment={{
              ...selectedPayment,
              student: student,
            }}
            onClose={() => setSelectedPayment(null)}
            onDeletePayment={(p) => handleDeletePayment(p)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Payment History — {student.studentName}</DialogTitle>
            <DialogDescription>
              Adm No: {student.admissionNumber} | Class: {student.class} | Parent: {student.fatherName}
            </DialogDescription>
          </DialogHeader>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-medium">Total Fees Paid:</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No payment records found for this student.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt No</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Particulars</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const pid = payment.id || payment._id;
                    const amt = Number(payment.amount || payment.paidAmount || 0);
                    return (
                      <TableRow key={pid}>
                        <TableCell className="text-xs font-mono">
                          {formatDateDDMMYYYY(payment.paymentDate)}
                        </TableCell>
                        <TableCell className="font-medium text-xs text-primary">
                          {payment.receiptNumber}
                        </TableCell>
                        <TableCell className="text-xs">{payment.session || "2026-27"}</TableCell>
                        <TableCell className="capitalize text-xs font-medium">
                          {formatFeeType(payment.feeType)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDetails(payment)}
                        </TableCell>
                        <TableCell className="capitalize text-xs">
                          {payment.paymentMode}
                        </TableCell>
                        <TableCell className="font-bold text-right text-green-600">
                          ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                              className="h-8 px-2 text-xs"
                            >
                              <FileText className="h-3.5 w-3.5 mr-1 text-primary" />
                              Receipt
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPaymentToDelete(payment)}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Delete Payment"
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
          )}
        </DialogContent>
      </Dialog>

      {/* Double-Check Delete Dialog */}
      {paymentToDelete && (
        <AlertDialog open={!!paymentToDelete} onOpenChange={(isOpen) => !isOpen && setPaymentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Fee Payment Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete payment receipt{" "}
                <strong>{paymentToDelete.receiptNumber}</strong> (Amount: {formatINR(paymentToDelete.amount || 0)})?
                <br />
                <br />
                <span className="text-destructive font-medium">
                  This action cannot be undone and will revert the student fee status.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleting}
                onClick={() => handleDeletePayment(paymentToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default StudentPaymentsDialog;
