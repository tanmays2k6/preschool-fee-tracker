
-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  class TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create policies for students (admin only access)
CREATE POLICY "Authenticated users can view students" 
ON public.students 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert students" 
ON public.students 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update students" 
ON public.students 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete students" 
ON public.students 
FOR DELETE 
TO authenticated
USING (true);

-- Create fee_payments table
CREATE TABLE public.fee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  transaction_id TEXT NOT NULL,
  fee_month TEXT,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('monthly', 'annual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on fee_payments
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for fee_payments (admin only access)
CREATE POLICY "Authenticated users can view payments" 
ON public.fee_payments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert payments" 
ON public.fee_payments 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments" 
ON public.fee_payments 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete payments" 
ON public.fee_payments 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on students
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_students_name ON public.students(name);
CREATE INDEX idx_students_class ON public.students(class);
CREATE INDEX idx_fee_payments_student_id ON public.fee_payments(student_id);
CREATE INDEX idx_fee_payments_payment_date ON public.fee_payments(payment_date);
