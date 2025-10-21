import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  transaction_id: string;
  fee_month: string | null;
  fee_type: string;
}

interface StudentPaymentsDialogProps {
  student: {
    id: string;
    name: string;
    parent_name: string;
    class: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StudentPaymentsDialog = ({ student, open, onOpenChange }: StudentPaymentsDialogProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student && open) {
      fetchPayments();
    }
  }, [student, open]);

  const fetchPayments = async () => {
    if (!student) return;
    
    setLoading(true);
    const { data } = await supabase
      .from("fee_payments")
      .select("*")
      .eq("student_id", student.id)
      .order("payment_date", { ascending: false });

    setPayments(data || []);
    setLoading(false);
  };

  if (!student) return null;

  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment History - {student.name}</DialogTitle>
          <DialogDescription>
            Class: {student.class} | Parent: {student.parent_name}
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Fees Paid:</span>
              <span className="text-2xl font-bold text-primary">₹{totalPaid.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No payments recorded yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={payment.fee_type === "annual" ? "default" : "secondary"}>
                      {payment.fee_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.fee_month || "-"}</TableCell>
                  <TableCell className="font-semibold">₹{Number(payment.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{payment.transaction_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
