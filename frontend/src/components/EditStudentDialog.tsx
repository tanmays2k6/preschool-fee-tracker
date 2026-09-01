import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PREK_CLASSES, normalizeClass, DEFAULT_MONTHLY_FEES, DEFAULT_ANNUAL_FEE } from "@/lib/academicYear";
import { Student } from "@/types";

interface EditStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditStudentDialog = ({
  student,
  open,
  onOpenChange,
  onSuccess,
}: EditStudentDialogProps) => {
  const [formData, setFormData] = useState({
    admissionNumber: "",
    studentName: "",
    fatherName: "",
    motherName: "",
    class: "PG",
    admissionDate: "",
    monthlyFee: "1250",
    transportFee: "",
    annualCharges: String(DEFAULT_ANNUAL_FEE),
    status: "active",
    contactNumber: "",
    address: "",
    remarks: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (student && open) {
      let formattedDate = "";
      if (student.admissionDate) {
        try {
          formattedDate = new Date(student.admissionDate).toISOString().split("T")[0];
        } catch {
          formattedDate = student.admissionDate;
        }
      }

      const normClass = normalizeClass(student.class) || "PG";
      const defaultMonthly = DEFAULT_MONTHLY_FEES[normClass] || 1250;

      setFormData({
        admissionNumber: student.admissionNumber || "",
        studentName: student.studentName || "",
        fatherName: student.fatherName || "",
        motherName: student.motherName || "",
        class: normClass,
        admissionDate: formattedDate || new Date().toISOString().split("T")[0],
        monthlyFee: student.monthlyFee !== undefined && Number(student.monthlyFee) > 0 ? String(student.monthlyFee) : String(defaultMonthly),
        transportFee: student.transportFee !== undefined ? String(student.transportFee) : "0",
        annualCharges: student.annualCharges !== undefined && Number(student.annualCharges) > 0 ? String(student.annualCharges) : String(DEFAULT_ANNUAL_FEE),
        status: student.status || "active",
        contactNumber: student.contactNumber || "",
        address: student.address || "",
        remarks: student.remarks || "",
      });
    }
  }, [student, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleClassChange = (value: string) => {
    const defaultMonthly = String(DEFAULT_MONTHLY_FEES[value] || 1250);
    setFormData({ ...formData, class: value, monthlyFee: defaultMonthly });
  };

  const handleStatusChange = (value: string) => {
    setFormData({ ...formData, status: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setLoading(true);
    const studentId = student.id || student._id;

    try {
      await api.put(`/students/${studentId}`, {
        admissionNumber: formData.admissionNumber,
        studentName: formData.studentName,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        class: formData.class,
        admissionDate: formData.admissionDate,
        monthlyFee: parseFloat(formData.monthlyFee) || 0,
        transportFee: parseFloat(formData.transportFee) || 0,
        annualCharges: parseFloat(formData.annualCharges) || 0,
        status: formData.status,
        contactNumber: formData.contactNumber,
        address: formData.address,
        remarks: formData.remarks,
      });

      toast({ title: "Student details updated successfully!" });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error updating student",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>Edit Student Details</DialogTitle>
            <DialogDescription>
              Update demographic and fee configuration for {formData.studentName || "student"}.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 pt-4">
          <form id="edit-student-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admissionNumber">Admission Number *</Label>
              <Input
                id="admissionNumber"
                value={formData.admissionNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name *</Label>
              <Input
                id="studentName"
                value={formData.studentName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatherName">Father's Name *</Label>
              <Input
                id="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motherName">Mother's Name</Label>
              <Input
                id="motherName"
                value={formData.motherName}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={formData.class} onValueChange={handleClassChange} required>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {PREK_CLASSES.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={handleStatusChange} required>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admissionDate">Date of Admission / Birth *</Label>
              <Input
                id="admissionDate"
                type="date"
                value={formData.admissionDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyFee">Monthly Fee (₹) *</Label>
              <Input
                id="monthlyFee"
                type="number"
                value={formData.monthlyFee}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportFee">Transport Fee (₹)</Label>
              <Input
                id="transportFee"
                type="number"
                value={formData.transportFee}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualCharges">Annual Charges (₹)</Label>
              <Input
                id="annualCharges"
                type="number"
                value={formData.annualCharges}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact / Mobile Number *</Label>
              <Input
                id="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Input
                id="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Any special notes..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 pt-3 border-t bg-background flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" form="edit-student-form" disabled={loading} className="flex-1">
            {loading ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentDialog;
