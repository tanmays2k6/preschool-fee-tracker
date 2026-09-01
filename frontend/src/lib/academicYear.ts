/**
 * Academic Year Utilities
 * Centralized logic for parsing academic sessions (e.g. "2026-27")
 * and calculating academic-year months (April of start year -> March of end year).
 */

export const ACADEMIC_MONTH_NAMES = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
] as const;

export interface AcademicMonthInfo {
  label: string;
  month: string;
  year: number;
}

/**
 * Parses session string (e.g. "2026-27" or "2026-2027") into startYear and endYear numbers.
 */
export function parseAcademicSession(session?: string): {
  startYear: number;
  endYear: number;
  session: string;
} {
  if (typeof session === 'string') {
    const parts = session.trim().split('-');
    if (parts.length === 2) {
      const startYear = parseInt(parts[0], 10);
      let endYear = parseInt(parts[1], 10);
      if (!isNaN(startYear)) {
        if (parts[1].length === 2 && !isNaN(endYear)) {
          const century = Math.floor(startYear / 100) * 100;
          endYear = century + endYear;
        }
        if (!isNaN(endYear)) {
          return { startYear, endYear, session: `${startYear}-${String(endYear).slice(-2)}` };
        }
      }
    }
  }

  // Fallback to current date based academic year
  const now = new Date();
  const currentMonth = now.getMonth(); // 0 is Jan, 3 is Apr
  const currentYear = now.getFullYear();
  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;
  return { startYear, endYear, session: `${startYear}-${String(endYear).slice(-2)}` };
}

/**
 * Given a session like "2026-27", returns an array of 12 academic months:
 * April <startYear> ... March <endYear>
 */
export function getAcademicYearMonths(session?: string): AcademicMonthInfo[] {
  const { startYear, endYear } = parseAcademicSession(session);

  return ACADEMIC_MONTH_NAMES.map((month) => {
    const isStartYear = [
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ].includes(month);

    const year = isStartYear ? startYear : endYear;

    return {
      label: `${month} ${year}`,
      month,
      year,
    };
  });
}

export const PREK_CLASSES = ['PG', 'NUR', 'LKG', 'UKG'] as const;
export type StudentClass = (typeof PREK_CLASSES)[number];

export const CLASS_ORDER: Record<string, number> = {
  PG: 1,
  NUR: 2,
  LKG: 3,
  UKG: 4,
};

/**
 * Standard fee schedule
 * Monthly: PG = 1250, NUR = 1350, LKG = 1450, UKG = 1550
 * Annual = 3000
 * Form Fee = 300
 */
export const DEFAULT_MONTHLY_FEES: Record<string, number> = {
  PG: 1250,
  NUR: 1350,
  LKG: 1450,
  UKG: 1550,
};

export const DEFAULT_ANNUAL_FEE = 3000;
export const DEFAULT_FORM_FEE = 300;

export function getDefaultMonthlyFee(className?: string): number {
  const norm = normalizeClass(className);
  return DEFAULT_MONTHLY_FEES[norm] || 1250;
}

export function normalizeClass(c?: string): string {
  if (!c || typeof c !== 'string') return '';
  const trimmed = c.trim().toUpperCase();
  if (trimmed === 'PG' || trimmed === 'PLAYGROUP' || trimmed === 'PRE-NURSERY' || trimmed === 'PRENURSERY') return 'PG';
  if (trimmed === 'NUR' || trimmed === 'NURSERY') return 'NUR';
  if (trimmed === 'LKG' || trimmed === 'L.K.G.' || trimmed === 'KG1' || trimmed === 'KG-1') return 'LKG';
  if (trimmed === 'UKG' || trimmed === 'U.K.G.' || trimmed === 'KG2' || trimmed === 'KG-2') return 'UKG';
  return trimmed;
}

/**
 * Helper to format amount in Indian Rupees (₹)
 */
export function formatINR(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num === null || num === undefined) return '₹0';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

/**
 * Returns clean Month + Year (e.g. "August 2026" or "August2026") based on academic session
 */
export function getAcademicMonthYear(monthName: string, session?: string, withSpace = true): string {
  if (!monthName) return '';
  const { startYear, endYear } = parseAcademicSession(session);
  const mCapitalized = monthName.trim().charAt(0).toUpperCase() + monthName.trim().slice(1).toLowerCase();
  const isStartYear = [
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ].includes(mCapitalized);

  const year = isStartYear ? startYear : endYear;
  return withSpace ? `${mCapitalized} ${year}` : `${mCapitalized}${year}`;
}

/**
 * Sanitizes names for filesystem safety (removes / \ : * ? " < > | spaces & unsafe symbols)
 * Example: "Aarav Kumar" -> "AaravKumar", "Aarav Kumar-Singh" -> "AaravKumar-Singh"
 */
export function sanitizeFilenamePart(text: string): string {
  if (!text) return '';
  // Split on spaces/underscores, capitalize segments, and remove invalid characters
  return text
    .split(/[\s_]+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .join('')
    .replace(/[\\/:*?"<>|'’`]/g, '');
}

/**
 * Maps fee types to safe filename labels:
 * Monthly -> MonthYear (e.g. August2026)
 * Annual -> Annual
 * Uniform -> Uniform
 * Books/Stationery -> BooksStationery
 * Miscellaneous -> Miscellaneous
 */
export function generateReceiptFilename(params: {
  studentName?: string;
  studentClass?: string;
  feeType?: string;
  month?: string | null;
  session?: string;
}): string {
  const cleanName = sanitizeFilenamePart(params.studentName || 'Student');
  const cleanClass = sanitizeFilenamePart(normalizeClass(params.studentClass) || params.studentClass || 'Class');

  const fType = (params.feeType || 'monthly').toLowerCase();

  let feeSuffix = '';
  if (fType === 'monthly') {
    const monthStr = params.month || 'April';
    feeSuffix = getAcademicMonthYear(monthStr, params.session, false);
  } else if (fType === 'annual') {
    feeSuffix = 'Annual';
  } else if (fType === 'uniform') {
    feeSuffix = 'Uniform';
  } else if (fType === 'books_stationery' || fType === 'books') {
    feeSuffix = 'BooksStationery';
  } else if (fType === 'misc' || fType === 'miscellaneous') {
    feeSuffix = 'Miscellaneous';
  } else {
    feeSuffix = sanitizeFilenamePart(params.feeType || 'Fee');
  }

  return `${cleanName}_${cleanClass}_${feeSuffix}.pdf`;
}

/**
 * Converts Indian Rupee number to Words
 * Example: 1500 -> "Rupees One Thousand Five Hundred Only"
 */
export function numberToWordsINR(amount: number | string): string {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return singleDigits[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let str = '';
    if (hundred) str += singleDigits[hundred] + ' Hundred';
    if (rest) {
      if (str) str += ' and ';
      str += convertTwoDigits(rest);
    }
    return str;
  }

  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  const parts: string[] = [];
  if (crore) parts.push(convertTwoDigits(crore) + ' Crore');
  if (lakh) parts.push(convertTwoDigits(lakh) + ' Lakh');
  if (thousand) parts.push(convertTwoDigits(thousand) + ' Thousand');
  if (rem) parts.push(convertThreeDigits(rem));

  return 'Rupees ' + parts.join(' ') + ' Only';
}

/**
 * Standard date formatter across the site returning DD-MM-YYYY format
 */
export function formatDateDDMMYYYY(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) {
      // Check if input was already in DD/MM/YYYY or DD-MM-YYYY format
      if (typeof dateInput === 'string' && /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateInput.trim())) {
        return dateInput.trim().replace(/\//g, '-');
      }
      return String(dateInput);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return String(dateInput || '-');
  }
}


