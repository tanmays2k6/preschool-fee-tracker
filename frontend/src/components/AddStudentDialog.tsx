import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PREK_CLASSES, DEFAULT_MONTHLY_FEES, DEFAULT_ANNUAL_FEE } from "@/lib/academicYear";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddStudentDialog = ({ open, onOpenChange, onSuccess }: AddStudentDialogProps) => {
  const [formData, setFormData] = useState({
    admissionNumber: "",
    studentName: "",
    fatherName: "",
    motherName: "",
    class: "PG",
    admissionDate: new Date().toISOString().split('T')[0],
    monthlyFee: "1250",
    annualCharges: String(DEFAULT_ANNUAL_FEE),
    contactNumber: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleClassChange = (value: string) => {
    const fee = String(DEFAULT_MONTHLY_FEES[value] || 1250);
    setFormData({ ...formData, class: value, monthlyFee: fee });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/students', formData);
      toast({ title: "Student added successfully!" });
      setFormData({
        admissionNumber: "",
        studentName: "",
        fatherName: "",
        motherName: "",
        class: "",
        admissionDate: new Date().toISOString().split('T')[0],
        monthlyFee: "",
        annualCharges: "",
        contactNumber: "",
        address: "",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error adding student",
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
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Enter the student's details to enroll them.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-6 pt-4">
          <form id="add-student-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admissionNumber">Admission Number *</Label>
              <Input id="admissionNumber" value={formData.admissionNumber} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name *</Label>
              <Input id="studentName" value={formData.studentName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherName">Father's Name *</Label>
              <Input id="fatherName" value={formData.fatherName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherName">Mother's Name</Label>
              <Input id="motherName" value={formData.motherName} onChange={handleChange} />
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
              <Label htmlFor="admissionDate">Admission Date *</Label>
              <Input id="admissionDate" type="date" value={formData.admissionDate} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyFee">Monthly Fee (₹) *</Label>
              <Input id="monthlyFee" type="number" value={formData.monthlyFee} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualCharges">Annual Charges (₹)</Label>
              <Input id="annualCharges" type="number" value={formData.annualCharges} onChange={handleChange} placeholder="5000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact / Phone *</Label>
              <Input id="contactNumber" value={formData.contactNumber} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" value={formData.address} onChange={handleChange} required />
            </div>
          </form>
        </div>
        <div className="p-6 pt-3 border-t bg-background flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" form="add-student-form" disabled={loading} className="flex-1">
            {loading ? "Adding..." : "Add Student"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default AddStudentDialog;
