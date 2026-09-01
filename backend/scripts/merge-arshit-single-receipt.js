import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

async function mergeArshitPatelPayments() {
  console.log('Consolidating Arshit Patel payments back into a single receipt of ₹8,146...');

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

  // 2. Delete split auxiliary payments (-ANNUAL, -FORM, -UNIFORM, -BOOKS, -KIT)
  const { error: delErr } = await supabase
    .from('fee_payments')
    .delete()
    .eq('student_id', arshit.id)
    .neq('receipt_number', 'FNL-2026-0001');

  if (delErr) {
    console.error('Error removing split payments:', delErr.message);
  } else {
    console.log('Removed extra split payment rows.');
  }

  // 3. Update FNL-2026-0001 to full total ₹8,146 with complete itemized description & month = September
  const compositeDescription = "Monthly Tuition (September): ₹1250 | Annual Charges: ₹3000 | Admission Form Fee: ₹300 | Uniform (red_white, Size 22): ₹2000 | Books/Stationery (Books, Notebooks & Stationery Set): ₹846 | kit: ₹750";

  const { error: updErr } = await supabase
    .from('fee_payments')
    .update({
      amount: 8146,
      fee_type: 'misc',
      month: 'September',
      description: compositeDescription,
    })
    .eq('receipt_number', 'FNL-2026-0001');

  if (updErr) {
    console.error('Error updating primary payment:', updErr.message);
  } else {
    console.log('✅ Successfully consolidated Arshit Patel payment into a single receipt of ₹8,146 under FNL-2026-0001!');
  }
}

mergeArshitPatelPayments();
