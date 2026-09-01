import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Eye, Trash2, Receipt, History, CalendarCheck, ArrowUpDown, RefreshCw, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { StudentProfileDialog } from "./StudentProfileDialog";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { StudentPaymentsDialog } from "./StudentPaymentsDialog";
import { StudentFeeStatusDialog } from "./StudentFeeStatusDialog";
import { EditStudentDialog } from "./EditStudentDialog";
import { Student } from "@/types";
import { PREK_CLASSES, CLASS_ORDER, normalizeClass } from "@/lib/academicYear";

interface StudentListProps {
  onSuccess?: () => void;
}

export const StudentList = ({ onSuccess }: StudentListProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Filters
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feeStatusFilter, setFeeStatusFilter] = useState("all");
  const [sortByClass, setSortByClass] = useState<"none" | "asc" | "desc">("none");

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [feeStatusStudent, setFeeStatusStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [payStudent, setPayStudent] = useState<Student | null>(null);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  const { toast } = useToast();

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("keyword", search);
      if (classFilter !== "all") params.append("class", classFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (feeStatusFilter !== "all") params.append("feeStatus", feeStatusFilter);

      const { data } = await api.get(`/students?${params.toString()}`);
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading students",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [search, classFilter, statusFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  // Displayed students with preschool class ordering
  const displayedStudents = useMemo(() => {
    const list = [...students];
    if (sortByClass !== "none") {
      list.sort((a, b) => {
        const orderA = CLASS_ORDER[normalizeClass(a.class)] || 99;
        const orderB = CLASS_ORDER[normalizeClass(b.class)] || 99;
        return sortByClass === "asc" ? orderA - orderB : orderB - orderA;
      });
    }
    return list;
  }, [students, sortByClass]);

  const toggleClassSort = () => {
    setSortByClass((prev) => (prev === "none" ? "asc" : prev === "asc" ? "desc" : "none"));
  };

  const handleClearFilters = () => {
    setSearch("");
    setClassFilter("all");
    setStatusFilter("all");
    setFeeStatusFilter("all");
    setSortByClass("none");
  };

  const handleDelete = async () => {
    if (!deleteStudent) return;
    try {
      const studentId = deleteStudent.id || deleteStudent._id;
      await api.delete(`/students/${studentId}`);
      toast({ title: "Student deleted successfully" });
      fetchStudents();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error deleting student",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    }
    setDeleteStudent(null);
  };

  return (
    <>
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-school-navy">Student Directory</CardTitle>
              <p className="text-xs text-muted-foreground">Manage enrolled students at FUN N LEARN SMART SCHOOL</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-56">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-9 text-sm"
                />
              </div>

              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[125px] h-9 text-sm">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {PREK_CLASSES.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={feeStatusFilter} onValueChange={setFeeStatusFilter}>
                <SelectTrigger className="w-[125px] h-9 text-sm">
                  <SelectValue placeholder="Fee Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fees</SelectItem>
                  <SelectItem value="Fees Paid">Paid Fees</SelectItem>
                  <SelectItem value="Pending Fees">Pending Fees</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[115px] h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {(search || classFilter !== "all" || statusFilter !== "all" || feeStatusFilter !== "all" || sortByClass !== "none") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading students...</div>
          ) : displayedStudents.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {search || classFilter !== "all" || statusFilter !== "all"
                ? "No students found matching your search and filters."
                : "No students enrolled yet. Click 'Add Student' above."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adm No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={toggleClassSort}
                        className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
                        title="Sort by preschool order (PG -> NUR -> LKG -> UKG)"
                      >
                        Class
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        {sortByClass !== "none" && (
                          <span className="text-[10px] text-primary uppercase font-bold">
                            ({sortByClass})
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Monthly Fee</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedStudents.map((student) => {
                    const sid = student.id || student._id;
                    const normCls = normalizeClass(student.class);
                    return (
                      <TableRow key={sid}>
                        <TableCell className="font-semibold text-xs text-primary">
                          {student.admissionNumber || "-"}
                        </TableCell>
                        <TableCell className="font-medium">{student.studentName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold px-2 py-0.5 text-xs bg-muted/40">
                            {normCls || student.class || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.fatherName}</TableCell>
                        <TableCell>{student.contactNumber}</TableCell>
                        <TableCell>₹{student.monthlyFee || 0}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          ₹{student.totalPaid || 0}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              student.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {student.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setFeeStatusStudent(student)}
                              title="Display Fee Status"
                              className="h-8 px-2.5 text-xs font-medium border-primary/40 text-primary hover:bg-primary/10 gap-1.5 mr-1"
                            >
                              <CalendarCheck className="h-3.5 w-3.5" />
                              Display
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSelectedStudent(student)}
                              title="View Student Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditStudent(student)}
                              title="Edit Student Details"
                              className="text-primary hover:bg-primary/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setHistoryStudent(student)}
                              title="Payment History"
                            >
                              <History className="h-4 w-4 text-secondary-foreground" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setPayStudent(student)}
                              title="Record Payment"
                              className="text-primary hover:bg-primary/10"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteStudent(student)}
                              title="Delete Student"
                            >
                              <Trash2 className="h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Fee Status / Display Dialog */}
      <StudentFeeStatusDialog
        studentId={feeStatusStudent ? (feeStatusStudent.id || feeStatusStudent._id) : null}
        open={!!feeStatusStudent}
        onOpenChange={(open) => !open && setFeeStatusStudent(null)}
        onSuccess={() => {
          fetchStudents();
          if (onSuccess) onSuccess();
        }}
      />

      {/* Profile Dialog */}
      <StudentProfileDialog
        student={selectedStudent}
        open={!!selectedStudent}
        onOpenChange={(open) => !open && setSelectedStudent(null)}
        onEdit={(s) => setEditStudent(s)}
        onCollectFee={(s) => setPayStudent(s)}
        onDelete={(s) => setDeleteStudent(s)}
        onViewFeeStatus={(s) => setFeeStatusStudent(s)}
      />

      {/* Edit Student Dialog */}
      {editStudent && (
        <EditStudentDialog
          student={editStudent}
          open={!!editStudent}
          onOpenChange={(open) => !open && setEditStudent(null)}
          onSuccess={() => {
            fetchStudents();
            if (onSuccess) onSuccess();
          }}
        />
      )}

      {/* Payment History Dialog */}
      <StudentPaymentsDialog
        student={historyStudent}
        open={!!historyStudent}
        onOpenChange={(open) => !open && setHistoryStudent(null)}
        onSuccess={() => {
          fetchStudents();
          if (onSuccess) onSuccess();
        }}
      />

      {/* Record Payment Dialog for 1-click student fee recording */}
      {payStudent && (
        <RecordPaymentDialog
          open={!!payStudent}
          onOpenChange={(open) => !open && setPayStudent(null)}
          initialStudentId={payStudent.id || payStudent._id}
          onSuccess={() => {
            fetchStudents();
            if (onSuccess) onSuccess();
          }}
        />
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteStudent} onOpenChange={(open) => !open && setDeleteStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteStudent?.studentName}</strong>? All
              associated fee records will also be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StudentList;
