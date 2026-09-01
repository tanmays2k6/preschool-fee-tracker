import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  LogOut,
  Plus,
  Users,
  Receipt,
  ShieldCheck,
  IndianRupee,
  Layers,
  Filter,
  RefreshCw,
} from "lucide-react";
import { StudentList } from "@/components/StudentList";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";
import { DashboardCharts } from "@/components/DashboardCharts";
import { FeesManagement } from "@/components/FeesManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ACADEMIC_SESSIONS } from "@/types";
import { PREK_CLASSES, formatINR } from "@/lib/academicYear";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Dashboard Filters
  const [dashboardClass, setDashboardClass] = useState("all");
  const [dashboardSession, setDashboardSession] = useState("2026-27");

  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      await api.get('/auth/me'); // Check auth
      const params = new URLSearchParams();
      if (dashboardClass !== "all") params.append("class", dashboardClass);
      if (dashboardSession !== "all") params.append("session", dashboardSession);

      const { data } = await api.get(`/dashboard/statistics?${params.toString()}`);
      setStats(data);
    } catch (error) {
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  }, [dashboardClass, dashboardSession, navigate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      toast({ title: "Logged out successfully" });
      navigate("/");
    } catch (error) {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="bg-card border-b border-school-navy/10 shadow-sm sticky top-0 z-30 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/school-logo.png"
              alt="FUN N LEARN SMART SCHOOL"
              className="h-11 w-11 object-contain rounded-full shadow-sm bg-white p-0.5 border border-school-orange/30"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-school-navy uppercase leading-tight">
                FUN N LEARN SMART SCHOOL
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                Preschool Fee Management & Student Tracker
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/admins")} className="text-xs h-8">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-school-navy" />
              Admins
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs h-8 text-slate-600 hover:text-destructive">
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Global Dashboard Filter Bar */}
        <div className="p-4 rounded-xl bg-card border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Dashboard Controls</h2>
              <p className="text-xs text-muted-foreground">
                Filter overview statistics and collection by Class and Academic Session
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Session:</span>
              <Select value={dashboardSession} onValueChange={setDashboardSession}>
                <SelectTrigger className="w-[125px] h-8 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_SESSIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Class:</span>
              <Select value={dashboardClass} onValueChange={setDashboardClass}>
                <SelectTrigger className="w-[125px] h-8 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {PREK_CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(dashboardClass !== "all" || dashboardSession !== "2026-27") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDashboardClass("all");
                  setDashboardSession("2026-27");
                }}
                className="h-8 text-xs text-muted-foreground"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Primary Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {dashboardClass === "all" ? "Total Enrolled" : `${dashboardClass} Students`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.activeStudents || 0} active student accounts
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Collection ({dashboardSession})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center text-primary">
                {formatINR(stats?.totalFeesCollected || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardClass === "all" ? "All Preschool Classes" : `Class ${dashboardClass} Only`}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                This Month's Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center text-blue-600">
                {formatINR(stats?.monthlyCollection || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Current calendar month</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Today's Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center text-green-600">
                {formatINR(stats?.todaysCollection || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Recorded today</p>
            </CardContent>
          </Card>
        </div>

        {/* Class-wise Collection Cards (Preschool Order: PG -> NUR -> LKG -> UKG) */}
        {stats?.classCollections && stats.classCollections.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold tracking-tight">Class-wise Collection Summary ({dashboardSession})</h3>
              </div>
              <span className="text-xs text-muted-foreground">PG &bull; NUR &bull; LKG &bull; UKG</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {stats.classCollections.map((cItem: any) => {
                const isSelected = dashboardClass === cItem.class;
                return (
                  <Card
                    key={cItem.class}
                    onClick={() => setDashboardClass(isSelected ? "all" : cItem.class)}
                    className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                      isSelected
                        ? "border-l-primary ring-2 ring-primary/30 bg-primary/5"
                        : "border-l-primary/60 hover:border-l-primary"
                    }`}
                  >
                    <CardContent className="p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base text-foreground">{cItem.class}</span>
                        <Badge variant={isSelected ? "default" : "outline"} className="text-[11px] px-1.5 py-0">
                          {cItem.count} Students
                        </Badge>
                      </div>
                      <div className="text-lg font-extrabold text-primary">
                        {formatINR(cItem.total)}
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Monthly: {formatINR(cItem.monthly)}</span>
                        <span>Annual: {formatINR(cItem.annual)}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-md hover:shadow-lg transition-shadow border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                Enroll New Student
              </CardTitle>
              <CardDescription className="text-xs">
                Register student with Class (PG / NUR / LKG / UKG) and fee schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowAddStudent(true)} className="w-full h-9 text-xs font-semibold">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Student
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow border-secondary/20 bg-secondary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4 text-secondary-foreground" />
                Collect Fee / Payment
              </CardTitle>
              <CardDescription className="text-xs">
                Record monthly fee, annual charges, or kit and generate receipt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowRecordPayment(true)} variant="secondary" className="w-full h-9 text-xs font-semibold">
                <Plus className="h-4 w-4 mr-1.5" />
                Record Payment
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Analytics & Charts */}
        <DashboardCharts refreshKey={refreshKey} />

        {/* Fee Management Component (Payments Tab, Class Monthly Status Tab, Class Overview Tab) */}
        <FeesManagement onRefreshParent={handleRefresh} />

        {/* Student Directory Table with Class Sorting & Filtering */}
        <StudentList
          key={refreshKey}
          onSuccess={handleRefresh}
          onAddStudent={() => setShowAddStudent(true)}
        />
      </main>

      <AddStudentDialog 
        open={showAddStudent} 
        onOpenChange={setShowAddStudent}
        onSuccess={handleRefresh}
      />
      
      <RecordPaymentDialog 
        open={showRecordPayment} 
        onOpenChange={setShowRecordPayment}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default Dashboard;

