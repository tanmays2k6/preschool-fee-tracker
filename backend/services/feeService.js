import supabase from '../config/supabase.js';
import settingsService from './settingsService.js';
import { normalizeClass } from '../utils/academicYear.js';

export const feeService = {
  formatPayment(row) {
    if (!row) return null;
    const student = row.students
      ? {
          id: row.students.id,
          _id: row.students.id,
          studentName: row.students.name,
          admissionNumber: row.students.admission_no,
          fatherName: row.students.father_name,
          class: row.students.class,
          contactNumber: row.students.phone,
        }
      : null;

    const amount = Number(row.amount || 0);

    return {
      id: row.id,
      _id: row.id, // For backwards compatibility
      studentId: row.student_id,
      session: row.session,
      month: row.month,
      feeType: row.fee_type,
      paymentMode: row.payment_mode,
      amount: amount,
      paidAmount: amount,
      totalAmount: amount,
      dueAmount: 0,
      uniformType: row.uniform_type,
      uniformSize: row.uniform_size,
      description: row.description,
      receiptNumber: row.receipt_number,
      paymentDate: row.payment_date,
      collectedBy: row.collected_by,
      remarks: row.remarks,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      student,
    };
  },

  async generateReceiptNumber(sessionYear) {
    const settings = await settingsService.getSettings();
    const prefix = settings?.receiptPrefix || 'FNL-';
    const year = sessionYear || new Date().getFullYear();

    // Fetch total payment count to generate sequential receipt number
    const { count, error } = await supabase
      .from('fee_payments')
      .select('*', { count: 'exact', head: true });

    const nextCount = (count || 0) + 1;
    return `${prefix}${year}-${nextCount.toString().padStart(4, '0')}`;
  },

  async getAllFees(filters = {}) {
    const { session, feeType, month, studentId, paymentMode, startDate, endDate, class: studentClass } = filters;

    let query = supabase
      .from('fee_payments')
      .select(`
        *,
        students!inner (
          id,
          name,
          admission_no,
          father_name,
          class,
          phone
        )
      `)
      .order('payment_date', { ascending: false });

    if (session) query = query.eq('session', session);
    if (feeType && feeType !== 'all') query = query.eq('fee_type', feeType);
    if (month && month !== 'all') query = query.ilike('month', month);
    if (studentId) query = query.eq('student_id', studentId);
    if (paymentMode && paymentMode !== 'all') query = query.eq('payment_mode', paymentMode);
    if (startDate) query = query.gte('payment_date', startDate);
    if (endDate) query = query.lte('payment_date', endDate);
    if (studentClass && studentClass !== 'all') {
      query = query.eq('students.class', normalizeClass(studentClass));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching fees:', error);
      throw new Error(error.message);
    }

    return (data || []).map((row) => this.formatPayment(row));
  },

  async getFeesByStudent(studentId, session) {
    let query = supabase
      .from('fee_payments')
      .select(`
        *,
        students (
          id,
          name,
          admission_no,
          father_name,
          class,
          phone
        )
      `)
      .eq('student_id', studentId)
      .order('payment_date', { ascending: false });

    if (session) {
      query = query.eq('session', session);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching fees by student:', error);
      throw new Error(error.message);
    }

    return (data || []).map((row) => this.formatPayment(row));
  },

  async getFeeById(id) {
    const { data, error } = await supabase
      .from('fee_payments')
      .select(`
        *,
        students (
          id,
          name,
          admission_no,
          father_name,
          class,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    return this.formatPayment(data);
  },

  async createFee(payload, user = {}) {
    const {
      studentId,
      session,
      month,
      feeType,
      paymentMode,
      amount,
      uniformType,
      uniformSize,
      description,
      paymentDate,
      collectedBy,
      remarks,
    } = payload;

    // 1. Validation
    if (!studentId) throw new Error('Student is required.');
    if (!session) throw new Error('Academic session is required.');
    if (!feeType) throw new Error('Fee type is required.');
    if (!paymentMode) throw new Error('Payment mode is required.');
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Amount must be greater than zero.');
    }

    // Conditional fee type validation
    if (feeType === 'monthly') {
      if (!month || month.trim() === '') {
        throw new Error('Please select a month for monthly fee.');
      }
    }

    if (feeType === 'uniform') {
      if (!uniformType) throw new Error('Please select a uniform type.');
      if (!uniformSize) throw new Error('Please select a uniform size.');
    }

    if (feeType === 'misc' || feeType === 'books_stationery') {
      if (feeType === 'misc' && (!description || description.trim() === '')) {
        throw new Error('Description is required for miscellaneous fee.');
      }
    }

    // Check student existence
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, admission_no, father_name, class, phone')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      throw new Error('Student not found.');
    }

    // 2. Duplicate Monthly Fee Protection check
    if (feeType === 'monthly') {
      const { data: existingMonthly } = await supabase
        .from('fee_payments')
        .select('id, receipt_number')
        .eq('student_id', studentId)
        .eq('session', session)
        .eq('month', month)
        .eq('fee_type', 'monthly')
        .limit(1);

      if (existingMonthly && existingMonthly.length > 0) {
        throw new Error(`Monthly fee for ${month} (${session}) has already been recorded (Receipt: ${existingMonthly[0].receipt_number}).`);
      }
    }

    // 3. Generate Receipt Number
    const yearPart = session ? session.split('-')[0] : new Date().getFullYear().toString();
    const receiptNumber = await this.generateReceiptNumber(yearPart);

    // 4. Prepare DB Row
    const insertRow = {
      student_id: studentId,
      session,
      month: month || null,
      fee_type: feeType,
      payment_mode: paymentMode.toLowerCase(),
      amount: parsedAmount,
      uniform_type: feeType === 'uniform' ? uniformType : null,
      uniform_size: feeType === 'uniform' ? uniformSize : null,
      description: (feeType === 'misc' || feeType === 'books_stationery') ? description : (description || null),
      receipt_number: receiptNumber,
      payment_date: paymentDate || new Date().toISOString(),
      collected_by: user.name || collectedBy || 'Admin',
      remarks: remarks || null,
    };

    const { data, error } = await supabase
      .from('fee_payments')
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('idx_unique_monthly_fee')) {
          throw new Error(`Monthly fee for ${month} (${session}) has already been recorded.`);
        }
        throw new Error('Receipt number collision. Please retry.');
      }
      console.error('Error inserting fee payment:', error);
      throw new Error(error.message);
    }

    return this.formatPayment({
      ...data,
      students: student,
    });
  },

  async updateFee(id, updateData) {
    const payload = {};
    if (updateData.session !== undefined) payload.session = updateData.session;
    if (updateData.month !== undefined) payload.month = updateData.month;
    if (updateData.feeType !== undefined) payload.fee_type = updateData.feeType;
    if (updateData.paymentMode !== undefined) payload.payment_mode = updateData.paymentMode.toLowerCase();
    if (updateData.amount !== undefined) payload.amount = parseFloat(updateData.amount);
    if (updateData.uniformType !== undefined) payload.uniform_type = updateData.uniformType;
    if (updateData.uniformSize !== undefined) payload.uniform_size = updateData.uniformSize;
    if (updateData.description !== undefined) payload.description = updateData.description;
    if (updateData.paymentDate !== undefined) payload.payment_date = updateData.paymentDate;
    if (updateData.remarks !== undefined) payload.remarks = updateData.remarks;

    const { data, error } = await supabase
      .from('fee_payments')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        students (
          id,
          name,
          admission_no,
          father_name,
          class,
          phone
        )
      `)
      .single();

    if (error) {
      console.error('Error updating fee payment:', error);
      throw new Error(error.message);
    }

    return this.formatPayment(data);
  },

  async deleteFee(id) {
    const { error } = await supabase.from('fee_payments').delete().eq('id', id);
    if (error) {
      console.error('Error deleting fee payment:', error);
      throw new Error(error.message);
    }
    return true;
  },
};

export default feeService;
