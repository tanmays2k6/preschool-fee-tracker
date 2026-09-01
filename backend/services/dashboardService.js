import supabase from '../config/supabase.js';
import { PREK_CLASSES, normalizeClass } from '../utils/academicYear.js';

export const dashboardService = {
  async getStatistics(filters = {}) {
    const { class: studentClass, session } = filters;
    const normCls = studentClass && studentClass !== 'all' ? normalizeClass(studentClass) : null;

    // 1. Total students counts
    let totalQuery = supabase.from('students').select('*', { count: 'exact', head: true });
    let activeQuery = supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active');
    let inactiveQuery = supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'inactive');

    if (normCls) {
      totalQuery = totalQuery.eq('class', normCls);
      activeQuery = activeQuery.eq('class', normCls);
      inactiveQuery = inactiveQuery.eq('class', normCls);
    }

    const { count: totalStudents } = await totalQuery;
    const { count: activeStudents } = await activeQuery;
    const { count: inactiveStudents } = await inactiveQuery;

    // 2. Fees collection
    let paymentsQuery = supabase
      .from('fee_payments')
      .select(`
        id,
        amount,
        fee_type,
        session,
        month,
        payment_date,
        receipt_number,
        student_id,
        students!inner (
          id,
          name,
          admission_no,
          class
        )
      `)
      .order('payment_date', { ascending: false });

    if (session && session !== 'all') {
      paymentsQuery = paymentsQuery.eq('session', session);
    }
    if (normCls) {
      paymentsQuery = paymentsQuery.eq('students.class', normCls);
    }

    const { data: allPayments, error: paymentsErr } = await paymentsQuery;

    if (paymentsErr) {
      console.error('Error fetching payments for stats:', paymentsErr);
      throw new Error(paymentsErr.message);
    }

    const payments = allPayments || [];
    const totalFeesCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Today's collection
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    const todaysPayments = payments.filter((p) => {
      const pDate = new Date(p.payment_date).toISOString().split('T')[0];
      return pDate === todayDateString;
    });
    const todaysCollection = todaysPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // This month collection
    const currentMonthIndex = today.getMonth();
    const currentYear = today.getFullYear();

    const currentMonthPayments = payments.filter((p) => {
      const pDate = new Date(p.payment_date);
      return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonthIndex;
    });
    const monthlyCollection = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Annual Collection (Current year)
    const annualPayments = payments.filter((p) => {
      const pDate = new Date(p.payment_date);
      return pDate.getFullYear() === currentYear;
    });
    const annualCollection = annualPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Breakdown by Fee Type
    const feeTypeBreakdown = {
      monthly: payments.filter((p) => p.fee_type === 'monthly').reduce((s, p) => s + Number(p.amount || 0), 0),
      annual: payments.filter((p) => p.fee_type === 'annual').reduce((s, p) => s + Number(p.amount || 0), 0),
      uniform: payments.filter((p) => p.fee_type === 'uniform').reduce((s, p) => s + Number(p.amount || 0), 0),
      books_stationery: payments.filter((p) => p.fee_type === 'books_stationery').reduce((s, p) => s + Number(p.amount || 0), 0),
      misc: payments.filter((p) => p.fee_type === 'misc').reduce((s, p) => s + Number(p.amount || 0), 0),
    };

    // Class-wise collections breakdown
    const classCollections = {};
    PREK_CLASSES.forEach((c) => {
      classCollections[c] = {
        class: c,
        total: 0,
        monthly: 0,
        annual: 0,
        other: 0,
        count: 0,
      };
    });

    // Also get all students for class student counts
    const { data: allSts } = await supabase.from('students').select('id, class');
    (allSts || []).forEach((st) => {
      const c = normalizeClass(st.class);
      if (classCollections[c]) {
        classCollections[c].count += 1;
      }
    });

    // Compute fee totals per class
    // We fetch without class filter if we want full class comparison cards
    const { data: classPaymentData } = await supabase
      .from('fee_payments')
      .select('amount, fee_type, session, students!inner(class)')
      .eq(session ? 'session' : 'fee_type', session ? session : 'monthly'); // fallback condition

    (classPaymentData || []).forEach((p) => {
      const c = normalizeClass(p.students?.class);
      if (classCollections[c]) {
        const amt = Number(p.amount || 0);
        classCollections[c].total += amt;
        if (p.fee_type === 'monthly') classCollections[c].monthly += amt;
        else if (p.fee_type === 'annual') classCollections[c].annual += amt;
        else classCollections[c].other += amt;
      }
    });

    // Recent 5 payments
    const recentPayments = payments.slice(0, 5).map((p) => ({
      _id: p.id,
      id: p.id,
      amount: Number(p.amount || 0),
      paidAmount: Number(p.amount || 0),
      totalAmount: Number(p.amount || 0),
      dueAmount: 0,
      feeType: p.fee_type,
      month: p.month,
      session: p.session,
      paymentDate: p.payment_date,
      receiptNumber: p.receipt_number,
      studentId: p.students
        ? {
            _id: p.students.id,
            id: p.students.id,
            studentName: p.students.name,
            admissionNumber: p.students.admission_no,
            class: p.students.class,
          }
        : null,
    }));

    return {
      totalStudents: totalStudents || 0,
      activeStudents: activeStudents || 0,
      inactiveStudents: inactiveStudents || 0,
      totalFeesCollected,
      pendingFees: 0,
      overdueFees: 0,
      todaysCollection,
      monthlyCollection,
      annualCollection,
      studentsWithDues: 0,
      studentsFullyPaid: totalStudents || 0,
      feeTypeBreakdown,
      classCollections: PREK_CLASSES.map((c) => classCollections[c]),
      recentPayments,
    };
  },

  async getCharts() {
    const currentYear = new Date().getFullYear();

    const { data: payments, error } = await supabase
      .from('fee_payments')
      .select('amount, fee_type, payment_date');

    if (error) {
      console.error('Error fetching chart data:', error);
      throw new Error(error.message);
    }

    // 1. Monthly collection for current year
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCollection = months.map((m, idx) => {
      const total = (payments || [])
        .filter((p) => {
          const d = new Date(p.payment_date);
          return d.getFullYear() === currentYear && d.getMonth() === idx;
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      return { name: m, amount: total };
    });

    // 2. Class-wise students
    const { data: students, error: studentsErr } = await supabase
      .from('students')
      .select('class');

    const classCounts = {};
    (students || []).forEach((s) => {
      const c = s.class || 'Unassigned';
      classCounts[c] = (classCounts[c] || 0) + 1;
    });

    const classWiseStudents = Object.keys(classCounts).map((className) => ({
      name: className,
      value: classCounts[className],
    }));

    // 3. Fee distribution by category
    const categoryTotals = {
      'Monthly Fees': (payments || []).filter((p) => p.fee_type === 'monthly').reduce((s, p) => s + Number(p.amount || 0), 0),
      'Annual Fees': (payments || []).filter((p) => p.fee_type === 'annual').reduce((s, p) => s + Number(p.amount || 0), 0),
      'Uniform': (payments || []).filter((p) => p.fee_type === 'uniform').reduce((s, p) => s + Number(p.amount || 0), 0),
      'Books / Stationery': (payments || []).filter((p) => p.fee_type === 'books_stationery').reduce((s, p) => s + Number(p.amount || 0), 0),
      'Miscellaneous': (payments || []).filter((p) => p.fee_type === 'misc').reduce((s, p) => s + Number(p.amount || 0), 0),
    };

    const feeDistributionData = Object.keys(categoryTotals)
      .filter((k) => categoryTotals[k] > 0)
      .map((k) => ({
        name: k,
        value: categoryTotals[k],
      }));

    // Fee Status Data (Paid vs Dues)
    const feeStatusData = [
      { name: 'Fully Paid', value: (students || []).length },
      { name: 'With Dues', value: 0 },
    ];

    return {
      monthlyCollection,
      classWiseStudents,
      feeStatusData,
      feeDistributionData: feeDistributionData.length > 0 ? feeDistributionData : [{ name: 'Collections', value: 1 }],
    };
  },
};

export default dashboardService;
