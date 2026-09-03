import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, CheckCircle2, ShieldCheck, X, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import api from "@/lib/api";
import { FeePayment } from "@/types";
import {
  formatINR,
  normalizeClass,
  generateReceiptFilename,
  getAcademicMonthYear,
  numberToWordsINR,
  formatDateDDMMYYYY,
} from "@/lib/academicYear";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

interface FeeReceiptProps {
  payment: FeePayment | any;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDeletePayment?: (payment: FeePayment | any) => void;
}

export const FeeReceipt = ({ payment, onClose, open, onOpenChange, onDeletePayment }: FeeReceiptProps) => {
  const { toast } = useToast();
  const [currentPayment, setCurrentPayment] = useState<FeePayment | any>(payment);
  const [downloading, setDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setCurrentPayment(payment);
  }, [payment]);

  if (!currentPayment) return null;

  const handleRegenerate = async () => {
    const sId = currentPayment.studentId || currentPayment.student?.id || currentPayment.student?._id;
    if (!sId) {
      toast({ title: "No student ID found on this payment record", variant: "destructive" });
      return;
    }

    try {
      setRefreshing(true);
      toast({ title: "Refreshing student details..." });

      const { data: updatedStudent } = await api.get(`/students/${sId}`);

      if (updatedStudent) {
        setCurrentPayment((prev: any) => ({
          ...prev,
          student: {
            id: updatedStudent.id || updatedStudent._id,
            _id: updatedStudent.id || updatedStudent._id,
            studentName: updatedStudent.studentName || updatedStudent.name,
            admissionNumber: updatedStudent.admissionNumber || updatedStudent.admissionNo,
            fatherName: updatedStudent.fatherName || updatedStudent.father_name,
            motherName: updatedStudent.motherName || updatedStudent.mother_name,
            class: updatedStudent.class,
            contactNumber: updatedStudent.contactNumber || updatedStudent.phone,
            address: updatedStudent.address,
          },
          studentName: updatedStudent.studentName || updatedStudent.name,
          admissionNumber: updatedStudent.admissionNumber || updatedStudent.admissionNo,
          fatherName: updatedStudent.fatherName || updatedStudent.father_name,
          class: updatedStudent.class,
          contactNumber: updatedStudent.contactNumber || updatedStudent.phone,
        }));

        toast({
          title: "Receipt regenerated with updated student details!",
          description: `Synced with latest records for ${updatedStudent.studentName || updatedStudent.name}.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error refreshing student details",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      toast({ title: "Generating PDF Receipt...", description: "Please wait a moment" });

      const receiptElement = document.getElementById("fee-receipt-content");
      if (!receiptElement) {
        throw new Error("Receipt element not found");
      }

      // High resolution capture
      const canvas = await html2canvas(receiptElement, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;
      
      // Margins & dimensions for elegant A4 centering
      const margin = 12;
      const printableWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * printableWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", margin, margin, printableWidth, Math.min(imgHeight, pageHeight - margin * 2));

      // Standard requested filename convention
      const studentName = currentPayment.student?.studentName || currentPayment.studentName || "Student";
      const studentClass = currentPayment.student?.class || currentPayment.class || "Class";
      const fileName = generateReceiptFilename({
        studentName,
        studentClass,
        feeType: currentPayment.feeType,
        month: currentPayment.month,
        session: currentPayment.session,
      });

      pdf.save(fileName);
      toast({ title: "PDF downloaded successfully!", description: fileName });
    } catch (error: any) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error generating PDF",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const formatFeeTypeLabel = (type: string) => {
    switch (type) {
      case "monthly":
        return "Monthly Tuition Fee";
      case "annual":
        return "Annual Charges & Development Fee";
      case "form_fee":
      case "admission_form":
        return "Admission / Application Form Fee";
      case "uniform":
        return "Uniform & Attire Charges";
      case "books_stationery":
        return "Books, Stationery & Activity Kit";
      case "misc":
        return "Combined / Miscellaneous Fee";
      default:
        return type || "School Fee";
    }
  };

  const formatPaymentMode = (mode: string) => {
    if (!mode) return "Cash";
    if (mode === "upi" || mode === "online") return "Online / UPI";
    if (mode === "bank_transfer") return "Bank Transfer";
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  const amountPaid = Number(currentPayment.amount || currentPayment.paidAmount || 0);
  const studentClass = normalizeClass(currentPayment.student?.class || currentPayment.class) || currentPayment.student?.class || "-";
  const studentName = currentPayment.student?.studentName || currentPayment.studentName || "N/A";
  const admissionNumber = currentPayment.student?.admissionNumber || currentPayment.admissionNumber || "N/A";
  const parentName = currentPayment.student?.fatherName || currentPayment.fatherName || currentPayment.student?.parentName || "N/A";
  const contactNumber = currentPayment.student?.contactNumber || currentPayment.contactNumber || currentPayment.student?.phone || "";
  const session = currentPayment.session || "2026-27";
  const displayMonth = currentPayment.month ? getAcademicMonthYear(currentPayment.month, session, true) : null;

  const content = (
    <div className="flex flex-col max-h-[85vh] w-full">
      {/* Scrollable Container with explicit overflow */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-4">
        {/* Receipt Printable / Render Card with clean A4 proportions */}
        <Card
          id="fee-receipt-content"
          ref={receiptRef}
          className="p-3 sm:p-7 print:p-6 print:shadow-none bg-white text-slate-900 border border-slate-200 shadow-xs max-w-xl mx-auto font-sans w-full overflow-hidden"
        >
          <div className="space-y-4">
            {/* HEADER: LOGO & SCHOOL DETAILS */}
            <div className="flex flex-col items-center text-center space-y-1.5 pb-1">
              {/* School Logo */}
              <div className="flex items-center justify-center">
                <img
                  src="/assets/school-logo.png"
                  alt="Fun N Learn Smart School Logo"
                  className="h-16 w-auto object-contain max-w-[160px]"
                  onError={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.display = "none";
                  }}
                />
              </div>

              {/* School Name */}
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                Fun N Learn Smart School
              </h1>

              {/* School Address */}
              <p className="text-[11px] text-slate-600 max-w-md leading-tight font-medium">
                H/O Prof S Lal, Saketpuri, Near Pump House, Bazar Samiti, Rajendra Nagar, Patna-800016
              </p>

              {/* School Contact */}
              <p className="text-[11px] font-semibold text-slate-800 tracking-wide">
                Contact: +918789217008
              </p>
            </div>

            {/* DIVIDER & RECEIPT TITLE */}
            <div className="relative py-0.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 py-0.5 text-xs font-bold tracking-widest text-primary border border-slate-300 rounded uppercase">
                  FEE RECEIPT
                </span>
              </div>
            </div>

            {/* RECEIPT META HEADER (Receipt No & Date) */}
            <div className="grid grid-cols-2 gap-2 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded text-xs">
              <div>
                <span className="text-slate-500 font-medium">Receipt No: </span>
                <span className="font-bold text-primary font-mono text-xs">{currentPayment.receiptNumber || "-"}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Date: </span>
                <span className="font-semibold text-slate-800 text-xs">
                  {formatDateDDMMYYYY(currentPayment.paymentDate || new Date())}
                </span>
              </div>
            </div>

            {/* SECTION: FEE DETAILS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  FEE DETAILS
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Academic Session: <strong className="text-slate-800">{session}</strong>
                </span>
              </div>

              {/* 2-Column Student and Payment Information */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-800">
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-bold text-slate-900">{studentName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-500">Admission No:</span>
                  <span className="font-semibold text-slate-900 font-mono">{admissionNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-500">Class:</span>
                  <span className="font-bold text-slate-900 uppercase bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                    {studentClass}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-500">Parent / Guardian:</span>
                  <span className="font-semibold text-slate-900">{parentName}</span>
                </div>

                {contactNumber && (
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500">Contact Number:</span>
                    <span className="font-medium text-slate-800">{contactNumber}</span>
                  </div>
                )}

                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-500">Fee Category:</span>
                  <span className="font-semibold text-slate-900">{formatFeeTypeLabel(currentPayment.feeType)}</span>
                </div>

                {/* Conditional Month for Monthly fees */}
                {currentPayment.feeType === "monthly" && displayMonth && (
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500">For Month:</span>
                    <span className="font-bold text-primary">{displayMonth}</span>
                  </div>
                )}

                {/* Conditional Uniform Particulars */}
                {currentPayment.feeType === "uniform" && (
                  <>
                    {currentPayment.uniformType && (
                      <div className="flex justify-between border-b border-slate-100 pb-0.5">
                        <span className="text-slate-500">Uniform Category:</span>
                        <span className="font-semibold capitalize text-slate-900">{currentPayment.uniformType}</span>
                      </div>
                    )}
                    {currentPayment.uniformSize && (
                      <div className="flex justify-between border-b border-slate-100 pb-0.5">
                        <span className="text-slate-500">Uniform Size:</span>
                        <span className="font-semibold text-slate-900">Size {currentPayment.uniformSize}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Mode of Payment */}
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-semibold text-slate-900 capitalize">{formatPaymentMode(currentPayment.paymentMode)}</span>
                </div>

                {currentPayment.remarks && (
                  <div className="col-span-2 flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500">Remarks:</span>
                    <span className="font-medium text-slate-700">{currentPayment.remarks}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION: ITEMIZED FEE PARTICULARS TABLE */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                FEE BREAKDOWN & PARTICULARS
              </span>
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-300 text-slate-700">
                      <th className="py-2 px-3 font-bold text-left">Fee Type / Particulars</th>
                      <th className="py-2 px-3 font-bold text-right w-36">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {/* If multiple items separated by | exist in description */}
                    {currentPayment.description && currentPayment.description.includes(" | ") ? (
                      currentPayment.description.split(" | ").map((itemStr: string, idx: number) => {
                        const colonIdx = itemStr.lastIndexOf(":");
                        let itemName = itemStr.trim();
                        let itemAmount = "";

                        if (colonIdx !== -1) {
                          itemName = itemStr.substring(0, colonIdx).trim();
                          itemAmount = itemStr.substring(colonIdx + 1).trim();
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 text-slate-800 font-medium">
                              {itemName}
                            </td>
                            <td className="py-2 px-3 text-slate-900 font-bold text-right font-mono">
                              {itemAmount ? (itemAmount.startsWith("₹") ? itemAmount : `₹${itemAmount}`) : "-"}
                            </td>
                          </tr>
                        );
                      })
                    ) : currentPayment.description && currentPayment.description.includes(":") ? (
                      // Single item with colon format
                      (() => {
                        const colonIdx = currentPayment.description.lastIndexOf(":");
                        const itemName = currentPayment.description.substring(0, colonIdx).trim();
                        const itemAmt = currentPayment.description.substring(colonIdx + 1).trim();
                        return (
                          <tr className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 text-slate-800 font-medium">
                              {itemName || formatFeeTypeLabel(currentPayment.feeType)}
                            </td>
                            <td className="py-2 px-3 text-slate-900 font-bold text-right font-mono">
                              {itemAmt ? (itemAmt.startsWith("₹") ? itemAmt : `₹${itemAmt}`) : formatINR(amountPaid)}
                            </td>
                          </tr>
                        );
                      })()
                    ) : (
                      /* Standard Single Item Breakdown */
                      <tr className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 text-slate-800 font-medium">
                          {formatFeeTypeLabel(currentPayment.feeType)}
                          {currentPayment.feeType === "monthly" && displayMonth && (
                            <span className="text-primary font-semibold ml-1.5">({displayMonth})</span>
                          )}
                          {currentPayment.feeType === "uniform" && currentPayment.uniformType && (
                            <span className="text-muted-foreground ml-1.5 capitalize">
                              ({currentPayment.uniformType}
                              {currentPayment.uniformSize ? `, Size ${currentPayment.uniformSize}` : ""})
                            </span>
                          )}
                          {currentPayment.description && (
                            <span className="text-slate-600 ml-1.5 block text-[11px]">
                              {currentPayment.description}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-900 font-bold text-right font-mono">
                          {formatINR(amountPaid)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                      <td className="py-2 px-3 text-slate-800 uppercase tracking-wide text-right">
                        Total Amount Paid:
                      </td>
                      <td className="py-2 px-3 text-primary text-right font-extrabold text-sm font-mono">
                        {formatINR(amountPaid)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* AMOUNT PAID IN WORDS BOX */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-300 space-y-1">
              <div className="text-[11px] text-slate-700 italic">
                Amount in words: <strong className="text-slate-900 not-italic uppercase font-semibold">{numberToWordsINR(amountPaid)}</strong>
              </div>
            </div>

            {/* SIGNATURE FOOTER */}
            <div className="pt-3 mt-2 border-t border-slate-200 flex justify-between items-end">
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="h-3 w-3" />
                  Verified & Recorded
                </div>
                <p className="text-[10px] text-slate-400">Computer generated official receipt.</p>
              </div>

              {/* Director / Authorised Signatory with Signature Image */}
              <div className="flex flex-col items-center justify-end">
                <div className="h-12 flex items-center justify-center mb-0.5">
                  <img
                    src="/assets/director-signature.png"
                    alt="Director Signature"
                    className="max-h-11 max-w-[120px] object-contain"
                    onError={(e) => {
                      // Fallback to SVG if PNG fails
                      (e.target as HTMLImageElement).src = "/assets/director-signature.svg";
                    }}
                  />
                </div>
                <div className="border-b border-slate-400 w-32 mb-1"></div>
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Authorised Signatory
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons Footer (Sticky at bottom, hidden when printing) */}
      <div className="flex flex-wrap gap-2 print:hidden justify-between items-center pt-3 border-t bg-background mt-auto z-10 pb-safe">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onDeletePayment && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="text-xs h-10 sm:h-9 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 flex-1 sm:flex-initial min-h-[40px]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Payment
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={refreshing}
            className="text-xs h-10 sm:h-9 gap-1.5 border-primary/40 text-primary hover:bg-primary/10 flex-1 sm:flex-initial min-h-[40px]"
            title="Refresh receipt with latest student name, class, parent & contact details"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Updating..." : "Regenerate"}
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onClose && (
            <Button variant="outline" onClick={onClose} className="text-xs h-10 sm:h-9 min-h-[40px] flex-1 sm:flex-initial">
              Close
            </Button>
          )}
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            variant="secondary"
            className="text-xs h-10 sm:h-9 gap-1.5 font-semibold min-h-[40px] flex-1 sm:flex-initial"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? "Downloading..." : "PDF"}
          </Button>
          <Button onClick={handlePrint} className="text-xs h-10 sm:h-9 gap-1.5 font-bold min-h-[40px] flex-1 sm:flex-initial bg-primary text-primary-foreground">
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>

      {/* Double-Check Delete Payment Confirmation Modal */}
      {confirmDelete && (
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Fee Payment Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete receipt{" "}
                <strong>{payment.receiptNumber}</strong> (Amount: {formatINR(amountPaid)}) for{" "}
                <strong>{studentName}</strong>?
                <br />
                <br />
                <span className="text-destructive font-medium">
                  This action cannot be undone and will revert the student's payment status for this period to pending.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmDelete(false);
                  if (onDeletePayment) onDeletePayment(payment);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirm Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );

  // If used inside a Dialog controller with open / onOpenChange props
  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-3 sm:p-6 overflow-hidden">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
};

export default FeeReceipt;
