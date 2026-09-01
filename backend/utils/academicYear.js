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
];

export const PREK_CLASSES = ['PG', 'NUR', 'LKG', 'UKG'];

export const CLASS_ORDER = {
  PG: 1,
  NUR: 2,
  LKG: 3,
  UKG: 4,
};

export const DEFAULT_MONTHLY_FEES = {
  PG: 1250,
  NUR: 1350,
  LKG: 1450,
  UKG: 1550,
};

export const DEFAULT_ANNUAL_FEE = 3000;
export const DEFAULT_FORM_FEE = 300;

export function getDefaultMonthlyFee(className) {
  const norm = normalizeClass(className);
  return DEFAULT_MONTHLY_FEES[norm] || 1250;
}

/**
 * Normalizes class strings (e.g. "PLAYGROUP" -> "PG", "NURSERY" -> "NUR", "Pre-Nursery" -> "PG")
 */
export function normalizeClass(c) {
  if (!c || typeof c !== 'string') return '';
  const trimmed = c.trim().toUpperCase();
  if (trimmed === 'PG' || trimmed === 'PLAYGROUP' || trimmed === 'PRE-NURSERY' || trimmed === 'PRENURSERY') return 'PG';
  if (trimmed === 'NUR' || trimmed === 'NURSERY') return 'NUR';
  if (trimmed === 'LKG' || trimmed === 'L.K.G.' || trimmed === 'KG1' || trimmed === 'KG-1') return 'LKG';
  if (trimmed === 'UKG' || trimmed === 'U.K.G.' || trimmed === 'KG2' || trimmed === 'KG-2') return 'UKG';
  return trimmed;
}

/**
 * Validates if class is one of the 4 standard preschool classes
 */
export function isValidClass(c) {
  const norm = normalizeClass(c);
  return PREK_CLASSES.includes(norm);
}

/**
 * Parses session string (e.g. "2026-27" or "2026-2027") into startYear and endYear numbers.
 * Defaults to current academic year if invalid.
 */
export function parseAcademicSession(session) {
  if (typeof session === 'string') {
    const parts = session.trim().split('-');
    if (parts.length === 2) {
      const startYear = parseInt(parts[0], 10);
      let endYear = parseInt(parts[1], 10);
      if (!isNaN(startYear)) {
        if (parts[1].length === 2 && !isNaN(endYear)) {
          // e.g. "2026-27" -> century from startYear
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
export function getAcademicYearMonths(session) {
  const { startYear, endYear } = parseAcademicSession(session);

  return ACADEMIC_MONTH_NAMES.map((month) => {
    // April through December belong to startYear; January through March belong to endYear
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
