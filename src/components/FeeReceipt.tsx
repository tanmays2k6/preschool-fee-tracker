import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Printer } from "lucide-react";

interface FeeReceiptProps {
  payment: {
    id: string;
    amount: number;
    payment_date: string;
    transaction_id: string;
    fee_month: string | null;
    fee_type: string;
    student: {
      name: string;
      parent_name: string;
      class: string;
      mobile_number: string;
    };
  };
  onClose: () => void;
}

export const FeeReceipt = ({ payment, onClose }: FeeReceiptProps) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 print:shadow-none" id="receipt">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-full">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Fee Receipt</h2>
            <p className="text-sm text-muted-foreground">Preschool Fee Management System</p>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Receipt No.</p>
                <p className="font-medium">{payment.id.split('-')[0].toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(payment.payment_date).toLocaleDateString()}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Student Details</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{payment.student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parent:</span>
                  <span className="font-medium">{payment.student.parent_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Class:</span>
                  <span className="font-medium">{payment.student.class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mobile:</span>
                  <span className="font-medium">{payment.student.mobile_number}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Payment Details</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee Type:</span>
                  <span className="font-medium capitalize">{payment.fee_type} Fee</span>
                </div>
                {payment.fee_month && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Month:</span>
                    <span className="font-medium">{payment.fee_month}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-medium">{payment.transaction_id}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Amount Paid:</span>
                <span className="text-2xl font-bold text-primary">₹{payment.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p className="mt-1">For any queries, please contact the school administration.</p>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 print:hidden">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Close
        </Button>
        <Button onClick={handlePrint} className="flex-1">
          <Printer className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
      </div>
    </div>
  );
};
