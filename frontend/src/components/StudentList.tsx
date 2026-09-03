import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Search,
  Eye,
  Trash2,
  Receipt,
  History,
  CalendarCheck,
  ArrowUpDown,
  RefreshCw,
  Pencil,
  Plus,
  MoreVertical,
  Users,
  GraduationCap,
  CheckCircle2,
  Clock,
  Phone,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { PREK_CLASSES, CLASS_ORDER, normalizeClass, formatINR } from "@/lib/academicYear";

interface StudentListProps {
  onSuccess?: () => void;
  onAddStudent?: () => void;
}

// Avatar background generator based on student name / class
const getAvatarBg = (cls: string) => {
  const norm = normalizeClass(cls);
  switch (norm) {
    case "PG":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "NUR":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "LKG":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "UKG":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

const getInitials = (name: string) => {
  if (!name) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const StudentList = ({ onSuccess, onAddStudent }: StudentListProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Filters
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feeStatusFilter, setFeeStatusFilter] = useState("all");
  const [sortByClass, setSortByClass] = useState<"none" | "asc" | "desc">("none");
  const [sortBy, setSortBy] = useState<"class" | "name" | "admission" | "none">("none");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (classFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (feeStatusFilter !== "all") count++;
    return count;
  }, [classFilter, statusFilter, feeStatusFilter]);

  // Pagination (10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog State Handlers
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
      if (data.success) {
        setStudents(data.data || []);
      } else {
        toast({ title: "Failed to load students", description: data.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({
        title: "Error fetching student records",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [search, classFilter, statusFilter, feeStatusFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  // Reset to first page whenever search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, classFilter, statusFilter, feeStatusFilter, sortByClass, sortBy]);

  // Summary Metrics computed from actual records
  const metrics = useMemo(() => {
    let pg = 0;
    let nur = 0;
    let lkg = 0;
    let ukg = 0;
    let activeCount = 0;

    students.forEach((st) => {
      const cls = normalizeClass(st.class);
      if (cls === "PG") pg++;
      else if (cls === "NUR") nur++;
      else if (cls === "LKG") lkg++;
      else if (cls === "UKG") ukg++;

      if (st.status === "active") activeCount++;
    });

    return {
      total: students.length,
      active: activeCount,
      pg,
      nur,
      lkg,
      ukg,
    };
  }, [students]);

  // Sorted and Paginated Students
  const sortedStudents = useMemo(() => {
    const list = [...students];
    if (sortBy === "class" || sortByClass !== "none") {
      list.sort((a, b) => {
        const orderA = CLASS_ORDER[normalizeClass(a.class)] || 99;
        const orderB = CLASS_ORDER[normalizeClass(b.class)] || 99;
        return sortByClass === "desc" ? orderB - orderA : orderA - orderB;
      });
    } else if (sortBy === "name") {
      list.sort((a, b) => (a.studentName || "").localeCompare(b.studentName || ""));
    } else if (sortBy === "admission") {
      list.sort((a, b) => (a.admissionNumber || "").localeCompare(b.admissionNumber || ""));
    }
    return list;
  }, [students, sortBy, sortByClass]);

  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedStudents.slice(start, start + itemsPerPage);
  }, [sortedStudents, currentPage]);

  const toggleClassSort = () => {
    setSortByClass((prev) => (prev === "none" ? "asc" : prev === "asc" ? "desc" : "none"));
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    classFilter !== "all" ||
    statusFilter !== "all" ||
    feeStatusFilter !== "all" ||
    sortByClass !== "none" ||
    sortBy !== "none";

  const handleClearFilters = () => {
    setSearch("");
    setClassFilter("all");
    setStatusFilter("all");
    setFeeStatusFilter("all");
    setSortByClass("none");
    setSortBy("none");
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
    <div className="space-y-4">
      {/* 1. Clean Page Header with Prominent "+ Add Student" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-school-navy">Student Directory</h2>
            <Badge variant="secondary" className="font-semibold text-xs bg-slate-100 text-slate-700">
              {metrics.total} Enrolled
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage enrolled students at FUN N LEARN SMART SCHOOL
          </p>
        </div>

        {onAddStudent && (
          <Button
            onClick={onAddStudent}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm text-xs h-9 px-4 self-start sm:self-auto gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        )}
      </div>

      {/* 2. Compact Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Enrolled</div>
            <div className="text-xl font-extrabold text-school-navy mt-0.5">{metrics.total}</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Playgroup</div>
            <div className="text-xl font-extrabold text-amber-900 mt-0.5">{metrics.pg}</div>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold border-amber-300 bg-amber-50 text-amber-800">
            PG
          </Badge>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-blue-700 uppercase tracking-wider">Nursery</div>
            <div className="text-xl font-extrabold text-blue-900 mt-0.5">{metrics.nur}</div>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold border-blue-300 bg-blue-50 text-blue-800">
            NUR
          </Badge>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">LKG</div>
            <div className="text-xl font-extrabold text-emerald-900 mt-0.5">{metrics.lkg}</div>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold border-emerald-300 bg-emerald-50 text-emerald-800">
            LKG
          </Badge>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-indigo-700 uppercase tracking-wider">UKG</div>
            <div className="text-xl font-extrabold text-indigo-900 mt-0.5">{metrics.ukg}</div>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold border-indigo-300 bg-indigo-50 text-indigo-800">
            UKG
          </Badge>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search input with leading icon & clear button */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search student, admission no, parent, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-10 text-xs sm:text-sm bg-slate-50/70 border-slate-200 focus:bg-white transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
                aria-label="Clear search text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Filter & Sort Bar (md:hidden) */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              type="button"
              variant={activeFilterCount > 0 ? "default" : "outline"}
              size="sm"
              onClick={() => setMobileFilterOpen(true)}
              className="flex-1 h-10 text-xs font-semibold gap-1.5"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
            </Button>

            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="flex-1 h-10 text-xs font-semibold bg-white border-slate-200">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">Sort: Default</SelectItem>
                <SelectItem value="class" className="text-xs">Sort: Class (PG &rarr; UKG)</SelectItem>
                <SelectItem value="name" className="text-xs">Sort: Student Name</SelectItem>
                <SelectItem value="admission" className="text-xs">Sort: Admission No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Filter Controls (hidden md:flex) */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            {/* Class Filter */}
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[120px] h-9 text-xs font-medium bg-white border-slate-200">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Classes</SelectItem>
                {PREK_CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls} className="text-xs">
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Fee Status Filter */}
            <Select value={feeStatusFilter} onValueChange={setFeeStatusFilter}>
              <SelectTrigger className="w-[120px] h-9 text-xs font-medium bg-white border-slate-200">
                <SelectValue placeholder="All Fees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Fees</SelectItem>
                <SelectItem value="Fees Paid" className="text-xs">Paid Fees</SelectItem>
                <SelectItem value="Pending Fees" className="text-xs">Pending Fees</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[110px] h-9 text-xs font-medium bg-white border-slate-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Status</SelectItem>
                <SelectItem value="active" className="text-xs">Active</SelectItem>
                <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset / Clear Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-9 px-2.5 text-xs text-slate-500 hover:text-slate-900 gap-1"
                title="Reset all filters"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Active:
            </span>
            {classFilter !== "all" && (
              <Badge variant="secondary" className="text-[11px] py-0.5 px-2 gap-1 bg-slate-100 text-slate-800 font-medium">
                Class: {classFilter}
                <button type="button" onClick={() => setClassFilter("all")} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {feeStatusFilter !== "all" && (
              <Badge variant="secondary" className="text-[11px] py-0.5 px-2 gap-1 bg-slate-100 text-slate-800 font-medium">
                Fee: {feeStatusFilter}
                <button type="button" onClick={() => setFeeStatusFilter("all")} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="text-[11px] py-0.5 px-2 gap-1 bg-slate-100 text-slate-800 font-medium">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter("all")} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {sortBy !== "none" && (
              <Badge variant="secondary" className="text-[11px] py-0.5 px-2 gap-1 bg-slate-100 text-slate-800 font-medium">
                Sort: {sortBy}
                <button type="button" onClick={() => setSortBy("none")} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {search && (
              <Badge variant="secondary" className="text-[11px] py-0.5 px-2 gap-1 bg-slate-100 text-slate-800 font-medium truncate max-w-[200px]">
                "{search}"
                <button type="button" onClick={() => setSearch("")} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-6 text-[11px] text-destructive hover:bg-destructive/10 px-1.5 font-semibold"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4 space-y-4">
          <SheetHeader className="text-left pb-2 border-b">
            <SheetTitle className="text-base font-bold text-school-navy flex items-center justify-between">
              <span>Filter Students</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs font-semibold">
                  {activeFilterCount} Active
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 py-2 overflow-y-auto">
            {/* Class Filter */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Preschool Class
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={classFilter === "all" ? "default" : "outline"}
                  onClick={() => setClassFilter("all")}
                  className="h-9 text-xs"
                >
                  All Classes
                </Button>
                {PREK_CLASSES.map((cls) => (
                  <Button
                    key={cls}
                    type="button"
                    size="sm"
                    variant={classFilter === cls ? "default" : "outline"}
                    onClick={() => setClassFilter(cls)}
                    className="h-9 text-xs font-bold"
                  >
                    {cls}
                  </Button>
                ))}
              </div>
            </div>

            {/* Fee Status Filter */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Fee Status
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={feeStatusFilter === "all" ? "default" : "outline"}
                  onClick={() => setFeeStatusFilter("all")}
                  className="h-9 text-xs"
                >
                  All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={feeStatusFilter === "Fees Paid" ? "default" : "outline"}
                  onClick={() => setFeeStatusFilter("Fees Paid")}
                  className="h-9 text-xs text-green-700 font-semibold"
                >
                  Paid
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={feeStatusFilter === "Pending Fees" ? "default" : "outline"}
                  onClick={() => setFeeStatusFilter("Pending Fees")}
                  className="h-9 text-xs text-amber-700 font-semibold"
                >
                  Pending
                </Button>
              </div>
            </div>

            {/* Student Account Status */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Account Status
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  className="h-9 text-xs"
                >
                  All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === "active" ? "default" : "outline"}
                  onClick={() => setStatusFilter("active")}
                  className="h-9 text-xs font-semibold"
                >
                  Active
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  onClick={() => setStatusFilter("inactive")}
                  className="h-9 text-xs font-semibold"
                >
                  Inactive
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleClearFilters();
                setMobileFilterOpen(false);
              }}
              className="flex-1 h-11 text-xs font-semibold text-slate-600"
            >
              Reset Filters
            </Button>
            <Button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="flex-1 h-11 text-xs font-bold bg-primary text-primary-foreground"
            >
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 4. Desktop Student Table & Mobile Card List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          /* Skeleton Loading Rows */
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-slate-200 rounded" />
                    <div className="h-2.5 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-4 w-12 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-200 rounded hidden md:block" />
                <div className="h-4 w-20 bg-slate-200 rounded hidden md:block" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
                <div className="h-8 w-24 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : sortedStudents.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center space-y-3 px-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <div className="text-base font-semibold text-slate-800">
              {hasActiveFilters ? "No students found matching your filters" : "No students enrolled yet"}
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {hasActiveFilters
                ? "Try searching for a different name, admission number, or clearing your active filters."
                : "Get started by adding your first student into FUN N LEARN SMART SCHOOL."}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs mt-2">
                Clear Filters
              </Button>
            ) : onAddStudent ? (
              <Button size="sm" onClick={onAddStudent} className="text-xs mt-2">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Student
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 border-b border-slate-200/80 hover:bg-slate-50/70">
                    <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Student
                    </TableHead>
                    <TableHead className="py-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <button
                        type="button"
                        onClick={toggleClassSort}
                        className="flex items-center gap-1 hover:text-primary transition-colors uppercase font-bold"
                        title="Sort by preschool order (PG -> NUR -> LKG -> UKG)"
                      >
                        Class
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        {sortByClass !== "none" && (
                          <span className="text-[10px] text-primary lowercase font-bold">
                            ({sortByClass})
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="py-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Parent / Guardian
                    </TableHead>
                    <TableHead className="py-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Mobile
                    </TableHead>
                    <TableHead className="py-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Monthly Fee
                    </TableHead>
                    <TableHead className="py-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Status
                    </TableHead>
                    <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student) => {
                    const sid = student.id || student._id;
                    const normCls = normalizeClass(student.class);
                    const isActive = student.status === "active";

                    return (
                      <TableRow
                        key={sid}
                        className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Student Cell with Initials Avatar & Admission No */}
                        <TableCell className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${getAvatarBg(
                                student.class
                              )}`}
                            >
                              {getInitials(student.studentName)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors truncate">
                                {student.studentName}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 truncate">
                                {student.admissionNumber || "—"}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Class Badge */}
                        <TableCell className="py-3.5 px-3">
                          <Badge
                            variant="outline"
                            className={`font-bold text-xs px-2 py-0.5 border ${getAvatarBg(student.class)}`}
                          >
                            {normCls || student.class || "—"}
                          </Badge>
                        </TableCell>

                        {/* Parent / Guardian */}
                        <TableCell className="py-3.5 px-3 text-xs text-slate-700">
                          {student.fatherName || student.motherName || "—"}
                        </TableCell>

                        {/* Mobile Number */}
                        <TableCell className="py-3.5 px-3">
                          {student.contactNumber ? (
                            <a
                              href={`tel:${student.contactNumber}`}
                              className="text-xs text-slate-600 hover:text-primary font-mono flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="h-3 w-3 text-slate-400" />
                              {student.contactNumber}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>

                        {/* Monthly Fee Hierarchy */}
                        <TableCell className="py-3.5 px-3">
                          <div className="text-xs font-bold text-slate-900">
                            {formatINR(student.monthlyFee || 0)}
                            <span className="text-[10px] font-normal text-slate-500 ml-0.5">/mo</span>
                          </div>
                          <div className="text-[10px] font-semibold text-emerald-600">
                            Paid: {formatINR(student.totalPaid || 0)}
                          </div>
                        </TableCell>

                        {/* Active / Inactive Status */}
                        <TableCell className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isActive ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>

                        {/* Actions: Primary "Display" button + Secondary "⋮ More" Dropdown */}
                        <TableCell className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setFeeStatusStudent(student)}
                              className="h-8 px-2.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 gap-1.5 shadow-2xs"
                              title="Display 12-Month Academic Fee Ledger"
                            >
                              <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                              Display
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                  title="More actions"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 text-xs">
                                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400">
                                  Student Actions
                                </DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setSelectedStudent(student)} className="gap-2 cursor-pointer">
                                  <Eye className="h-3.5 w-3.5 text-slate-500" /> View Profile & Ledger
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditStudent(student)} className="gap-2 cursor-pointer text-primary">
                                  <Pencil className="h-3.5 w-3.5" /> Edit Student Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setPayStudent(student)} className="gap-2 cursor-pointer">
                                  <Receipt className="h-3.5 w-3.5 text-emerald-600" /> Record Fee Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setHistoryStudent(student)} className="gap-2 cursor-pointer">
                                  <History className="h-3.5 w-3.5 text-blue-600" /> Payment Transactions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteStudent(student)}
                                  className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete Student
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List View (Phones & Small Tablets) */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedStudents.map((student) => {
                const sid = student.id || student._id;
                const normCls = normalizeClass(student.class);
                const isActive = student.status === "active";

                return (
                  <div key={sid} className="p-4 space-y-3 bg-white">
                    {/* Top Row: Avatar + Name + Admission No + More Menu (44x44 tap target) */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-11 w-11 rounded-full flex items-center justify-center font-black text-xs shrink-0 border ${getAvatarBg(
                            student.class
                          )}`}
                        >
                          {getInitials(student.studentName)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-base text-slate-900 truncate">
                            {student.studentName}
                          </div>
                          <div className="text-xs font-mono text-slate-500 truncate">
                            {student.admissionNumber || "—"}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 shrink-0 text-slate-500 hover:text-slate-900 rounded-full"
                            title="More Actions"
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 text-xs p-1.5 space-y-0.5">
                          <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                            Student Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => setSelectedStudent(student)}
                            className="gap-2.5 py-2.5 cursor-pointer font-medium"
                          >
                            <Eye className="h-4 w-4 text-slate-500" /> View Profile & Ledger
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditStudent(student)}
                            className="gap-2.5 py-2.5 cursor-pointer font-medium text-primary"
                          >
                            <Pencil className="h-4 w-4" /> Edit Student Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPayStudent(student)}
                            className="gap-2.5 py-2.5 cursor-pointer font-medium text-emerald-700"
                          >
                            <Receipt className="h-4 w-4" /> Record Fee Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setHistoryStudent(student)}
                            className="gap-2.5 py-2.5 cursor-pointer font-medium text-blue-700"
                          >
                            <History className="h-4 w-4" /> Payment History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem
                            onClick={() => setDeleteStudent(student)}
                            className="gap-2.5 py-2.5 cursor-pointer font-medium text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" /> Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Middle Info Section */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Class & Status</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold px-1.5 py-0 ${getAvatarBg(student.class)}`}
                          >
                            {normCls || student.class}
                          </Badge>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                              isActive ? "text-emerald-700" : "text-slate-500"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-600" : "bg-slate-400"}`} />
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[11px]">Parent / Guardian</span>
                        <span className="font-semibold text-slate-800 truncate block mt-0.5">
                          {student.fatherName || "—"}
                        </span>
                      </div>

                      {student.contactNumber && (
                        <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-200/50">
                          <span className="text-[11px] text-slate-500">Contact Number:</span>
                          <a
                            href={`tel:${student.contactNumber}`}
                            className="font-mono text-xs font-semibold text-primary flex items-center gap-1 hover:underline min-h-[32px] py-1"
                          >
                            <Phone className="h-3 w-3" />
                            {student.contactNumber}
                          </a>
                        </div>
                      )}

                      <div className="col-span-2 flex justify-between items-center pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="text-slate-500 text-[11px] block">Monthly Fee</span>
                          <span className="font-black text-sm text-slate-900">
                            {formatINR(student.monthlyFee || 0)}/mo
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 text-[11px] block">Total Paid</span>
                          <span className="text-emerald-700 font-bold text-xs">
                            {formatINR(student.totalPaid || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Action Button: View Details (min height 44px) */}
                    <Button
                      onClick={() => setFeeStatusStudent(student)}
                      className="w-full h-11 text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-xs"
                    >
                      <CalendarCheck className="h-4 w-4" />
                      View Details & Fee Ledger
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* 5. Pagination Bar */}
            <div className="p-3.5 bg-slate-50/50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, sortedStudents.length)}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min(currentPage * itemsPerPage, sortedStudents.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-900">{sortedStudents.length}</span> students
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 text-xs border-slate-200 bg-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Prev
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <div key={p} className="flex items-center">
                        {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                        <Button
                          variant={currentPage === p ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(p)}
                          className={`h-8 w-8 p-0 text-xs ${
                            currentPage === p
                              ? "bg-primary text-primary-foreground font-bold"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {p}
                        </Button>
                      </div>
                    );
                  })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 text-xs border-slate-200 bg-white"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fee Status / Display Dialog */}
      <StudentFeeStatusDialog
        studentId={feeStatusStudent ? feeStatusStudent.id || feeStatusStudent._id : null}
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
              Are you sure you want to delete <strong>{deleteStudent?.studentName}</strong>? All associated
              fee records will also be permanently deleted.
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
    </div>
  );
};

export default StudentList;

