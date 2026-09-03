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
  Menu,
  X,
  LayoutDashboard,
  CreditCard,
  FileText,
  User,
  ChevronRight,
} from "lucide-react";
import { StudentList } from "@/components/StudentList";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";
import { DashboardCharts } from "@/components/DashboardCharts";
import { FeesManagement } from "@/components/FeesManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { ACADEMIC_SESSIONS } from "@/types";
import { PREK_CLASSES, formatINR } from "@/lib/academicYear";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Mobile Navigation State
  const [mobileTab, setMobileTab] = useState<"home" | "students" | "fees" | "reports">("home");
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col">
      {/* 1. Mobile & Desktop App Shell Header (Height: 56-64px) */}
      <header className="bg-card/95 border-b border-school-navy/10 shadow-xs sticky top-0 z-30 backdrop-blur">
        <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          {/* Left: Mobile Drawer Button + School Logo + Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden h-10 w-10 shrink-0 text-slate-700 hover:text-primary hover:bg-slate-100"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <img
              src="/assets/school-logo.png"
              alt="FUN N LEARN SMART SCHOOL"
              className="h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-full shadow-xs bg-white p-0.5 border border-school-orange/30 shrink-0"
            />

            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-black tracking-tight text-school-navy uppercase leading-tight truncate">
                FUN N LEARN <span className="hidden xs:inline sm:inline">SMART SCHOOL</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate hidden sm:block">
                Preschool Fee Management & Student Tracker
              </p>
            </div>
          </div>

          {/* Desktop Right Navigation Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/admins")} className="text-xs h-9">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-school-navy" />
              Admins
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs h-9 text-slate-600 hover:text-destructive">
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Logout
            </Button>
          </div>

          {/* Mobile Right Action */}
          <div className="flex lg:hidden items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => setShowRecordPayment(true)}
              className="h-8 px-2.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1 shadow-xs"
              title="Record Payment"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Pay</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              className="h-9 w-9 text-slate-600 hover:bg-slate-100 rounded-full"
              aria-label="Navigation & Profile Menu"
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Slide-out Mobile Navigation Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-xs p-0 flex flex-col bg-card">
          <div className="p-4 border-b bg-muted/20 flex items-center gap-3">
            <img
              src="/assets/school-logo.png"
              alt="Logo"
              className="h-10 w-10 object-contain rounded-full shadow-xs bg-white p-0.5 border border-school-orange/30"
            />
            <div className="min-w-0">
              <div className="font-extrabold text-sm text-school-navy uppercase tracking-tight">
                Fun N Learn
              </div>
              <div className="text-[11px] text-muted-foreground">Smart School &bull; Patna</div>
            </div>
          </div>

          {/* Academic Session Selector in Drawer */}
          <div className="p-4 border-b bg-slate-50/50 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Academic Session
            </span>
            <Select
              value={dashboardSession}
              onValueChange={(val) => {
                setDashboardSession(val);
                setDrawerOpen(false);
              }}
            >
              <SelectTrigger className="w-full h-9 text-xs font-semibold bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACADEMIC_SESSIONS.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    Academic Year {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <button
              type="button"
              onClick={() => {
                setMobileTab("home");
                setDrawerOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors min-h-[44px] ${
                mobileTab === "home" ? "bg-primary text-primary-foreground" : "text-slate-700 hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard Overview
              </span>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileTab("students");
                setDrawerOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors min-h-[44px] ${
                mobileTab === "students" ? "bg-primary text-primary-foreground" : "text-slate-700 hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="h-4 w-4" />
                Student Directory
              </span>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileTab("fees");
                setDrawerOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors min-h-[44px] ${
                mobileTab === "fees" ? "bg-primary text-primary-foreground" : "text-slate-700 hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Receipt className="h-4 w-4" />
                Fees & Payments Ledger
              </span>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileTab("reports");
                setDrawerOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors min-h-[44px] ${
                mobileTab === "reports" ? "bg-primary text-primary-foreground" : "text-slate-700 hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="h-4 w-4" />
                Class Monthly Reports
              </span>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>

            <div className="pt-2 pb-1">
              <div className="border-t border-slate-100" />
            </div>

            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                navigate("/admins");
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-muted transition-colors min-h-[44px]"
            >
              <span className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-school-navy" />
                Admin Management
              </span>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-3 border-t bg-muted/10 space-y-2">
            <Button
              onClick={() => {
                setDrawerOpen(false);
                setShowAddStudent(true);
              }}
              className="w-full text-xs font-semibold h-10 gap-1.5"
            >
              <Plus className="h-4 w-4" /> Enroll New Student
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDrawerOpen(false);
                setShowRecordPayment(true);
              }}
              className="w-full text-xs font-semibold h-10 gap-1.5"
            >
              <Plus className="h-4 w-4" /> Record Fee Payment
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full text-xs font-semibold h-10 text-destructive hover:bg-destructive/10 border-destructive/20 gap-1.5"
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 3. Main Content Container (with pb-20 on mobile for bottom nav clearance) */}
      <main className="container mx-auto px-3 sm:px-4 py-3 sm:py-6 flex-1 pb-24 lg:pb-8 space-y-4 sm:space-y-6">
        {/* Global Dashboard Filter Bar (shown on desktop and on mobile home tab) */}
        <div className={`${mobileTab !== "home" ? "hidden lg:flex" : "flex"} p-3.5 sm:p-4 rounded-xl bg-card border shadow-xs flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4`}>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary shrink-0" />
            <div>
              <h2 className="text-xs sm:text-sm font-semibold">Dashboard Controls</h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Filter overview statistics and collection by Class and Academic Session
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Session:</span>
              <Select value={dashboardSession} onValueChange={setDashboardSession}>
                <SelectTrigger className="w-full sm:w-[125px] h-8 text-xs font-semibold">
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

            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Class:</span>
              <Select value={dashboardClass} onValueChange={setDashboardClass}>
                <SelectTrigger className="w-full sm:w-[125px] h-8 text-xs font-semibold">
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
                className="h-8 text-xs text-muted-foreground px-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* MOBILE VIEW (lg:hidden): Focused Tab Sections            */}
        {/* ======================================================== */}
        <div className="lg:hidden space-y-6">
          {/* TAB: HOME OVERVIEW */}
          {mobileTab === "home" && (
            <div className="space-y-5">
              {/* Primary Metric Cards in 2-column grid */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="shadow-xs hover:shadow-sm transition-shadow">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                      {dashboardClass === "all" ? "Total Enrolled" : `${dashboardClass} Students`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xl font-bold">{stats?.totalStudents || 0}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {stats?.activeStudents || 0} active students
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-xs hover:shadow-sm transition-shadow">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                      Total ({dashboardSession})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xl font-bold text-primary truncate">
                      {formatINR(stats?.totalFeesCollected || 0)}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {dashboardClass === "all" ? "All Classes" : `${dashboardClass} Only`}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-xs hover:shadow-sm transition-shadow">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                      This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xl font-bold text-blue-600 truncate">
                      {formatINR(stats?.monthlyCollection || 0)}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Calendar month</p>
                  </CardContent>
                </Card>

                <Card className="shadow-xs hover:shadow-sm transition-shadow">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                      Today's Collection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xl font-bold text-green-600 truncate">
                      {formatINR(stats?.todaysCollection || 0)}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Recorded today</p>
                  </CardContent>
                </Card>
              </div>

              {/* Class-wise Collection Cards (2-Column Grid on mobile) */}
              {stats?.classCollections && stats.classCollections.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Class Collections ({dashboardSession})
                      </h3>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Tap class to filter</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {stats.classCollections.map((cItem: any) => {
                      const isSelected = dashboardClass === cItem.class;
                      return (
                        <Card
                          key={cItem.class}
                          onClick={() => setDashboardClass(isSelected ? "all" : cItem.class)}
                          className={`cursor-pointer transition-all border-l-4 ${
                            isSelected
                              ? "border-l-primary ring-2 ring-primary/30 bg-primary/5"
                              : "border-l-primary/60 hover:border-l-primary"
                          }`}
                        >
                          <CardContent className="p-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-foreground">{cItem.class}</span>
                              <Badge variant={isSelected ? "default" : "outline"} className="text-[10px] px-1 py-0 h-4">
                                {cItem.count}
                              </Badge>
                            </div>
                            <div className="text-base font-extrabold text-primary">
                              {formatINR(cItem.total)}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              Mo: {formatINR(cItem.monthly)} &bull; An: {formatINR(cItem.annual)}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setShowAddStudent(true)}
                  className="h-11 text-xs font-semibold gap-1.5 shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  Add Student
                </Button>
                <Button
                  onClick={() => setShowRecordPayment(true)}
                  variant="secondary"
                  className="h-11 text-xs font-semibold gap-1.5 shadow-xs"
                >
                  <Receipt className="h-4 w-4" />
                  Record Payment
                </Button>
              </div>

              {/* Analytics & Charts */}
              <DashboardCharts refreshKey={refreshKey} />
            </div>
          )}

          {/* TAB: STUDENTS */}
          {mobileTab === "students" && (
            <StudentList
              key={refreshKey}
              onSuccess={handleRefresh}
              onAddStudent={() => setShowAddStudent(true)}
            />
          )}

          {/* TAB: FEES */}
          {mobileTab === "fees" && (
            <div className="space-y-4">
              <Button
                onClick={() => setShowRecordPayment(true)}
                className="w-full h-11 text-xs font-bold gap-2 shadow-xs bg-primary text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Record Fee Payment / Collect Receipt
              </Button>
              <FeesManagement onRefreshParent={handleRefresh} defaultTab="payments" />
            </div>
          )}

          {/* TAB: REPORTS */}
          {mobileTab === "reports" && (
            <FeesManagement onRefreshParent={handleRefresh} defaultTab="class-status" />
          )}
        </div>

        {/* ======================================================== */}
        {/* DESKTOP VIEW (hidden lg:block): Full Stacked Layout      */}
        {/* ======================================================== */}
        <div className="hidden lg:block space-y-6">
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

          {/* Class-wise Collection Cards */}
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

          {/* Desktop Action Buttons */}
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

          {/* Fee Management Component */}
          <FeesManagement onRefreshParent={handleRefresh} />

          {/* Student Directory Table with Class Sorting & Filtering */}
          <StudentList
            key={refreshKey}
            onSuccess={handleRefresh}
            onAddStudent={() => setShowAddStudent(true)}
          />
        </div>
      </main>

      {/* 4. Mobile Bottom Navigation Bar (Fixed bottom on < lg devices) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 shadow-lg pb-safe">
        <div className="grid grid-cols-5 h-14 items-center">
          <button
            id="mobile-nav-home"
            type="button"
            onClick={() => setMobileTab("home")}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              mobileTab === "home" ? "text-primary font-bold" : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <LayoutDashboard className={`h-4 w-4 ${mobileTab === "home" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
          </button>

          <button
            id="mobile-nav-students"
            type="button"
            onClick={() => setMobileTab("students")}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              mobileTab === "students" ? "text-primary font-bold" : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <Users className={`h-4 w-4 ${mobileTab === "students" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Students</span>
          </button>

          <button
            id="mobile-nav-fees"
            type="button"
            onClick={() => setMobileTab("fees")}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              mobileTab === "fees" ? "text-primary font-bold" : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <Receipt className={`h-4 w-4 ${mobileTab === "fees" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Fees</span>
          </button>

          <button
            id="mobile-nav-reports"
            type="button"
            onClick={() => setMobileTab("reports")}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              mobileTab === "reports" ? "text-primary font-bold" : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <Layers className={`h-4 w-4 ${mobileTab === "reports" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Reports</span>
          </button>

          <button
            id="mobile-nav-more"
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center h-full min-h-[44px] text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <Menu className="h-4 w-4 stroke-[1.8]" />
            <span className="text-[10px] mt-0.5 tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Dialogs */}
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

