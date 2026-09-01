-- ==============================================================================
-- Schema Migration: Preschool Fee Tracker
-- Description: Creates tables for users, students, fee_payments, and settings.
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    mother_name TEXT,
    class TEXT NOT NULL,
    admission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    monthly_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    transport_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    admission_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    annual_charges NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    concession NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. FEE PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session TEXT NOT NULL, -- e.g. "2025-26", "2026-27"
    month TEXT, -- 'January', 'February', ... (required for monthly fees, NULL for others)
    fee_type TEXT NOT NULL CHECK (fee_type IN ('monthly', 'annual', 'uniform', 'books_stationery', 'misc')),
    payment_mode TEXT NOT NULL, -- 'cash', 'online', 'cheque', 'upi', 'bank_transfer'
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    uniform_type TEXT CHECK (uniform_type IN ('winter', 'summer', 'sports', 'red_white', NULL)),
    uniform_size TEXT, -- '20', '22', '24', '26', etc.
    description TEXT,
    receipt_number TEXT UNIQUE NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    collected_by TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT DEFAULT 'Preschool Name',
    school_logo TEXT DEFAULT '',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    academic_session TEXT DEFAULT '2026-27',
    receipt_prefix TEXT DEFAULT 'FNL-',
    default_monthly_fee NUMERIC(12, 2) DEFAULT 0,
    default_transport_fee NUMERIC(12, 2) DEFAULT 0,
    currency_symbol TEXT DEFAULT '₹',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

-- Unique monthly fee protection: A student can only have ONE monthly fee per session + month
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_monthly_fee 
ON fee_payments (student_id, session, month) 
WHERE fee_type = 'monthly';

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON students (admission_no);
CREATE INDEX IF NOT EXISTS idx_students_name ON students (name);
CREATE INDEX IF NOT EXISTS idx_students_class ON students (class);
CREATE INDEX IF NOT EXISTS idx_students_status ON students (status);

CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments (student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_session ON fee_payments (session);
CREATE INDEX IF NOT EXISTS idx_fee_payments_month ON fee_payments (month);
CREATE INDEX IF NOT EXISTS idx_fee_payments_fee_type ON fee_payments (fee_type);
CREATE INDEX IF NOT EXISTS idx_fee_payments_payment_date ON fee_payments (payment_date);
CREATE INDEX IF NOT EXISTS idx_fee_payments_receipt_number ON fee_payments (receipt_number);

-- ==============================================================================
-- AUTOMATIC TIMESTAMP UPDATES TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_users_updated_at ON users;
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_students_updated_at ON students;
CREATE TRIGGER tr_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_fee_payments_updated_at ON fee_payments;
CREATE TRIGGER tr_fee_payments_updated_at BEFORE UPDATE ON fee_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_settings_updated_at ON settings;
CREATE TRIGGER tr_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
