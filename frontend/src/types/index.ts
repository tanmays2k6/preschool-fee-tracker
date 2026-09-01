export type FeeType =
  | 'monthly'
  | 'annual'
  | 'uniform'
  | 'books_stationery'
  | 'misc';

export type PaymentMode =
  | 'cash'
  | 'online'
  | 'cheque'
  | 'upi'
  | 'bank_transfer';

export type UniformType =
  | 'winter'
  | 'summer'
  | 'sports'
  | 'red_white';

export const PREK_CLASSES = ['PG', 'NUR', 'LKG', 'UKG'] as const;
export type StudentClass = (typeof PREK_CLASSES)[number];

export const CLASS_ORDER: Record<string, number> = {
  PG: 1,
  NUR: 2,
  LKG: 3,
  UKG: 4,
};

export const ACADEMIC_SESSIONS = [
  '2024-25',
  '2025-26',
  '2026-27',
  '2027-28',
  '2028-29',
] as const;

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export interface Student {
  id: string;
  _id: string;
  admissionNumber: string;
  studentName: string;
  fatherName: string;
  motherName?: string;
  class: string;
  admissionDate: string;
  monthlyFee: number;
  transportFee: number;
  admissionFee?: number;
  annualCharges?: number;
  concession?: number;
  status: 'active' | 'inactive';
  contactNumber: string;
  address: string;
  remarks?: string;
  pendingFee?: number;
  totalPaid?: number;
  feeRecords?: FeePayment[];
}

export interface FeePayment {
  id: string;
  _id: string;
  studentId: string;
  session: string;
  month?: string | null;
  feeType: FeeType;
  paymentMode: PaymentMode;
  amount: number;
  paidAmount?: number;
  totalAmount?: number;
  dueAmount?: number;
  uniformType?: UniformType | null;
  uniformSize?: string | null;
  description?: string | null;
  receiptNumber: string;
  paymentDate: string;
  collectedBy?: string;
  remarks?: string;
  student?: {
    id: string;
    _id: string;
    studentName: string;
    admissionNumber: string;
    fatherName: string;
    class: string;
    contactNumber: string;
  };
}

export interface MonthlyFeeStatusItem {
  label: string;
  month: string;
  year: number;
  status: 'paid' | 'pending';
  payment: FeePayment | null;
}

export interface StudentFeeStatusResponse {
  student: {
    id: string;
    _id: string;
    admissionNumber: string;
    admissionNo: string;
    studentName: string;
    name: string;
    fatherName: string;
    parentName: string;
    motherName?: string;
    class: string;
    contactNumber: string;
    phone: string;
    monthlyFee: number;
    annualCharges?: number;
    status: 'active' | 'inactive';
  };
  session: string;
  monthlyFees: MonthlyFeeStatusItem[];
  monthlySummary: {
    paidMonths: number;
    pendingMonths: number;
    totalPaid: number;
  };
  annualFee: {
    status: 'paid' | 'pending';
    payments: FeePayment[];
    totalPaid: number;
  };
  otherPayments: FeePayment[];
}

export interface ClassFeeOverviewItem {
  class: StudentClass;
  studentsCount: number;
  monthlyFees: number;
  annualFees: number;
  otherFees: number;
  totalCollection: number;
}

export interface ClassFeeOverviewResponse {
  session: string;
  classes: ClassFeeOverviewItem[];
  totalStudents: number;
  grandTotalCollection: number;
}

export interface ClassMonthlyStudentItem {
  student: {
    id: string;
    _id: string;
    studentName: string;
    admissionNumber: string;
    fatherName: string;
    contactNumber: string;
    class: string;
    monthlyFee: number;
    status: string;
  };
  status: 'paid' | 'pending';
  amount: number | null;
  paymentDate: string | null;
  paymentMode: string | null;
  receiptNumber: string | null;
  paymentId: string | null;
}

export interface ClassMonthlyFeeStatusResponse {
  class: string;
  month: string;
  session: string;
  totalStudents: number;
  paidCount: number;
  pendingCount: number;
  totalCollected: number;
  students: ClassMonthlyStudentItem[];
}
