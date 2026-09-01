import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

async function fixPaymentsAndInspect() {
  console.log('Inspecting fee_payments...');

  const { data: payments, error } = await supabase
    .from('fee_payments')
    .select(`
      id,
      student_id,
      session,
      month,
      fee_type,
      amount,
      description,
      receipt_number,
      students (
        id,
        name,
        admission_no,
        class
      )
    `);

  if (error) {
    console.error('Error fetching payments:', error);
    return;
  }

  console.log(`Found ${payments.length} fee payment records:`);
  for (const p of payments) {
    console.log(`- Receipt: ${p.receipt_number}, Student: ${p.students?.name} (${p.students?.class}), FeeType: ${p.fee_type}, Month: ${p.month}, Amount: ₹${p.amount}`);
    console.log(`  Description: ${p.description}`);

    // If description has Monthly Tuition and month is null or fee_type was misc
    if (p.description && p.description.includes('Monthly Tuition') && !p.month) {
      // Extract month name from description, e.g. "Monthly Tuition (September): ₹1250"
      const match = p.description.match(/Monthly Tuition \(([A-Za-z]+)\)/i);
      const extractedMonth = match ? match[1] : 'September';

      console.log(`  --> Updating payment ${p.receipt_number} to set month = "${extractedMonth}" and fee_type = "monthly"`);
      const { error: updErr } = await supabase
        .from('fee_payments')
        .update({
          month: extractedMonth,
          fee_type: 'monthly',
        })
        .eq('id', p.id);

      if (updErr) {
        console.error(`  Error updating payment ${p.receipt_number}:`, updErr.message);
      } else {
        console.log(`  ✅ Successfully updated ${p.receipt_number}`);
      }
    }
  }

  // Also check if any other payments need month populated if description has (Month)
  for (const p of payments) {
    if (p.description && !p.month) {
      const match = p.description.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i);
      if (match) {
        const m = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        console.log(`  --> Setting month = "${m}" on payment ${p.receipt_number}`);
        await supabase.from('fee_payments').update({ month: m }).eq('id', p.id);
      }
    }
  }
}

fixPaymentsAndInspect();
