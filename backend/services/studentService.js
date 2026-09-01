import supabase from '../config/supabase.js';
import {
  getAcademicYearMonths,
  parseAcademicSession,
  PREK_CLASSES,
  CLASS_ORDER,
  normalizeClass,
  isValidClass,
} from '../utils/academicYear.js';
import settingsService from './settingsService.js';

export const studentService = {
  formatStudent(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id, // For backwards compatibility with frontend
      admissionNumber: row.admission_no,
      studentName: row.name,
      fatherName: row.father_name,
      motherName: row.mother_name || '',
      class: row.class,
      admissionDate: row.admission_date,
      monthlyFee: Number(row.monthly_fee || 0),
      transportFee: Number(row.transport_fee || 0),
      admissionFee: Number(row.admission_fee || 0),
      annualCharges: Number(row.annual_charges || 0),
      concession: Number(row.concession || 0),
      status: row.status,
      contactNumber: row.phone,
      address: row.address,
      remarks: row.remarks || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Aggregates attached when joined:
      pendingFee: row.pendingFee !== undefined ? row.pendingFee : 0,
      totalPaid: row.totalPaid !== undefined ? row.totalPaid : 0,
      feeRecords: row.feeRecords || [],
    };
  },

  async getAllStudents(query = {}) {
    const { keyword, class: studentClass, status, feeStatus, page, limit } = query;

    // Fetch students
    let dbQuery = supabase
      .from('students')
      .select(`
        *,
        fee_payments (
          id,
          student_id,
          session,
          month,
          fee_type,
          payment_mode,
          amount,
          uniform_type,
          uniform_size,
          description,
          receipt_number,
          payment_date
        )
      `)
      .order('created_at', { ascending: false });

    if (studentClass && studentClass !== 'all') {
      dbQuery = dbQuery.eq('class', studentClass);
    }

    if (status && status !== 'all') {
      dbQuery = dbQuery.eq('status', status);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Error fetching students:', error);
      throw new Error(error.message);
    }

    let students = (data || []).map((row) => {
      const payments = (row.fee_payments || []).map((p) => ({
        id: p.id,
        _id: p.id,
        studentId: p.student_id,
        session: p.session,
        month: p.month,
        feeType: p.fee_type,
        paymentMode: p.payment_mode,
        amount: Number(p.amount || 0),
        paidAmount: Number(p.amount || 0),
        totalAmount: Number(p.amount || 0),
        dueAmount: 0,
        uniformType: p.uniform_type,
        uniformSize: p.uniform_size,
        description: p.description,
        receiptNumber: p.receipt_number,
        paymentDate: p.payment_date,
      }));

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      // Pending Fee estimation: monthly fee * 1 (or 0 if paid this month)
      // If student has payments, we compute paid vs pending
      const pendingFee = 0; // In standard ledger

      return this.formatStudent({
        ...row,
        totalPaid,
        pendingFee,
        feeRecords: payments,
      });
    });

    // Keyword filtering across multiple fields
    if (keyword && keyword.trim() !== '') {
      const k = keyword.trim().toLowerCase();
      students = students.filter(
        (s) =>
          (s.studentName && s.studentName.toLowerCase().includes(k)) ||
          (s.admissionNumber && s.admissionNumber.toLowerCase().includes(k)) ||
          (s.fatherName && s.fatherName.toLowerCase().includes(k)) ||
          (s.contactNumber && s.contactNumber.toLowerCase().includes(k))
      );
    }

    // Fee Status filtering
    if (feeStatus && feeStatus !== 'all') {
      if (feeStatus === 'Pending Fees') {
        students = students.filter((s) => s.pendingFee > 0);
      } else if (feeStatus === 'Fees Paid') {
        students = students.filter((s) => s.pendingFee === 0 && s.totalPaid > 0);
      }
    }

    // Sorting: if sortBy is 'class', sort by preschool order (PG -> NUR -> LKG -> UKG)
    const { sortBy, sortOrder } = query;
    if (sortBy === 'class') {
      const order = sortOrder === 'desc' ? -1 : 1;
      students.sort((a, b) => {
        const orderA = CLASS_ORDER[normalizeClass(a.class)] || 99;
        const orderB = CLASS_ORDER[normalizeClass(b.class)] || 99;
        return (orderA - orderB) * order;
      });
    }

    // Pagination
    if (page && limit) {
      const p = parseInt(page, 10);
      const l = parseInt(limit, 10);
      const start = (p - 1) * l;
      return students.slice(start, start + l);
    }

    return students;
  },

  async getStudentById(id) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        fee_payments (
          id,
          student_id,
          session,
          month,
          fee_type,
          payment_mode,
          amount,
          uniform_type,
          uniform_size,
          description,
          receipt_number,
          payment_date
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    const payments = (data.fee_payments || []).map((p) => ({
      id: p.id,
      _id: p.id,
      studentId: p.student_id,
      session: p.session,
      month: p.month,
      feeType: p.fee_type,
      paymentMode: p.payment_mode,
      amount: Number(p.amount || 0),
      paidAmount: Number(p.amount || 0),
      totalAmount: Number(p.amount || 0),
      dueAmount: 0,
      uniformType: p.uniform_type,
      uniformSize: p.uniform_size,
      description: p.description,
      receiptNumber: p.receipt_number,
      paymentDate: p.payment_date,
    }));

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return this.formatStudent({
      ...data,
      totalPaid,
      pendingFee: 0,
      feeRecords: payments,
    });
  },

  async createStudent(studentData) {
    const rawName = (studentData.studentName || studentData.name || '').trim();
    const rawAdm = (studentData.admissionNumber || studentData.admission_no || '').trim().toUpperCase();
    const rawClass = studentData.class;
    const rawFather = (studentData.fatherName || studentData.father_name || '').trim();

    if (!rawName) throw new Error('Student name is required.');
    if (!rawAdm) throw new Error('Admission number is required.');
    if (!rawClass) throw new Error('Class is required.');
    if (!rawFather) throw new Error('Parent / Guardian name is required.');

    const normalizedCls = normalizeClass(rawClass);
    if (!isValidClass(normalizedCls)) {
      throw new Error(`Invalid class: "${rawClass}". Allowed classes: PG, NUR, LKG, UKG`);
    }

    const payload = {
      admission_no: rawAdm,
      name: rawName,
      father_name: rawFather,
      mother_name: (studentData.motherName || studentData.mother_name || '').trim(),
      class: normalizedCls,
      admission_date: studentData.admissionDate || studentData.admission_date || new Date().toISOString(),
      monthly_fee: parseFloat(studentData.monthlyFee || studentData.monthly_fee || 0),
      transport_fee: parseFloat(studentData.transportFee || studentData.transport_fee || 0),
      admission_fee: parseFloat(studentData.admissionFee || studentData.admission_fee || 0),
      annual_charges: parseFloat(studentData.annualCharges || studentData.annual_charges || 0),
      concession: parseFloat(studentData.concession || 0),
      status: studentData.status || 'active',
      phone: (studentData.contactNumber || studentData.phone || '').trim(),
      address: (studentData.address || '').trim(),
      remarks: (studentData.remarks || '').trim(),
    };

    const { data, error } = await supabase
      .from('students')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Admission number already exists.');
      }
      console.error('Error creating student:', error);
      throw new Error(error.message);
    }

    return this.formatStudent(data);
  },

  async updateStudent(id, updateData) {
    const payload = {};
    if (updateData.admissionNumber !== undefined) payload.admission_no = updateData.admissionNumber.trim().toUpperCase();
    if (updateData.studentName !== undefined) {
      const name = updateData.studentName.trim();
      if (!name) throw new Error('Student name cannot be empty.');
      payload.name = name;
    }
    if (updateData.fatherName !== undefined) {
      const father = updateData.fatherName.trim();
      if (!father) throw new Error('Parent / Guardian name cannot be empty.');
      payload.father_name = father;
    }
    if (updateData.motherName !== undefined) payload.mother_name = updateData.motherName.trim();
    if (updateData.class !== undefined) {
      const normalizedCls = normalizeClass(updateData.class);
      if (!isValidClass(normalizedCls)) {
        throw new Error(`Invalid class: "${updateData.class}". Allowed classes: PG, NUR, LKG, UKG`);
      }
      payload.class = normalizedCls;
    }
    if (updateData.admissionDate !== undefined) payload.admission_date = updateData.admissionDate;
    if (updateData.monthlyFee !== undefined) payload.monthly_fee = parseFloat(updateData.monthlyFee);
    if (updateData.transportFee !== undefined) payload.transport_fee = parseFloat(updateData.transportFee);
    if (updateData.annualCharges !== undefined) payload.annual_charges = parseFloat(updateData.annualCharges);
    if (updateData.status !== undefined) payload.status = updateData.status;
    if (updateData.contactNumber !== undefined) payload.phone = updateData.contactNumber.trim();
    if (updateData.address !== undefined) payload.address = updateData.address.trim();
    if (updateData.remarks !== undefined) payload.remarks = updateData.remarks.trim();

    const { data, error } = await supabase
      .from('students')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Admission number already exists.');
      }
      console.error('Error updating student:', error);
      throw new Error(error.message);
    }

    return this.formatStudent(data);
  },

  async deleteStudent(id) {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      console.error('Error deleting student:', error);
      throw new Error(error.message);
    }
    return true;
  },

  async getStudentFeeStatus(studentId, sessionParam) {
    // 1. Fetch student
    const student = await this.getStudentById(studentId);
    if (!student) {
      return null;
    }

    // 2. Resolve Academic Session
    let session = sessionParam;
    if (!session) {
      const settings = await settingsService.getSettings();
      session = settings?.academicSession || '2026-27';
    }
    const { session: normalizedSession } = parseAcademicSession(session);

    // 3. Fetch all payments for this student and session
    const { data: paymentsData, error } = await supabase
      .from('fee_payments')
      .select('*')
      .eq('student_id', studentId)
      .eq('session', normalizedSession)
      .order('payment_date', { ascending: true });

    if (error) {
      console.error('Error fetching fee status payments:', error);
      throw new Error(error.message);
    }

    const allPayments = (paymentsData || []).map((p) => ({
      id: p.id,
      _id: p.id,
      studentId: p.student_id,
      session: p.session,
      month: p.month,
      feeType: p.fee_type,
      paymentMode: p.payment_mode,
      amount: Number(p.amount || 0),
      paidAmount: Number(p.amount || 0),
      uniformType: p.uniform_type,
      uniformSize: p.uniform_size,
      description: p.description,
      receiptNumber: p.receipt_number,
      paymentDate: p.payment_date,
      collectedBy: p.collected_by,
      remarks: p.remarks,
      createdAt: p.created_at,
    }));

    // 4. Generate 12 Academic Months (April -> March)
    const academicMonths = getAcademicYearMonths(normalizedSession);

    // 5. Map monthly fees (matches feeType monthly or any payment with that month specified)
    const monthlyPayments = allPayments.filter((p) => p.feeType === 'monthly' || p.month);
    const monthlyFees = academicMonths.map(({ label, month, year }) => {
      // Find matching payment for this month (case-insensitive)
      const payment = monthlyPayments.find(
        (p) => p.month && p.month.toLowerCase() === month.toLowerCase()
      );

      return {
        label,
        month,
        year,
        status: payment ? 'paid' : 'pending',
        payment: payment || null,
      };
    });

    const paidMonthsCount = monthlyFees.filter((m) => m.status === 'paid').length;
    const pendingMonthsCount = 12 - paidMonthsCount;
    const totalMonthlyFeesPaid = monthlyFees.reduce(
      (sum, m) => sum + (m.payment ? m.payment.amount : 0),
      0
    );

    // 6. Annual fee status & payments
    // Matches feeType === 'annual' OR any composite payment that includes "Annual Charges" in description
    const annualPayments = allPayments.filter(
      (p) =>
        p.feeType === 'annual' ||
        (p.description && /Annual Charges/i.test(p.description))
    ).map((p) => {
      // If payment is composite, extract the specific annual amount (e.g. ₹3000)
      if (p.description && p.description.includes('|') && /Annual Charges/i.test(p.description)) {
        const match = p.description.match(/Annual Charges[^:]*:\s*₹?(\d+(?:\.\d+)?)/i);
        const extractedAmt = match ? parseFloat(match[1]) : (Number(student.annualCharges) || 3000);
        return {
          ...p,
          amount: extractedAmt,
          paidAmount: extractedAmt,
        };
      }
      return p;
    });

    const totalAnnualPaid = annualPayments.reduce((sum, p) => sum + p.amount, 0);

    const annualFee = {
      status: annualPayments.length > 0 ? 'paid' : 'pending',
      payments: annualPayments,
      totalPaid: totalAnnualPaid,
    };

    // 7. Other Payments (Uniform, Books/Stationery, Misc)
    const otherPayments = allPayments.filter(
      (p) => !['monthly', 'annual'].includes(p.feeType)
    );

    return {
      student: {
        id: student.id,
        _id: student.id,
        admissionNumber: student.admissionNumber,
        admissionNo: student.admissionNumber,
        studentName: student.studentName,
        name: student.studentName,
        fatherName: student.fatherName,
        parentName: student.fatherName,
        motherName: student.motherName,
        class: student.class,
        contactNumber: student.contactNumber,
        phone: student.contactNumber,
        monthlyFee: student.monthlyFee,
        annualCharges: student.annualCharges,
        status: student.status,
      },
      session: normalizedSession,
      monthlyFees,
      monthlySummary: {
        paidMonths: paidMonthsCount,
        pendingMonths: pendingMonthsCount,
        totalPaid: totalMonthlyFeesPaid,
      },
      annualFee,
      otherPayments,
    };
  },

  /**
   * Returns class-wise fee summary for all 4 preschool classes (PG, NUR, LKG, UKG)
   * for a given academic session.
   */
  async getClassFeeOverview(sessionParam) {
    let session = sessionParam;
    if (!session) {
      const settings = await settingsService.getSettings();
      session = settings?.academicSession || '2026-27';
    }
    const { session: normalizedSession } = parseAcademicSession(session);

    // Fetch active/all students
    const { data: students, error: sErr } = await supabase
      .from('students')
      .select('id, name, admission_no, class, status');

    if (sErr) throw new Error(sErr.message);

    // Fetch all payments for this session
    const { data: payments, error: pErr } = await supabase
      .from('fee_payments')
      .select('student_id, amount, fee_type')
      .eq('session', normalizedSession);

    if (pErr) throw new Error(pErr.message);

    // Map student_id to normalized student class
    const studentClassMap = new Map();
    (students || []).forEach((st) => {
      studentClassMap.set(st.id, normalizeClass(st.class));
    });

    // Initialize class containers
    const overview = {};
    PREK_CLASSES.forEach((cls) => {
      overview[cls] = {
        class: cls,
        studentsCount: 0,
        monthlyFees: 0,
        annualFees: 0,
        otherFees: 0,
        totalCollection: 0,
      };
    });

    // Count students per class
    (students || []).forEach((st) => {
      const cls = normalizeClass(st.class);
      if (overview[cls]) {
        overview[cls].studentsCount += 1;
      }
    });

    // Aggregate payments per class
    (payments || []).forEach((p) => {
      const cls = studentClassMap.get(p.student_id);
      if (cls && overview[cls]) {
        const amt = Number(p.amount || 0);
        overview[cls].totalCollection += amt;

        if (p.description && p.description.includes('|')) {
          // Composite bundle: break down individual items
          let monthlyPortion = 0;
          let annualPortion = 0;

          const monthlyMatch = p.description.match(/Monthly Tuition[^:]*:\s*₹?(\d+(?:\.\d+)?)/i);
          if (monthlyMatch) monthlyPortion = parseFloat(monthlyMatch[1]);

          const annualMatch = p.description.match(/Annual Charges[^:]*:\s*₹?(\d+(?:\.\d+)?)/i);
          if (annualMatch) annualPortion = parseFloat(annualMatch[1]);

          const otherPortion = Math.max(0, amt - monthlyPortion - annualPortion);

          overview[cls].monthlyFees += monthlyPortion;
          overview[cls].annualFees += annualPortion;
          overview[cls].otherFees += otherPortion;
        } else if (p.fee_type === 'monthly') {
          overview[cls].monthlyFees += amt;
        } else if (p.fee_type === 'annual') {
          overview[cls].annualFees += amt;
        } else {
          overview[cls].otherFees += amt;
        }
      }
    });

    return {
      session: normalizedSession,
      classes: PREK_CLASSES.map((cls) => overview[cls]),
      totalStudents: (students || []).length,
      grandTotalCollection: Object.values(overview).reduce(
        (sum, item) => sum + item.totalCollection,
        0
      ),
    };
  },

  /**
   * Returns class-level monthly fee paid vs pending breakdown for a given month and session
   */
  async getClassMonthlyFeeStatus(className, monthName, sessionParam) {
    const normalizedCls = normalizeClass(className);
    if (!isValidClass(normalizedCls)) {
      throw new Error(`Invalid class: "${className}". Allowed classes: PG, NUR, LKG, UKG`);
    }

    let session = sessionParam;
    if (!session) {
      const settings = await settingsService.getSettings();
      session = settings?.academicSession || '2026-27';
    }
    const { session: normalizedSession } = parseAcademicSession(session);

    // 1. Get all students in this class
    const { data: students, error: sErr } = await supabase
      .from('students')
      .select('id, name, admission_no, father_name, phone, class, monthly_fee, status')
      .eq('class', normalizedCls);

    if (sErr) throw new Error(sErr.message);

    const studentList = students || [];

    // 2. Fetch monthly fee payments for this class and month/session
    let query = supabase
      .from('fee_payments')
      .select('id, student_id, amount, payment_date, payment_mode, receipt_number, month, session, fee_type, description')
      .eq('session', normalizedSession)
      .not('month', 'is', null);

    if (monthName && monthName !== 'all') {
      query = query.ilike('month', monthName);
    }

    const { data: payments, error: pErr } = await query;
    if (pErr) throw new Error(pErr.message);

    const paymentsMap = new Map();
    (payments || []).forEach((p) => {
      // Store under student_id -> payment
      if (!paymentsMap.has(p.student_id) || p.fee_type === 'monthly') {
        paymentsMap.set(p.student_id, p);
      }
    });

    // 3. Map each student to Paid or Pending
    const studentStatusList = studentList.map((st) => {
      const p = paymentsMap.get(st.id);
      const studentMonthlyFee = Number(st.monthly_fee || 0);

      // If this payment was part of a combo transaction (with | or : in description),
      // determine the monthly tuition amount (e.g. ₹1250)
      let displayMonthlyAmount = p ? Number(p.amount) : null;
      if (p && p.description && p.description.includes('|')) {
        // Find monthly tuition part in description
        const match = p.description.match(/Monthly Tuition[^:]*:\s*₹?(\d+(?:\.\d+)?)/i);
        if (match) {
          displayMonthlyAmount = parseFloat(match[1]);
        } else if (studentMonthlyFee > 0) {
          displayMonthlyAmount = studentMonthlyFee;
        }
      }

      return {
        student: {
          id: st.id,
          _id: st.id,
          studentName: st.name,
          admissionNumber: st.admission_no,
          fatherName: st.father_name,
          contactNumber: st.phone,
          class: st.class,
          monthlyFee: studentMonthlyFee,
          status: st.status,
        },
        status: p ? 'paid' : 'pending',
        amount: displayMonthlyAmount,
        paymentDate: p ? p.payment_date : null,
        paymentMode: p ? p.payment_mode : null,
        receiptNumber: p ? p.receipt_number : null,
        paymentId: p ? p.id : null,
        rawPayment: p || null,
      };
    });

    const paidStudents = studentStatusList.filter((s) => s.status === 'paid');
    const pendingStudents = studentStatusList.filter((s) => s.status === 'pending');
    const totalCollected = paidStudents.reduce((sum, s) => sum + (s.amount || 0), 0);

    return {
      class: normalizedCls,
      month: monthName,
      session: normalizedSession,
      totalStudents: studentList.length,
      paidCount: paidStudents.length,
      pendingCount: pendingStudents.length,
      totalCollected,
      students: studentStatusList,
    };
  },
};

export default studentService;
