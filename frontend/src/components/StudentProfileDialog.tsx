import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { jsPDF } from "jspdf";
import { Student, FeePayment } from "@/types";
import { formatDateDDMMYYYY } from "@/lib/academicYear";

interface StudentProfileDialogProps {
  student: Student | any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (student: any) => void;
  onCollectFee: (student: any) => void;
  onDelete: (student: any) => void;
  onViewFeeStatus?: (student: any) => void;
}

export const StudentProfileDialog = ({
  student,
  open,
  onOpenChange,
  onEdit,
  onCollectFee,
  onDelete,
  onViewFeeStatus,
}: StudentProfileDialogProps) => {
  const printLedger = () => {
    if (!student) return;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Student Fee Ledger", 14, 22);

    doc.setFontSize(11);
    doc.text(`Student Name: ${student.studentName}`, 14, 32);
    doc.text(`Admission No: ${student.admissionNumber || "N/A"}`, 14, 39);
    doc.text(`Class: ${student.class}`, 14, 46);
    doc.text(`Parent: ${student.fatherName} (${student.contactNumber})`, 14, 53);

    doc.setFontSize(13);
    doc.text("Payment History", 14, 65);

    if (student.feeRecords && student.feeRecords.length > 0) {
      let y = 74;
      doc.setFontSize(9);
      doc.text("Date", 14, y);
      doc.text("Receipt No", 40, y);
      doc.text("Session", 75, y);
      doc.text("Fee Type", 100, y);
      doc.text("Mode", 135, y);
      doc.text("Amount Paid", 165, y);

      y += 8;
      student.feeRecords.forEach((fee: FeePayment | any) => {
        const amt = Number(fee.amount || fee.paidAmount || 0);
        doc.text(formatDateDDMMYYYY(fee.paymentDate), 14, y);
        doc.text(fee.receiptNumber || "-", 40, y);
        doc.text(fee.session || "-", 75, y);
        doc.text(fee.feeType || fee.month || "-", 100, y);
        doc.text(fee.paymentMode || "-", 135, y);
        doc.text(`Rs. ${amt.toFixed(2)}`, 165, y);
        y += 8;
      });
    } else {
      doc.text("No fee payments recorded.", 14, 75);
    }

    doc.save(`${student.studentName}_Fee_Ledger.pdf`);
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{student.studentName}</DialogTitle>
              <DialogDescription>
                Admission No: {student.admissionNumber} | Class: {student.class}
              </DialogDescription>
            </div>
            <Badge variant={student.status === "active" ? "default" : "secondary"}>
              {student.status?.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Father's Name:</span>
                  <span className="font-medium">{student.fatherName}</span>
                  <span className="text-muted-foreground">Mother's Name:</span>
                  <span className="font-medium">{student.motherName || "N/A"}</span>
                  <span className="text-muted-foreground">Contact Number:</span>
                  <span className="font-medium">{student.contactNumber}</span>
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium">{student.address || "N/A"}</span>
                  <span className="text-muted-foreground">Date of Admission:</span>
                  <span className="font-medium font-mono">
                    {formatDateDDMMYYYY(student.admissionDate)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Fee Structure */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Fee Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Base Monthly Fee:</span>
                  <span className="font-semibold">₹{student.monthlyFee || 0}</span>
                  <span className="text-muted-foreground">Transport Fee:</span>
                  <span className="font-semibold">₹{student.transportFee || 0}</span>
                  <span className="text-muted-foreground">Total Fees Paid:</span>
                  <span className="text-green-600 font-bold">₹{student.totalPaid || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Payment History</CardTitle>
                <Button variant="outline" size="sm" onClick={printLedger}>
                  Print Ledger
                </Button>
              </CardHeader>
              <CardContent>
                {student.feeRecords && student.feeRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                        <tr>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Receipt No</th>
                          <th className="px-4 py-2">Session</th>
                          <th className="px-4 py-2">Fee Type</th>
                          <th className="px-4 py-2">Paid</th>
                          <th className="px-4 py-2">Mode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.feeRecords.map((fee: any) => {
                          const amt = Number(fee.amount || fee.paidAmount || 0);
                          const fid = fee.id || fee._id;
                          return (
                            <tr key={fid} className="border-b">
                              <td className="px-4 py-2 font-mono text-xs">
                                {formatDateDDMMYYYY(fee.paymentDate)}
                              </td>
                              <td className="px-4 py-2 font-medium text-primary">
                                {fee.receiptNumber}
                              </td>
                              <td className="px-4 py-2">{fee.session || "2026-27"}</td>
                              <td className="px-4 py-2 capitalize">
                                {fee.feeType || fee.month}
                              </td>
                              <td className="px-4 py-2 text-green-600 font-semibold">
                                ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-2 capitalize">{fee.paymentMode}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No payment history found.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t">
          {onViewFeeStatus && (
            <Button
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10"
              onClick={() => {
                onOpenChange(false);
                onViewFeeStatus(student);
              }}
            >
              Fee Status & Academic Year
            </Button>
          )}
          <Button
            onClick={() => {
              onOpenChange(false);
              onCollectFee(student);
            }}
          >
            Record Payment
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              if (onEdit) onEdit(student);
            }}
          >
            Edit Details
          </Button>
          <Button onClick={printLedger} variant="secondary">
            Print Ledger
          </Button>
          <div className="flex-1" />
          <Button
            onClick={() => {
              onOpenChange(false);
              onDelete(student);
            }}
            variant="destructive"
          >
            Delete Student
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentProfileDialog;
