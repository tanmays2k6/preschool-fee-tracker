import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

async function fixArshitPatelPayment() {
  console.log('Fixing Arshit Patel payment records...');

  // 1. Find Arshit Patel
  const { data: students } = await supabase
    .from('students')
    .select('id, name, class')
    .ilike('name', '%Arshit%');

  if (!students || students.length === 0) {
    console.log('No student named Arshit found');
    return;
  }

  const arshit = students[0];
  console.log(`Found student: ${arshit.name} (${arshit.id})`);

  // 2. Find his payments
  const { data: payments } = await supabase
    .from('fee_payments')
    .select('*')
    .eq('student_id', arshit.id);

  console.log(`Found ${payments?.length || 0} payments for Arshit:`);
  for (const p of payments || []) {
    console.log(`- Receipt: ${p.receipt_number}, Type: ${p.fee_type}, Month: ${p.month}, Amount: ₹${p.amount}`);

    // If amount is 8146 (the composite bundle), split into standard monthly fee of 1250 and separate items
    if (p.amount === 8146 || p.amount === '8146.00') {
      console.log('Updating primary payment to exact monthly fee amount: ₹1250');
      await supabase
        .from('fee_payments')
        .update({
          amount: 1250,
          fee_type: 'monthly',
          month: 'September',
        })
        .eq('id', p.id);

      console.log('Inserting individual other items (Annual 3000, Form 300, Uniform 2000, Books 846, Kit 750)...');
      
      const otherItems = [
        {
          student_id: arshit.id,
          session: p.session,
          month: null,
          fee_type: 'annual',
          payment_mode: p.payment_mode,
          amount: 3000,
          description: 'Annual Charges & Development Fee',
          receipt_number: `${p.receipt_number}-ANNUAL`,
          payment_date: p.payment_date,
          remarks: `Part of Receipt: ${p.receipt_number}`,
        },
        {
          student_id: arshit.id,
          session: p.session,
          month: null,
          fee_type: 'misc',
          payment_mode: p.payment_mode,
          amount: 300,
          description: 'Admission / Application Form Fee',
          receipt_number: `${p.receipt_number}-FORM`,
          payment_date: p.payment_date,
          remarks: `Part of Receipt: ${p.receipt_number}`,
        },
        {
          student_id: arshit.id,
          session: p.session,
          month: null,
          fee_type: 'uniform',
          payment_mode: p.payment_mode,
          amount: 2000,
          uniform_type: 'red_white',
          uniform_size: '22',
          description: 'Uniform (red_white, Size 22)',
          receipt_number: `${p.receipt_number}-UNIFORM`,
          payment_date: p.payment_date,
          remarks: `Part of Receipt: ${p.receipt_number}`,
        },
        {
          student_id: arshit.id,
          session: p.session,
          month: null,
          fee_type: 'books_stationery',
          payment_mode: p.payment_mode,
          amount: 846,
          description: 'Books, Notebooks & Stationery Set',
          receipt_number: `${p.receipt_number}-BOOKS`,
          payment_date: p.payment_date,
          remarks: `Part of Receipt: ${p.receipt_number}`,
        },
        {
          student_id: arshit.id,
          session: p.session,
          month: null,
          fee_type: 'misc',
          payment_mode: p.payment_mode,
          amount: 750,
          description: 'Activity Kit',
          receipt_number: `${p.receipt_number}-KIT`,
          payment_date: p.payment_date,
          remarks: `Part of Receipt: ${p.receipt_number}`,
        },
      ];

      for (const item of otherItems) {
        await supabase.from('fee_payments').insert(item);
      }

      console.log('✅ Successfully itemized Arshit Patel payments!');
    }
  }
}

fixArshitPatelPayment();
