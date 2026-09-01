import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FeeReceipt } from "./FeeReceipt";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Student {
  id: string;
  name: string;
}

export const RecordPaymentDialog = ({ open, onOpenChange, onSuccess }: RecordPaymentDialogProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactionId, setTransactionId] = useState("");
  const [feeMonth, setFeeMonth] = useState("");
  const [feeType, setFeeType] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("id, name").order("name");
    setStudents(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();

    const { data: paymentData, error } = await supabase
      .from("fee_payments")
      .insert({
        student_id: studentId,
        amount: parseFloat(amount),
        payment_date: paymentDate,
        transaction_id: transactionId,
        fee_month: feeType === "monthly" ? feeMonth : null,
        fee_type: feeType,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Payment recorded successfully!" });
      setReceiptData({
        ...paymentData,
        student,
      });
      setShowReceipt(true);
      onSuccess();
    }
    setLoading(false);
  };

  const handleClose = () => {
    setStudentId("");
    setAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setTransactionId("");
    setFeeMonth("");
    setFeeType("monthly");
    setShowReceipt(false);
    setReceiptData(null);
    onOpenChange(false);
  };

  if (showReceipt && receiptData) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <FeeReceipt payment={receiptData} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Fee Payment</DialogTitle>
          <DialogDescription>Enter payment details to generate a receipt.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Select Student *</Label>
            <Select value={studentId} onValueChange={setStudentId} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feeType">Fee Type *</Label>
            <Select value={feeType} onValueChange={(value: "monthly" | "annual") => setFeeType(value)} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Fee</SelectItem>
                <SelectItem value="annual">Annual Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {feeType === "monthly" && (
            <div className="space-y-2">
              <Label htmlFor="month">Month *</Label>
              <Input
                id="month"
                placeholder="e.g., January 2024"
                value={feeMonth}
                onChange={(e) => setFeeMonth(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Payment Date *</Label>
            <Input
              id="date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction">Transaction ID *</Label>
            <Input
              id="transaction"
              placeholder="Enter transaction ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant="secondary" className="flex-1">
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
