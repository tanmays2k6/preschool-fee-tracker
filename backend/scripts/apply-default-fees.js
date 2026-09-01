import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

const feeMap = {
  PG: 1250,
  NUR: 1350,
  LKG: 1450,
  UKG: 1550,
};

async function updateAllStudentDefaultFees() {
  console.log('Updating all existing students with standardized default fees...');

  const { data: students, error } = await supabase.from('students').select('id, name, class, monthly_fee, annual_charges');
  if (error) {
    console.error('Error fetching students:', error.message);
    return;
  }

  for (const s of students) {
    const defaultMonthly = feeMap[s.class] || 1250;
    const defaultAnnual = 3000;

    const { error: updateErr } = await supabase
      .from('students')
      .update({
        monthly_fee: defaultMonthly,
        annual_charges: defaultAnnual,
      })
      .eq('id', s.id);

    if (updateErr) {
      console.error(`Error updating ${s.name}:`, updateErr.message);
    } else {
      console.log(`Updated ${s.name} (${s.class}) -> Monthly: ₹${defaultMonthly}, Annual: ₹${defaultAnnual}`);
    }
  }

  // Also update default settings
  const { data: settings } = await supabase.from('settings').select('id').limit(1);
  if (settings && settings.length > 0) {
    await supabase.from('settings').update({
      default_monthly_fee: 1250,
    }).eq('id', settings[0].id);
    console.log('Updated default settings monthly fee to ₹1250');
  }

  console.log('Finished updating student default fees.');
}

updateAllStudentDefaultFees();
